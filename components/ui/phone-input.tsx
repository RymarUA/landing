"use client";

import { forwardRef, InputHTMLAttributes, useEffect, useState } from "react";
import { isValidUkrainianPhone, normalizePhone } from "@/lib/phone-utils";

interface PhoneInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onPhoneChange?: (phone: string, isValid: boolean) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ onChange, onBlur, value, onPhoneChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("");
    const [isValid, setIsValid] = useState(false);

    // Format phone for display: +38 (067) 123-45-67
    const formatPhoneDisplay = (phone: string): string => {
      const digits = phone.replace(/\D/g, "");
      
      if (digits.length === 0) return "";
      
      // If starts with 380, remove it for display formatting
      let displayDigits = digits;
      if (digits.startsWith("380") && digits.length >= 12) {
        displayDigits = digits.slice(2);
      } else if (digits.startsWith("80") && digits.length >= 11) {
        displayDigits = digits.slice(1);
      }
      
      // Take only last 10 digits for display
      displayDigits = displayDigits.slice(-10);
      
      if (displayDigits.length <= 3) {
        return `+38 (${displayDigits}`;
      } else if (displayDigits.length <= 6) {
        return `+38 (${displayDigits.slice(0, 3)}) ${displayDigits.slice(3)}`;
      } else {
        return `+38 (${displayDigits.slice(0, 3)}) ${displayDigits.slice(3, 6)}-${displayDigits.slice(6, 8)}-${displayDigits.slice(8, 10)}`;
      }
    };

    // Initialize display value from prop
    useEffect(() => {
      if (value !== undefined && String(value) !== displayValue) {
        setDisplayValue(formatPhoneDisplay(String(value)));
      }
    }, [value, displayValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Only allow digits, +, (, ), -, and space
      const cleanedInput = inputValue.replace(/[^\d\+\(\)\-\s]/g, "");
      
      // Extract digits for validation
      const digits = cleanedInput.replace(/\D/g, "");
      
      // Update display value with proper formatting
      const formattedDisplay = formatPhoneDisplay(digits);
      setDisplayValue(formattedDisplay);
      
      // Check if valid
      const valid = isValidUkrainianPhone(digits);
      setIsValid(valid);
      
      // Get normalized phone for form
      let normalizedPhone = "";
      try {
        normalizedPhone = normalizePhone(digits);
      } catch {
        normalizedPhone = digits;
      }
      
      // Call original onChange if provided
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: normalizedPhone,
          },
        };
        onChange(syntheticEvent);
      }
      
      // Call custom callback
      if (onPhoneChange) {
        onPhoneChange(normalizedPhone, valid);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Format the phone on blur and ensure form gets the normalized value
      const digits = displayValue.replace(/\D/g, "");
      
      if (digits.length > 0) {
        const formatted = formatPhoneDisplay(digits);
        setDisplayValue(formatted);
        
        // Ensure the form gets the normalized value on blur
        let normalizedPhone = "";
        try {
          normalizedPhone = normalizePhone(digits);
        } catch {
          normalizedPhone = digits;
        }
        
        // Trigger onChange with normalized value on blur
        if (onChange) {
          const syntheticEvent = {
            ...e,
            target: {
              ...e.target,
              value: normalizedPhone,
            },
          };
          onChange(syntheticEvent);
        }
      }
      
      if (onBlur) {
        onBlur(e);
      }
    };

    return (
      <input
        {...props}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="+38 (067) 123-45-67"
        className={`${props.className} ${!isValid && displayValue.length > 0 ? 'border-red-300 focus:ring-red-200' : ''}`}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";
