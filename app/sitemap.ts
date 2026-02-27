import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://kleap.co";

  // Add your static pages here
  const staticPages = [
    "",
    // Uncomment pages as you enable them:
    // '/pricing',
    // '/blog',
    // '/contact',
    // '/login',
    // '/signup',
  ];

  const staticRoutes = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // Add dynamic routes here (e.g., blog posts)
  // const blogPosts = await getBlogPosts()
  // const dynamicRoutes = blogPosts.map((post) => ({
  //   url: `${baseUrl}/blog/${post.slug}`,
  //   lastModified: post.updatedAt,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.6,
  // }))

  return [...staticRoutes];
}
