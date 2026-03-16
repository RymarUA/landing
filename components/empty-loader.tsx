// Empty loader component - used to block tailwind-cdn-loader in production
// This file intentionally exports an empty component to prevent CDN loading on Vercel
export default function EmptyLoader() {
  return null;
}
