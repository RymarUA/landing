import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import typescriptEslint from "@typescript-eslint/eslint-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      // 🔴 ERROR - Prevents runtime crashes
      "react-hooks/rules-of-hooks": "error", // Hooks in correct order = no crash
      "react/jsx-no-undef": "error", // Undefined components = crash
      "@next/next/no-html-link-for-pages": "error", // Wrong links = broken navigation
      "no-dupe-keys": "error", // Duplicate keys = unexpected behavior

      // 🟡 WARN - Quality helpers, non-blocking
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "react-hooks/exhaustive-deps": "warn", // Deps manquantes = bugs subtils
      "react/no-unescaped-entities": "warn", // HTML cassé dans JSX

      // 🟢 OFF - Flexibility for AI (no crash risk)
      "@typescript-eslint/no-explicit-any": "off", // Any = flexible but safe
      "@typescript-eslint/no-empty-object-type": "off", // Empty interface = OK
      "@next/next/no-img-element": "off", // <img> vs <Image> = perf only
      "prefer-const": "off", // let vs const = style only
      "no-undef": "off", // TypeScript handles + React auto-import
    },
  },
];

export default eslintConfig;
