# AI Rules - Template (Next.js 16 pre-configured)

#⛔ NEVER RECREATE EXISTING FILES
##🔒 PROTECTED FILES (NEVER TOUCH): -`public/_kleap/*` (all system files) -`components/kleap-scripts.tsx`

## Pre-configured (DON'T RECREATE):

- Configs: package.json, next/tailwind/tsconfig, app/layout.tsx
- Components: 10 ui/\*, hero, navbar, footer, pricing, features, testimonials, forms, auth
- Pages: login, signup, pricing, contact, blog
- Utils: lib/_, context/_
  ##✅ WORKFLOW:

1. List files FIRST
2. MODIFY existing (Edit/MultiEdit)
3. IMPORT existing - don't rewrite
4. CREATE only new

##🚫 BLOG SYSTEM (CRITICAL - DO NOT MODIFY):
The blog system is pre-configured and working. To prevent errors:

- **NEVER modify lib/blog.ts** - it uses hardcoded data to avoid MDX build issues
- **NEVER delete existing blog articles** in app/blog/
- **NEVER create page.mdx directly** - causes "createContext only works in Client Components" error
- **For blog content**: Only modify the markdown content inside existing .mdx files
- **Blog structure**: Each article has page.mdx with metadata and content
- The blog index page at app/blog/page.tsx works correctly - don't touch it

##🚨 MISSING COMPONENT FIX (CRITICAL - SAVE 3 CREDITS):
When build error shows "Cannot find module '@/components/ui/X'":
❌ DON'T: searchFiles, grep, or ls (you already know it's missing!)
✅ DO: Create immediately from shadcn/ui template
Steps:

1. Create components/ui/X.tsx (copy standard shadcn pattern)
2. Add @radix-ui/react-X to package.json if needed
3. checkRuntime → refreshApp (HMR handles updates)
4. restartApp ONLY if checkRuntime shows crash
   Example: slider missing → create slider.tsx + add @radix-ui/react-slider + checkRuntime → done (3 steps max)
   ⚠️ restartApp requires checkRuntime first (system protection)

# Stack

Next.js 16, App Router, TypeScript, Turbopack, Tailwind CSS, Radix UI, Framer Motion, MDX, Lucide
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

✅ EXIST: Button, Card, Input, Textarea, Label, Checkbox, Switch, Select, RadioGroup, Form
❌ DON'T EXIST: Badge, Dialog, Tabs, Avatar, Tooltip, Popover, Sheet, Accordion, Alert, Progress, Skeleton, DropdownMenu
→ If you need a missing component, BUILD IT with Tailwind CSS (don't try to import!)

## Feature components:

Hero, Features, Testimonials, Pricing, CTA, Footer, Newsletter, Contact, Login, Signup, KleapForm, Navbar
#Forms
Use KleapForm component with fields array. Types: text, email, tel, textarea, number, select, checkbox, radio, url
#Env Vars
Auto: NEXT_PUBLIC_APP_ID, NEXT_PUBLIC_FORMS_API_URL (Kleap-provided)
#KleapForm Usage
Never modify component. Customize via fields array. title = form name in Data Management.

```typescript
const fields = [{ name: 'email', label: 'Email', type: 'email', required: true }];
<KleapForm formId="lead" title="Contact" fields={fields} />
```
