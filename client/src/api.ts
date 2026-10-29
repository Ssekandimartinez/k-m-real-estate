export interface Category {
  id: string;
  name: string;
  slug: string;
  kind: string;
  description: string;
  image?: string;
}
export interface Entry {
  id: string;
  kind: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  status: string;
  featured: boolean;
  verified: boolean;
  categoryId: string | null;
  category?: Category;
  location: string;
  price: string | number | null;
  currency: string;
  transaction: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  amenities: string[];
  specs: Record<string, any>;
  seoTitle: string;
  seoDescription: string;
  images: { url: string; alt: string; mediaId?: string; id?: string }[];
  publishedAt: string | null;
  createdAt: string;
}
export interface Company {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  overview: string;
  mission: string;
  vision: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  logo: string;
  footer: string;
  values: { title: string; text: string }[];
  socialLinks: { label: string; url: string }[];
  whatsappVerified: boolean;
  whatsappNumber: string;
  seoDescription: string;
  primaryColor: string;
  featuredSections: string[];
  analyticsId: string;
}
export interface Staff {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  active?: boolean;
}
export interface CustomerRequest {
  id: string;
  kind: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  service: string;
  message: string;
  quantities: string;
  status: string;
  notes: string;
  followUpAt: string | null;
  preferredDate: string | null;
  createdAt: string;
  notificationStatus: string;
  entry?: { title: string };
}
export let csrfToken = "";
export const setCsrf = (value: string) => {
  csrfToken = value;
};
export async function api<T = any>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch("/api" + url, {
    ...options,
    credentials: "same-origin",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error +
        (data.details
          ? " — " +
            data.details
              .map((v: any) => `${v.path.join(".")}: ${v.message}`)
              .join("; ")
          : ""),
    );
  return data;
}
export const write = (method: string, data?: unknown): RequestInit => ({
  method,
  ...(data === undefined ? {} : { body: JSON.stringify(data) }),
});
export const destinations: Record<string, string> = {
  property: "properties",
  service: "services",
  product: "catalogue",
  project: "projects",
  post: "blog",
  team: "about",
  testimonial: "about",
};
