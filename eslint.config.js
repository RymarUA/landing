import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // 🔴 ERROR - Prévient les crashes runtime critiques
      "react-hooks/rules-of-hooks": "error", // Hooks dans le bon ordre = pas de crash
      "react/jsx-no-undef": "error", // Composants non définis = crash
      "@next/next/no-html-link-for-pages": "error", // Mauvais links = navigation cassée
      "no-dupe-keys": "error", // Clés dupliquées = comportement inattendu

      // 🟡 WARN - Aide la qualité mais non-bloquant
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "react-hooks/exhaustive-deps": "warn", // Deps manquantes = bugs subtils
      "react/no-unescaped-entities": "warn", // HTML cassé dans JSX

      // 🟢 OFF - Flexibilité pour l'AI (pas de risque de crash)
      "@typescript-eslint/no-explicit-any": "off", // Any = flexible mais sûr
      "@typescript-eslint/no-empty-object-type": "off", // Interface vide = OK
      "@next/next/no-img-element": "off", // <img> vs <Image> = perf only
      "prefer-const": "off", // let vs const = style only
      "no-undef": "off", // TypeScript gère ça + React auto-import
    },
  },
];

export default eslintConfig;
