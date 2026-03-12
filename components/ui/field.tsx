/**
 * components/ui/field.tsx
 * 
 * Reusable form field wrapper component.
 * Provides consistent styling for labels and error messages.
 */

import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  error?: string | { message?: string };
  children: ReactNode;
  required?: boolean;
  className?: string;
}

export function Field({ label, error, children, required, className = "" }: FieldProps) {
  const errorMessage = typeof error === "string" ? error : error?.message;
  
  return (
    <div className={`flex flex-col gap-1.5 relative ${className}`}>
      <label className="text-sm font-semibold text-[#24312E]">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {errorMessage && (
        <p className="text-xs text-[#1F6B5E] font-medium mt-0.5">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
