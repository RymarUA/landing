/**
 * lib/name-utils.ts
 *
 * Utilities for validating and formatting Ukrainian names and surnames.
 */

/**
 * Validates if a string contains only letters (Ukrainian, Cyrillic, and Latin).
 * Allows spaces, hyphens, and apostrophes for compound names.
 * 
 * @param name - Name string to validate
 * @returns true if valid name format
 */
export function isValidName(name: string): boolean {
  // Allow Ukrainian, Cyrillic, and Latin letters, plus spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Zа-яА-ЯёЁєЄіІїЇґҐ'\-\s]+$/;
  return nameRegex.test(name.trim()) && name.trim().length >= 2;
}

/**
 * Formats a name by capitalizing the first letter of each word.
 * Handles Ukrainian, Cyrillic, and Latin characters.
 * 
 * @param name - Name string to format
 * @returns Formatted name with capitalized first letters
 */
export function formatName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => {
      // Capitalize first letter, keep rest as is
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Validates and formats a name in one step.
 * 
 * @param name - Name string to validate and format
 * @returns Formatted name if valid, throws error if invalid
 */
export function validateAndFormatName(name: string): string {
  if (!isValidName(name)) {
    throw new Error("Ім'я може містити лише букви, пробіли, дефіс та апостроф");
  }
  
  const formatted = formatName(name);
  if (formatted.length < 2) {
    throw new Error("Ім'я занадто коротке (мінімум 2 символи)");
  }
  if (formatted.length > 60) {
    throw new Error("Ім'я занадто довге (максимум 60 символів)");
  }
  
  return formatted;
}

/**
 * Validates and formats a surname in one step.
 * 
 * @param surname - Surname string to validate and format
 * @returns Formatted surname if valid, throws error if invalid
 */
export function validateAndFormatSurname(surname: string): string {
  if (!isValidName(surname)) {
    throw new Error("Прізвище може містити лише букви, пробіли, дефіс та апостроф");
  }
  
  const formatted = formatName(surname);
  if (formatted.length < 2) {
    throw new Error("Прізвище занадто коротке (мінімум 2 символи)");
  }
  if (formatted.length > 60) {
    throw new Error("Прізвище занадто довге (максимум 60 символів)");
  }
  
  return formatted;
}
