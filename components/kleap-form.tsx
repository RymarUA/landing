"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface KleapFormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "url"
    | "number";
  placeholder?: string;
  required?: boolean;
  options?: (string | { label: string; value: string })[]; // For select, radio
  rows?: number; // For textarea
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
}

/**
 * KleapForm - Universal form component with automatic submission to Kleap API
 *
 * @example
 * ```tsx
 * <KleapForm
 *   formId="contact"
 *   title="Contact Us"
 *   fields={[
 *     { name: "name", label: "Name", type: "text", required: true },
 *     { name: "email", label: "Email", type: "email", required: true },
 *     { name: "message", label: "Message", type: "textarea", required: true }
 *   ]}
 *   submitText="Send Message"  // ⚠️ Use submitText, NOT submitButtonText
 *   successMessage="Thank you! We'll get back to you soon."
 * />
 * ```
 */
interface KleapFormProps {
  formId: string;
  title?: string;
  description?: string;
  fields: KleapFormField[];
  /** Text for submit button - Use "submitText" NOT "submitButtonText" */
  submitText?: string;
  /** Message shown after successful submission */
  successMessage?: string;
  className?: string;
  honeypot?: boolean; // Anti-spam honeypot field
}

export function KleapForm({
  formId,
  title,
  description,
  fields,
  submitText = "Submit",
  successMessage = "Thank you! Your submission has been received.",
  className = "",
  honeypot = true,
}: KleapFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Dynamically create Zod schema based on fields
  const schemaShape: Record<string, z.ZodType> = {};

  fields.forEach((field) => {
    let fieldSchema: z.ZodType;

    switch (field.type) {
      case "email":
        fieldSchema = z
          .string()
          .email(field.validation?.message || "Please enter a valid email");
        break;
      case "number":
        fieldSchema = z.coerce.number();
        if (field.validation?.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(
            field.validation.min,
            field.validation.message,
          );
        }
        if (field.validation?.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(
            field.validation.max,
            field.validation.message,
          );
        }
        break;
      case "url":
        fieldSchema = z
          .string()
          .url(field.validation?.message || "Please enter a valid URL");
        break;
      case "checkbox":
        fieldSchema = z.boolean();
        break;
      default:
        fieldSchema = z.string();
        if (field.validation?.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodString).min(
            field.validation.min,
            field.validation.message,
          );
        }
        if (field.validation?.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodString).max(
            field.validation.max,
            field.validation.message,
          );
        }
        if (field.validation?.pattern) {
          fieldSchema = (fieldSchema as z.ZodString).regex(
            field.validation.pattern,
            field.validation.message,
          );
        }
    }

    if (field.required && field.type !== "checkbox") {
      fieldSchema = fieldSchema.refine((val) => val !== "", {
        message: `${field.label} is required`,
      });
    }

    schemaShape[field.name] =
      field.required || field.type === "checkbox"
        ? fieldSchema
        : fieldSchema.optional();
  });

  const formSchema = z.object(schemaShape);
  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: fields.reduce(
      (acc, field) => {
        acc[field.name] = field.type === "checkbox" ? false : "";
        return acc;
      },
      {} as Record<string, any>,
    ),
  });

  async function onSubmit(values: FormData) {
    setSubmitError("");

    try {
      // Get app_id from environment or URL
      const envAppId = process.env.NEXT_PUBLIC_APP_ID;
      const urlAppId = new URLSearchParams(window.location.search).get(
        "app_id",
      );
      const appId = envAppId || urlAppId || "";

      // 🔍 DEBUG HELPER - Log app_id sources
      console.group("🔍 KLEAP FORM DEBUG - App ID Detection");

      if (!appId) {
        console.error(
          "🚨 CRITICAL: app_id is empty! Form submission will fail.",
        );
      }
      console.groupEnd();

      // Create form data
      const formData = new FormData();
      formData.append("app_id", appId);
      formData.append("form_id", formId);
      formData.append("form_name", title || formId);

      // Add all form values
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      // 📤 DEBUG HELPER - Log request details
      console.group("📤 KLEAP FORM REQUEST");
      for (const [_key, _value] of formData.entries()) {
        // Debug logging entries
      }
      console.groupEnd();

      // Submit to Kleap's form API
      const response = await fetch("https://form.kleap.co", {
        method: "POST",
        body: formData,
      });

      // 📥 DEBUG HELPER - Log response details
      const responseText = await response.text();
      console.group("📥 KLEAP FORM RESPONSE");

      try {
        const responseJson = JSON.parse(responseText);
        if (!responseJson.success && responseJson.error) {
          console.error("❌ API Error:", responseJson.error);
        }
      } catch {
        // Handle error silently
      }
      console.groupEnd();

      if (response.ok) {
        setSubmitted(true);
        form.reset();
      } else {
        throw new Error(
          `Failed to submit form: ${response.status} ${responseText}`,
        );
      }
    } catch (e) {
      console.error("Form submission error:", e);
      setSubmitError(
        "Sorry, there was an error submitting your form. Please try again.",
      );
    }
  }

  if (submitted) {
    return (
      <Card className={`text-center ${className}`}>
        <CardContent className="pt-10 pb-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-7 w-7 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-card-foreground">
            {successMessage}
          </p>
          <Button
            onClick={() => setSubmitted(false)}
            variant="outline"
            size="sm"
            className="mt-5"
          >
            Submit Another Response
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {(title || description) && (
            <CardHeader>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
          )}

          <CardContent className={title || description ? "" : "pt-6"}>
            <div className="space-y-5">
              {fields.map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      {field.type !== "checkbox" && (
                        <Label htmlFor={field.name}>
                          {field.label}
                          {field.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                      )}
                      <FormControl>
                        {field.type === "textarea" ? (
                          <Textarea
                            id={field.name}
                            rows={field.rows || 4}
                            placeholder={field.placeholder}
                            className="resize-none"
                            {...(formField as any)}
                          />
                        ) : field.type === "select" ? (
                          <select
                            id={field.name}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...(formField as any)}
                          >
                            <option value="">Select an option</option>
                            {field.options?.map((option) => {
                              const val =
                                typeof option === "string"
                                  ? option
                                  : option.value;
                              const lbl =
                                typeof option === "string"
                                  ? option
                                  : option.label;
                              return (
                                <option key={val} value={val}>
                                  {lbl}
                                </option>
                              );
                            })}
                          </select>
                        ) : field.type === "checkbox" ? (
                          <div className="flex items-start gap-3 pt-1">
                            <Checkbox
                              id={field.name}
                              checked={Boolean(formField.value)}
                              onCheckedChange={formField.onChange}
                            />
                            <Label
                              htmlFor={field.name}
                              className="text-sm font-normal leading-snug text-muted-foreground cursor-pointer"
                            >
                              {field.placeholder || field.label}
                            </Label>
                          </div>
                        ) : field.type === "radio" && field.options ? (
                          <RadioGroup
                            value={formField.value as string}
                            onValueChange={formField.onChange}
                            className="pt-1"
                          >
                            {field.options.map((option) => {
                              const val =
                                typeof option === "string"
                                  ? option
                                  : option.value;
                              const lbl =
                                typeof option === "string"
                                  ? option
                                  : option.label;
                              const radioId = `${field.name}-${val}`;
                              return (
                                <div
                                  key={val}
                                  className="flex items-center gap-3"
                                >
                                  <RadioGroupItem value={val} id={radioId} />
                                  <Label
                                    htmlFor={radioId}
                                    className="font-normal text-muted-foreground cursor-pointer"
                                  >
                                    {lbl}
                                  </Label>
                                </div>
                              );
                            })}
                          </RadioGroup>
                        ) : (
                          <Input
                            id={field.name}
                            type={field.type}
                            placeholder={field.placeholder}
                            {...(formField as any)}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              {/* Honeypot field to catch bots */}
              {honeypot && (
                <input
                  type="text"
                  name="_honeypot"
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                />
              )}

              {submitError && (
                <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3">
                  <p className="text-sm text-destructive">{submitError}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full"
                size="lg"
              >
                {form.formState.isSubmitting ? "Submitting..." : submitText}
              </Button>
            </div>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
