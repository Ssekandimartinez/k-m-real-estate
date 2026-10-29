export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const company = {
  name: "K&M Real Estate",
  tagline: "Real Estate. Real Results.",
  phone: "+211 924 265 999",
  email: "kmrealestate38@gmail.com",
  address: "Juba Town, opposite Gabat Primary School, Juba, South Sudan",
  overview:
    "K&M Real Estate is a full-service real estate solutions provider specializing in residential brokerage, commercial leasing, property management, and strategic property investments. We connect individuals, families, businesses and institutions with property, construction, design and supply solutions in South Sudan.",
  mission:
    "To deliver exceptional, data-driven real estate services that exceed client expectations. We provide transparent communication, rigorous property analysis, and top-tier marketing platforms to help buyers find their dream spaces and landlords secure high-performing tenants.",
  vision:
    "To be the most trusted and forward-thinking real estate partner in the region, recognized for executing seamless property journeys and building multi-generational wealth through real asset appreciation.",
  heroTitle: "Your Property. Our Expertise. Real Results.",
  heroDescription:
    "Professional real estate, construction, architectural design, consultancy, and supply solutions for individuals, businesses, and institutions in South Sudan.",
  heroImage: "/images/architecture.webp",
  logo: "/branding/logo.webp",
  footer:
    "A considered approach to property, construction and supply. Based in Juba. Focused on you.",
  values: [
    {
      title: "Integrity",
      text: "Honest advice, transparent communication and responsible property transactions.",
    },
    {
      title: "Excellence",
      text: "Thoughtful customer service supported by market knowledge and attention to detail.",
    },
    {
      title: "Collaboration",
      text: "Shared expertise and teamwork, from the first conversation to project delivery.",
    },
    {
      title: "Technology and Innovation",
      text: "Modern tools to make property services and communication easier.",
    },
  ],
  socialLinks: [],
  whatsappVerified: false,
  whatsappNumber: "211924265999",
  seoDescription:
    "K&M Real Estate provides property, construction, design, building materials and general supply services in Juba, South Sudan.",
  primaryColor: "#681F36",
  featuredSections: ["properties", "projects", "posts", "testimonials"],
  analyticsId: "",
};
export const groups = [
  {
    marker: "CATEGORY A",
    name: "Real Estate & Property Services",
    kind: "service",
    image: "/images/consultancy.webp",
    intro:
      "From finding the right space to caring for an existing investment, we help you make informed property decisions. Tell us your objectives, location and timeline so we can agree the next steps.",
  },
  {
    marker: "CATEGORY B",
    name: "Construction & Design",
    kind: "service",
    image: "/images/construction.webp",
    intro:
      "Bring your building plans into focus with coordinated construction and design support. We discuss your brief, site conditions, budget and schedule before preparing an appropriate scope.",
  },
  {
    marker: "CATEGORY C",
    name: "Construction Materials",
    kind: "product",
    image: "/images/materials.webp",
    intro:
      "Source materials around your project requirements. Share specifications, quantities and delivery location for a tailored quotation. Prices and availability are confirmed individually.",
  },
  {
    marker: "CATEGORY D",
    name: "General Supplies & Procurement",
    kind: "product",
    image: "/images/supplies.webp",
    intro:
      "Procurement support for businesses, contractors, NGOs and institutions. Share your specification, quantity, delivery schedule and quality requirements for an itemized quotation.",
  },
  {
    marker: "CATEGORY E",
    name: "Electrical, Electronics & IT Solutions",
    kind: "product",
    image: "/images/electrical.webp",
    intro:
      "Electrical equipment, electronics and IT procurement shaped around your operational needs. Our team confirms technical specifications, compatibility, delivery and availability before quoting.",
  },
  {
    marker: "CATEGORY F",
    name: "Plumbing & Technical Services",
    kind: "service",
    image: "/images/plumbing.webp",
    intro:
      "Practical plumbing support for homes, workplaces and facilities. Describe the installation or fault, location and access requirements so we can assess the work and prepare a quotation.",
  },
];
