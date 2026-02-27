(() => {
  console.log("[kleap-react-tagger] Initializing React component tagger");

  // Counter for unique IDs

  // Helper to get component path for better identification
  function getComponentPath(element) {
    const path = [];
    let current = element;
    let depth = 0;
    const maxDepth = 5; // Limit depth to avoid too long paths

    while (current && current !== document.body && depth < maxDepth) {
      let identifier = current.tagName.toLowerCase();

      // Add class or id for better identification
      if (current.id) {
        identifier += `#${current.id}`;
      } else if (current.className && typeof current.className === "string") {
        const firstClass = current.className.trim().split(" ")[0];
        if (firstClass && !firstClass.startsWith("_")) {
          identifier += `.${firstClass}`;
        }
      }

      path.unshift(identifier);
      current = current.parentElement;
      depth++;
    }

    return path.join(" > ");
  }

  // Generate unique ID based on element position and content
  function generateUniqueId(element) {
    const path = getComponentPath(element);
    const text = element.textContent?.trim().substring(0, 20) || "";
    const tag = element.tagName.toLowerCase();

    // Create hash from path and content for uniqueness
    const hashInput = `${path}-${text}-${tag}`;
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return `kleap-${Math.abs(hash).toString(36)}`;
  }

  // Enhanced approach: tag all elements intelligently
  function tagAllElements() {
    const elements = document.querySelectorAll("*:not([data-kleap-id])");
    let taggedCount = 0;

    elements.forEach((element) => {
      // Skip script, style, and other non-visual elements
      const tagName = element.tagName.toLowerCase();
      if (
        [
          "script",
          "style",
          "meta",
          "link",
          "head",
          "title",
          "html",
          "body",
          "noscript",
        ].includes(tagName)
      ) {
        return;
      }

      // Don't skip SVG elements - they're visual!
      // Allow SVG but skip internal SVG elements like path, circle, etc
      if (element instanceof SVGElement && !["svg", "g"].includes(tagName)) {
        return;
      }

      // Skip elements that are purely decorative or layout
      if (element.getAttribute("aria-hidden") === "true") {
        return;
      }

      // Create unique ID based on element content and position
      const kleapId = generateUniqueId(element);
      const kleapPath = getComponentPath(element);

      // Better naming for components
      let kleapName = tagName;

      // Try to get a meaningful name from various sources
      if (element.className && typeof element.className === "string") {
        const classes = element.className
          .trim()
          .split(" ")
          .filter((c) => c && !c.startsWith("_"));
        if (classes.length > 0) {
          kleapName = `${tagName}.${classes[0]}`;
        }
      } else if (element.id) {
        kleapName = `${tagName}#${element.id}`;
      } else if (element.getAttribute("role")) {
        kleapName = `${tagName}[role=${element.getAttribute("role")}]`;
      } else if (element.getAttribute("aria-label")) {
        kleapName = `${tagName}[${element.getAttribute("aria-label")}]`;
      }

      // Store ID and metadata for easy retrieval
      element.setAttribute("data-kleap-id", kleapId);
      element.setAttribute("data-kleap-name", kleapName);
      element.setAttribute("data-kleap-path", kleapPath);

      // Store the actual text content for this element
      const textContent = element.textContent?.trim();
      if (textContent && textContent.length > 0) {
        element.setAttribute("data-kleap-text", textContent.substring(0, 100));
      }
      taggedCount++;
    });

    if (taggedCount > 0) {
      console.log(`[kleap-react-tagger] Tagged ${taggedCount} elements`);
    }
  }

  // Watch for DOM changes and tag new elements
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let hasNewElements = false;

      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && !node.hasAttribute("data-kleap-id")) {
              hasNewElements = true;
            }
          });
        }
      });

      if (hasNewElements) {
        tagAllElements();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log("[kleap-react-tagger] Mutation observer setup complete");
  }

  // Initialize when DOM is ready
  function initialize() {
    if (!document.body) {
      setTimeout(initialize, 100);
      return;
    }

    // Tag existing elements
    tagAllElements();

    // Setup observer for future elements
    setupMutationObserver();

    // Also re-tag periodically to catch any missed elements
    setInterval(tagAllElements, 2000);
  }

  // Start initialization
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }

  console.log("[kleap-react-tagger] Setup complete");
})();
