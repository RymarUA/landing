# AI SaaS Template

This is the default template for all new Kleap apps. It includes a complete Next.js 15 starter with everything configured.

## ⚡ Template Synchronization

After making changes to this template, you MUST sync it to Supabase:

```bash
# Sync only modified files
npm run sync-template

# Force update all files (even if unchanged)
npm run sync-template:force
```

## 📁 Template Structure

- `app/` - Next.js 15 App Router pages
- `components/` - React components
- `lib/` - Utility functions
- `public/` - Static assets
- `AI_RULES.md` - Instructions for the AI when working with this template

## 🚀 How It Works

1. Template files are stored in Supabase with `app_id = -1`
2. When a new app is created, files are copied via SQL (DB-to-DB)
3. Copy time: <1 second (vs 20-60 seconds with traditional method)

## ✏️ Making Changes

1. Edit files in this directory
2. Run `npm run sync-template`
3. New apps will use the updated template

## ⚠️ Important Notes

- Changes only affect NEW apps, not existing ones
- The `.kleapignore` file controls which files are synced
- Binary files (images, fonts) are automatically handled
- The sync script shows which files are added/updated/deleted

## 🔍 Verifying Sync

After syncing, the script will show:

- ✅ Unchanged files (already in sync)
- ➕ New files added
- 📝 Updated files
- ❌ Deleted files

## 🛠️ Troubleshooting

If sync fails:

1. Check Supabase credentials in `.env.local`
2. Ensure you have the migration applied (see CLAUDE.md)
3. Check the console for detailed error messages
