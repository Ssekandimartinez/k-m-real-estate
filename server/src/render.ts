const esc = (v: unknown) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export function renderHome(c: Record<string, any> | null) {
  const responsive =
    !c?.heroImage || c.heroImage === "/images/architecture.webp";
  const nav = [
    ["/", "Home"],
    ["/about", "About Us"],
    ["/properties", "Properties"],
    ["/services", "Services"],
    ["/projects", "Projects"],
    ["/blog", "Insights"],
    ["/contact", "Contact Us"],
  ];
  return `<div class="topline"><span>Juba, South Sudan</span><a href="tel:${esc(c?.phone)}">${esc(c?.phone)}</a><span class="top-tag">A partner for every property journey.</span></div><header class="header"><a class="brand brand-logo" href="/" aria-label="K&amp;M Real Estate home"><img src="${esc(c?.logo || "/branding/logo.webp")}" alt=""/></a><nav>${nav.map(([url, label]) => `<a href="${url}">${label}</a>`).join("")}<a class="button small" href="/quote">Request a Quote ↗</a></nav></header><main id="main"><section class="hero"><img class="hero-image" src="${esc(c?.heroImage || "/images/architecture.webp")}" ${responsive ? 'srcset="/images/architecture-mobile.webp 900w, /images/architecture.webp 1800w" sizes="100vw"' : ""} alt="Contemporary residential architecture, shown for inspiration" fetchpriority="high"/><div class="hero-shade"></div><div class="container hero-content"><div><p class="eyebrow light"><span></span> ROOTED IN JUBA. BUILT AROUND YOU.</p><h1>${esc(c?.heroTitle || "Your Property. Our Expertise. Real Results.")}</h1><p>${esc(c?.heroDescription)}</p><div class="actions"><a class="button sand" href="/properties">Explore Properties ↗</a><a class="button outline-light" href="/services">Our Services ↗</a></div></div><div class="hero-caption"><span>01 / A NEW PERSPECTIVE</span><span>Spaces for living.<br/>Possibilities for tomorrow.</span></div></div></section><section class="section container"><h2>About K&amp;M Real Estate</h2><p>${esc(c?.overview)}</p><a href="/services">Explore our property, construction, design and supply services</a></section></main>`;
}
export function renderDetail(
  c: Record<string, any> | null,
  item: Record<string, any>,
) {
  const header = renderHome(c).split('<main id="main">')[0];
  const gallery = item.images.length
    ? `<div class="gallery"><img class="gallery-main" src="${esc(item.images[0].url)}" alt="${esc(item.images[0].alt)}"/><div class="thumbnails">${item.images.map((image: Record<string, string>, i: number) => `<button aria-label="Show image ${i + 1}: ${esc(image.alt)}" aria-pressed="${i === 0}"><img src="${esc(image.url)}" alt=""/></button>`).join("")}</div></div>`
    : "";
  return `${header}<main id="main"><section class="page-hero"><div class="container"><p class="eyebrow">${esc(item.category?.name || item.kind)}</p><h1>${esc(item.title)}</h1><p>${esc(item.summary)}</p></div></section><section class="section container detail-grid"><div>${gallery}<div class="prose">${item.body}</div></div><aside class="detail-aside"><p class="eyebrow">LET’S TAKE THE NEXT STEP</p><h2>${item.kind === "property" ? "Make this your next move." : "Tell us what you have in mind."}</h2><p>Speak to K&M Real Estate for information, a consultation or a tailored quotation.</p><a class="text-link" href="tel:${esc(c?.phone)}">${esc(c?.phone)}</a><p>Loading secure request form…</p></aside></section></main>`;
}
