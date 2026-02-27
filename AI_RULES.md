# AI Rules - Template (Next.js 16 pre-configured)

## REQUEST CLASSIFICATION (READ FIRST!)

<simple_request>
**SIMPLE REQUEST** ("hello world", "test", "simple page", "just show X"):

- ONLY modify `app/page.tsx` (the homepage). Put ALL content there. 1-2 tool calls. DONE.
- DO NOT create hero.tsx, footer.tsx, features.tsx, or new routes
  </simple_request>

<full_site_request>
**FULL SITE** (detailed description, "landing page for X business", multiple sections):

- Create components (hero, features, footer), then import in page.tsx
  </full_site_request>

<critical>DEFAULT TO SIMPLE. Don't over-engineer.</critical>

## KEY FILE: app/page.tsx = HOMEPAGE

This is the "/" route - what users see first. Template shows "Welcome to Your App".
For simple requests, REPLACE this content directly. No new files needed.

## NEVER RECREATE EXISTING FILES

## PROTECTED: `public/_kleap/*`, `components/kleap-scripts.tsx`

## Pre-configured (DON'T RECREATE):

- Configs: package.json, next/tailwind/tsconfig, app/layout.tsx
- UI Components: 10 in components/ui/\*
- Utils: lib/_, context/_

## WORKFLOW:

1. CLASSIFY request (simple vs full site)
2. USE KNOWN PATHS (components/, app/, lib/) - DON'T ls/explore
3. MODIFY existing with edit() - don't recreate
4. CREATE only if truly needed

<forbidden>NEVER: ls→ls→ls loops. One ls max, then BUILD.</forbidden>

## BLOG SYSTEM (CRITICAL - DO NOT MODIFY):

The blog system is pre-configured and working. To prevent errors:

- **NEVER modify lib/blog.ts** - it uses hardcoded data to avoid MDX build issues
- **NEVER delete existing blog articles** in app/blog/
- **NEVER create page.mdx directly** - causes "createContext only works in Client Components" error
- **For blog content**: Only modify the markdown content inside existing .mdx files
- **Blog structure**: Each article has page.mdx with metadata and content
- The blog index page at app/blog/page.tsx works correctly - don't touch it

## MISSING COMPONENT FIX (CRITICAL - SAVE 3 CREDITS):

When build error shows "Cannot find module '@/components/ui/X'":
<forbidden>DON'T: searchFiles, grep, or ls (you already know it's missing!)</forbidden>
<allowed>DO: Create immediately from shadcn/ui template</allowed>
Steps:

1. Create components/ui/X.tsx (copy standard shadcn pattern)
2. Add @radix-ui/react-X to package.json if needed
3. checkRuntime → refreshApp (HMR handles updates)
4. restartApp ONLY if checkRuntime shows crash
   Example: slider missing → create slider.tsx + add @radix-ui/react-slider + checkRuntime → done (3 steps max)
   <warning>restartApp requires checkRuntime first (system protection)</warning>

# Stack

Next.js 16, React 19, App Router, TypeScript, Turbopack, Tailwind CSS, Radix UI, Framer Motion, MDX, Lucide
Package versions are pinned — never modify package.json version numbers.
#Structure
app/(auth)/_ login/signup | app/blog/_ | app/pricing/ | app/contact/ | components/_ | lib/_
#Design
Aceternity UI, Framer inspiration, dark mode, mobile-first
#SEO
Customize ALL metadata (title, description, OG). Specific keywords, no generic text. Headlines: value+benefits. CTAs: action words.
#Key Files
Homepage: app/page.tsx (START HERE)
Nav: components/site-header.tsx, navbar/\*
Pages: pricing, contact, blog, auth

# Components (IMPORT - DON'T RECREATE)

## UI Components (/components/ui/ - 10 components):

<allowed>EXIST: Button, Card, Input, Textarea, Label, Checkbox, Switch, Select, RadioGroup, Form</allowed>
<forbidden>DON'T EXIST: Badge, Dialog, Tabs, Avatar, Tooltip, Popover, Sheet, Accordion, Alert, Progress, Skeleton, DropdownMenu</forbidden>

- If you need a missing component, BUILD IT with Tailwind CSS (don't try to import!)

## Feature components:

Hero, Features, Testimonials, Pricing, CTA, Footer, Newsletter, Contact, Login, Signup, KleapForm, Navbar
#Forms - MANDATORY
<critical>ALL forms MUST use KleapForm from @/components/kleap-form. NEVER create vanilla HTML forms, custom form handlers, or use external form services (formspree, etc).</critical>
Types: text, email, tel, textarea, number, select, checkbox, radio, url
For select/radio fields, add options: ["Option A", "Option B"]
#Env Vars
Auto: NEXT_PUBLIC_APP_ID, NEXT_PUBLIC_FORMS_API_URL (Kleap-provided)
#KleapForm Usage
NEVER modify the kleap-form.tsx component. Customize ONLY via props: formId, title, description, fields, submitText, successMessage.
The title prop = form name shown in the Kleap Data Management dashboard.

```typescript
import { KleapForm } from "@/components/kleap-form";

// Contact form example
<KleapForm
  formId="contact"
  title="Contact Us"
  fields={[
    { name: "name", label: "Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "service", label: "Service", type: "select", options: ["Web Design", "SEO", "Marketing"], required: true },
    { name: "message", label: "Message", type: "textarea", required: true }
  ]}
  submitText="Send Message"
  successMessage="Thank you! We'll get back to you soon."
/>

// Newsletter example
<KleapForm
  formId="newsletter"
  title="Newsletter"
  fields={[{ name: "email", label: "Email", type: "email", required: true }]}
  submitText="Subscribe"
  successMessage="You're subscribed!"
/>
```

ANY page with contact, booking, quote, newsletter, registration, feedback, or lead capture = KleapForm. No exceptions.
