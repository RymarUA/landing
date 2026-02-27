/**
 * Kleap Source Loader
 *
 * Webpack pre-loader that injects data-kleap-source="file:line" into JSX elements.
 * Enables the Kleap design panel to precisely locate elements in source code.
 *
 * Only active in development mode (next dev).
 * Production builds never use this loader.
 */
"use strict";

const path = require("path");

module.exports = function kleapSourceLoader(source) {
  const resourcePath = this.resourcePath;
  if (!resourcePath) return source;

  const relativePath = path
    .relative(this.rootContext || process.cwd(), resourcePath)
    .replace(/\\/g, "/");

  // Skip system files
  if (
    relativePath.includes("node_modules") ||
    relativePath.includes("_kleap/") ||
    relativePath.includes(".next/")
  ) {
    return source;
  }

  const lines = source.split("\n");
  const result = lines.map((line, index) => {
    const lineNum = index + 1;

    if (line.includes("data-kleap-source")) return line;

    // Skip non-JSX lines
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed.startsWith("import ") ||
      trimmed.startsWith("export {") ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("* ") ||
      trimmed.startsWith("*/")
    ) {
      return line;
    }

    // Match JSX opening tags preceded by valid JSX context characters.
    // Avoids false positives from comparison operators (a < b).
    // Prefix: start-of-line, whitespace, (, {, ,, ;, :, ?, >, =, !
    // Tag: PascalCase component or lowercase HTML element
    // Suffix: whitespace, >, or end-of-line (multi-line JSX)
    return line.replace(
      /(^|[\s({,;:?>!=])(<([A-Z][a-zA-Z0-9.]*|[a-z][a-z0-9-]*))([\s>]|$)/g,
      (match, prefix, tagOpen, _tagName, after) => {
        return `${prefix}${tagOpen} data-kleap-source="${relativePath}:${lineNum}"${after}`;
      },
    );
  });

  return result.join("\n");
};
