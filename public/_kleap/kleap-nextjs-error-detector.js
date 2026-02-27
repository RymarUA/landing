/**
 * Kleap Next.js Error Detector
 *
 * Detects and reports Next.js build/runtime errors to parent window via postMessage
 * Works with Next.js 15, 16, and Turbopack error overlay systems
 *
 * Version: 2.1.0 - Fix false positive on CSS shadow DOM content
 */
(function () {
  console.debug("[Kleap] Next.js error detector loaded v2.1.0");

  // Only run inside iframe
  const isInsideIframe = window.parent !== window;
  if (!isInsideIframe) {
    console.debug("[Kleap] Not inside iframe, skipping error detection");
    return;
  }

  const PARENT_TARGET_ORIGIN = "*";

  // Track reported errors to avoid duplicates
  const reportedErrors = new Set();
  const ERROR_COOLDOWN_MS = 5000;

  /**
   * Send error report to parent window
   */
  function reportError(errorData) {
    // Ensure we have valid error data
    if (!errorData || typeof errorData !== "object") {
      console.debug("[Kleap] Invalid error data, skipping report");
      return;
    }

    // Ensure required fields exist
    if (!errorData.type) errorData.type = "build-error";
    if (!errorData.message) errorData.message = "Unknown error";

    const errorKey = `${errorData.type}-${errorData.message}`;

    // Check if already reported recently
    if (reportedErrors.has(errorKey)) {
      console.debug("[Kleap] Error already reported, skipping:", errorKey);
      return;
    }

    // Mark as reported
    reportedErrors.add(errorKey);
    setTimeout(() => reportedErrors.delete(errorKey), ERROR_COOLDOWN_MS);

    console.log("[Kleap] Reporting error to parent:", errorData);

    window.parent.postMessage(
      {
        type: "nextjs-build-error",
        payload: errorData,
      },
      PARENT_TARGET_ORIGIN,
    );
  }

  /**
   * Extract error details from Next.js error overlay
   * Supports Next.js 15, 16, and Turbopack
   */
  function extractNextJsError(container) {
    try {
      console.debug(
        "[Kleap] Extracting error from:",
        container.tagName,
        container.id,
        container.className,
      );

      // Method 1: Next.js 15 - Check for data-nextjs-dialog attributes
      const errorTitle = container.querySelector("[data-nextjs-dialog-header]");
      const errorBody = container.querySelector("[data-nextjs-dialog-body]");

      if (errorTitle || errorBody) {
        const title = errorTitle?.textContent?.trim() || "";
        const body = errorBody?.textContent?.trim() || "";

        return {
          type: "build-error",
          message: title || "Build error detected",
          details: body,
          fullText: `${title}\n\n${body}`.trim(),
          source: "nextjs-dialog",
        };
      }

      // Method 2: Next.js 16 / Turbopack - Look for shadow DOM or portal content
      // Next.js 16 uses nextjs-portal custom element with shadow DOM
      if (
        container.tagName === "NEXTJS-PORTAL" ||
        container.id?.includes("nextjs-portal")
      ) {
        const shadowRoot = container.shadowRoot;
        if (shadowRoot) {
          const errorText = shadowRoot.textContent?.trim();
          if (errorText && errorText.length > 10) {
            // 🔥 FIX: Skip CSS content (Bootstrap Reboot styles that Next.js injects)
            // These are styling for the error overlay itself, NOT actual errors
            const isCssContent =
              errorText.startsWith(":host") ||
              errorText.startsWith("/*") ||
              errorText.includes("box-sizing: border-box") ||
              errorText.includes("Bootstrap Reboot") ||
              /^[a-z-]+\s*\{/.test(errorText); // CSS selector pattern

            if (isCssContent) {
              console.debug("[Kleap] Skipping CSS content from shadow DOM");
              return null;
            }

            // Also require actual error keywords to avoid false positives
            const hasErrorKeyword = [
              "Error",
              "error",
              "Module not found",
              "Can't resolve",
              "Failed to compile",
              "Unhandled",
              "SyntaxError",
              "TypeError",
            ].some((keyword) => errorText.includes(keyword));

            if (!hasErrorKeyword) {
              console.debug(
                "[Kleap] No error keywords in shadow DOM content, skipping",
              );
              return null;
            }

            const lines = errorText
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean);
            return {
              type: "build-error",
              message: lines[0]?.substring(0, 200) || "Build error detected",
              details: errorText.substring(0, 1000),
              fullText: errorText.substring(0, 2000),
              source: "nextjs-portal-shadow",
            };
          }
        }
      }

      // Method 3: Look for error message in generic containers (h1, h2, h4, pre)
      const headings = container.querySelectorAll("h1, h2, h4");
      const pre = container.querySelector("pre");
      const code = container.querySelector("code");

      if (headings.length > 0 || pre || code) {
        let title = "";
        for (const h of headings) {
          const text = h?.textContent?.trim();
          if (text && text.length > 5) {
            title = text;
            break;
          }
        }

        const details =
          pre?.textContent?.trim() || code?.textContent?.trim() || "";

        if (title || details) {
          return {
            type: "build-error",
            message: title || "Build error",
            details: details.substring(0, 1000),
            fullText:
              container.textContent?.trim()?.substring(0, 2000) ||
              "Unknown error",
            source: "generic-heading",
          };
        }
      }

      // Method 4: Generic text extraction - check for error keywords
      const text = container.textContent?.trim();
      if (text && text.length > 10) {
        // Check for common Next.js/React error patterns
        const errorPatterns = [
          "Module not found",
          "Can't resolve",
          "Build Error",
          "Compile Error",
          "Runtime Error",
          "Unhandled Runtime Error",
          "Error:",
          "SyntaxError",
          "TypeError",
          "ReferenceError",
          "Failed to compile",
          "Import trace",
          "Caused by:",
          "at (",
        ];

        const hasErrorPattern = errorPatterns.some((pattern) =>
          text.includes(pattern),
        );

        if (hasErrorPattern) {
          // Extract first meaningful line as message
          const lines = text
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
          let message = "Build error detected";

          // Find the most relevant line (usually contains "Error")
          for (const line of lines) {
            if (
              line.includes("Error") ||
              line.includes("Module not found") ||
              line.includes("Can't resolve")
            ) {
              message = line.substring(0, 200);
              break;
            }
          }

          return {
            type: "build-error",
            message: message,
            details: text.substring(0, 1000),
            fullText: text.substring(0, 2000),
            source: "text-pattern",
          };
        }
      }

      // Method 5: Fallback - if it's an error overlay but we can't extract details
      // Still report something so the parent knows an error occurred
      if (
        container.id?.includes("error") ||
        container.className?.includes?.("error") ||
        container.getAttribute?.("data-nextjs-dev-overlay") !== null
      ) {
        const rawText = container.textContent?.trim();
        if (rawText && rawText.length > 5) {
          return {
            type: "build-error",
            message: rawText.substring(0, 200) || "Error overlay detected",
            details: rawText.substring(0, 1000),
            fullText: rawText.substring(0, 2000),
            source: "fallback",
          };
        }
      }

      console.debug("[Kleap] Could not extract error details from container");
      return null;
    } catch (error) {
      console.error("[Kleap] Error extracting Next.js error:", error);
      return null;
    }
  }

  /**
   * Watch for Next.js error overlay in DOM
   */
  function watchForNextJsErrors() {
    console.debug("[Kleap] Setting up Next.js error detection");

    // Configuration for MutationObserver
    const config = {
      childList: true,
      subtree: true, // Watch all descendants (Next.js uses portals)
      attributes: true,
      attributeFilter: [
        "data-nextjs-dev-overlay",
        "data-nextjs-dialog",
        "data-nextjs-toast",
      ],
    };

    // Callback when DOM changes
    const observerCallback = function (mutationsList) {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;

            // Check for Next.js error overlay elements
            // Supports Next.js 15, 16, and Turbopack
            const isErrorOverlay =
              node.id?.includes("nextjs") ||
              node.id?.includes("error") ||
              node.tagName === "NEXTJS-PORTAL" ||
              node.getAttribute?.("data-nextjs-dialog") !== null ||
              node.getAttribute?.("data-nextjs-toast") !== null ||
              node.getAttribute?.("data-nextjs-dev-overlay") !== null ||
              node.className?.includes?.("nextjs") ||
              node.className?.includes?.("error-overlay") ||
              node.className?.includes?.("dev-overlay");

            if (isErrorOverlay) {
              console.log(
                "[Kleap] Detected Next.js error overlay:",
                node.tagName,
                node.id,
              );

              // Wait a bit for content to populate (especially for shadow DOM)
              setTimeout(() => {
                const errorData = extractNextJsError(node);
                if (errorData) {
                  reportError(errorData);
                }
              }, 200); // Increased timeout for shadow DOM content
            }

            // Also check children recursively
            if (node.querySelector) {
              const selectors = [
                "[data-nextjs-dialog]",
                "[data-nextjs-toast]",
                "[data-nextjs-dev-overlay]",
                "nextjs-portal",
                '[id*="nextjs"]',
                '[id*="error"]',
                '[class*="error-overlay"]',
              ];

              const errorChildren = node.querySelectorAll(selectors.join(", "));
              errorChildren.forEach((child) => {
                setTimeout(() => {
                  const errorData = extractNextJsError(child);
                  if (errorData) {
                    reportError(errorData);
                  }
                }, 200);
              });
            }
          }
        }

        // Also check for attribute changes (overlay appearing)
        if (mutation.type === "attributes") {
          const node = mutation.target;
          if (node.nodeType === Node.ELEMENT_NODE) {
            const errorData = extractNextJsError(node);
            if (errorData) {
              reportError(errorData);
            }
          }
        }
      }
    };

    // Start observing when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        console.debug("[Kleap] DOM loaded, starting error detection");
        const observer = new MutationObserver(observerCallback);
        observer.observe(document.body || document.documentElement, config);

        // Check for existing errors
        checkExistingErrors();
      });
    } else {
      console.debug("[Kleap] DOM already loaded, starting error detection");
      const observer = new MutationObserver(observerCallback);
      observer.observe(document.body || document.documentElement, config);

      // Check for existing errors
      checkExistingErrors();
    }
  }

  /**
   * Check for errors that already exist in the DOM
   */
  function checkExistingErrors() {
    console.debug("[Kleap] Checking for existing errors");

    try {
      // Look for Next.js error elements (supports 15, 16, and Turbopack)
      const selectors = [
        "[data-nextjs-dialog]",
        "[data-nextjs-toast]",
        "[data-nextjs-dev-overlay]",
        "nextjs-portal",
        '[id*="nextjs"][id*="error"]',
        '[id*="__next_error"]',
        'div[class*="error-overlay"]',
        'div[class*="dev-overlay"]',
      ];

      selectors.forEach((selector) => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((element) => {
            console.log(
              "[Kleap] Found existing error element:",
              element.tagName,
              element.id,
            );
            const errorData = extractNextJsError(element);
            if (errorData) {
              reportError(errorData);
            }
          });
        } catch {
          // Ignore invalid selector errors
        }
      });
    } catch (error) {
      console.error("[Kleap] Error checking existing errors:", error);
    }
  }

  /**
   * Also intercept console.error for build errors
   * Next.js sometimes logs errors to console before showing overlay
   */
  const originalConsoleError = console.error;
  console.error = function (...args) {
    // Call original
    originalConsoleError.apply(console, args);

    // Check if it looks like a Next.js error
    const message = args
      .map((arg) => {
        if (typeof arg === "string") return arg;
        if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
        try {
          return String(arg);
        } catch {
          return "[Object]";
        }
      })
      .join(" ");

    // Extended error patterns for Next.js 16 and Turbopack
    const errorPatterns = [
      "Module not found",
      "Can't resolve",
      "Build Error",
      "Compile Error",
      "Failed to compile",
      "Turbopack build error",
      "Error: ",
      "SyntaxError:",
      "TypeError:",
      "ReferenceError:",
      "ModuleNotFoundError",
      "import trace for requested module",
    ];

    const hasErrorPattern = errorPatterns.some((pattern) =>
      message.toLowerCase().includes(pattern.toLowerCase()),
    );

    if (hasErrorPattern) {
      console.log("[Kleap] Detected build error in console.error");

      reportError({
        type: "build-error",
        message: message.substring(0, 200),
        details: message.substring(0, 1000),
        fullText: message.substring(0, 2000),
        source: "console.error",
      });
    }
  };

  /**
   * Also listen for unhandled errors and rejections
   */
  window.addEventListener("error", function (event) {
    const error = event.error;
    if (error && error.message) {
      const message = error.message;
      if (
        message.includes("Module not found") ||
        message.includes("Can't resolve") ||
        message.includes("Failed to compile")
      ) {
        reportError({
          type: "runtime-error",
          message: message.substring(0, 200),
          details: error.stack?.substring(0, 1000) || message,
          fullText: error.stack?.substring(0, 2000) || message,
          source: "window.error",
        });
      }
    }
  });

  window.addEventListener("unhandledrejection", function (event) {
    const reason = event.reason;
    if (reason && (reason.message || typeof reason === "string")) {
      const message = reason.message || String(reason);
      if (
        message.includes("Module not found") ||
        message.includes("Can't resolve") ||
        message.includes("Failed to compile")
      ) {
        reportError({
          type: "runtime-error",
          message: message.substring(0, 200),
          details: reason.stack?.substring(0, 1000) || message,
          fullText: reason.stack?.substring(0, 2000) || message,
          source: "unhandledrejection",
        });
      }
    }
  });

  // Start watching
  watchForNextJsErrors();

  console.debug("[Kleap] Next.js error detector initialized");
})();
