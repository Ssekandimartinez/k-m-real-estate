import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useState,
} from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Menu,
  X,
  Phone,
  MapPin,
  ChevronDown,
  Mail,
} from "lucide-react";
import { api, type Company } from "./api";
import Analytics from "./Analytics";
const MediaGallery = lazy(() => import("./MediaGallery"));
import {
  About,
  Collection,
  Contact,
  Detail,
  Home,
  Legal,
  NotFound,
  Services,
} from "./Public";
const Admin = lazy(() => import("./Admin"));
const CompanyContext = createContext<Company | null>(null);
export const useCompany = () => useContext(CompanyContext);
export default function App() {
  const { data, error } = useQuery({
    queryKey: ["company"],
    queryFn: () => api<Company>("/settings"),
  });
  const location = useLocation();
  useEffect(() => {
    if (data?.primaryColor)
      document.documentElement.style.setProperty("--wine", data.primaryColor);
  }, [data?.primaryColor]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <CompanyContext.Provider value={data || null}>
      {location.pathname.startsWith("/admin") ? (
        <Suspense
          fallback={<p className="loading">Loading staff workspace…</p>}
        >
          <Admin />
        </Suspense>
      ) : (
        <>
          <a className="skip" href="#main">
            Skip to content
          </a>
          <Header />
          {error && (
            <div className="notice error" role="alert">
              We couldn’t load the latest company content. Please try again or
              call +211 924 265 999.
            </div>
          )}
          <main id="main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route
                path="/gallery"
                element={
                  <Suspense
                    fallback={
                      <p className="loading">Loading visual collection…</p>
                    }
                  >
                    <MediaGallery />
                  </Suspense>
                }
              />
              <Route
                path="/properties"
                element={<Collection kind="property" />}
              />
              <Route path="/projects" element={<Collection kind="project" />} />
              <Route path="/blog" element={<Collection kind="post" />} />
              <Route
                path="/catalogue"
                element={<Collection kind="product" />}
              />
              <Route path="/services" element={<Services />} />
              <Route
                path="/services/category/:slug"
                element={<Services categoryPage />}
              />
              {["properties", "projects", "blog", "catalogue", "services"].map(
                (p) => (
                  <Route key={p} path={`/${p}/:slug`} element={<Detail />} />
                ),
              )}
              <Route path="/contact" element={<Contact />} />
              <Route path="/quote" element={<Contact quote />} />
              <Route path="/privacy" element={<Legal />} />
              <Route path="/terms" element={<Legal terms />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <WhatsAppButton />
          <Analytics />
        </>
      )}
    </CompanyContext.Provider>
  );
}
function WhatsAppButton() {
  const company = useCompany();
  const number = (
    company?.whatsappNumber ||
    company?.phone ||
    "+211924265999"
  ).replace(/\D/g, "");
  return (
    <a
      className="whatsapp-float"
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with K&M Real Estate on WhatsApp"
    >
      <span className="whatsapp-float-label" aria-hidden="true">
        Let’s talk on WhatsApp
      </span>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M20.52 3.48A11.91 11.91 0 0 0 12.04 0C5.44 0 .07 5.37.07 11.97c0 2.11.55 4.17 1.6 5.98L0 24l6.2-1.63a11.94 11.94 0 0 0 5.83 1.49h.01C18.64 23.86 24 18.49 24 11.89c0-3.19-1.24-6.18-3.48-8.41ZM12.04 21.84a9.9 9.9 0 0 1-5.05-1.38l-.36-.22-3.68.97.98-3.59-.24-.37a9.91 9.91 0 0 1-1.52-5.28c0-5.49 4.47-9.96 9.97-9.96a9.9 9.9 0 0 1 7.04 2.92 9.9 9.9 0 0 1 2.9 7.05c0 5.49-4.47 9.96-9.96 9.96Zm5.46-7.46c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"
        />
      </svg>
    </a>
  );
}
function Header() {
  const c = useCompany();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location]);
  return (
    <>
      <div className="topline">
        <span>
          <MapPin size={12} /> Juba, South Sudan
        </span>
        <a href={`tel:${c?.phone || "+211924265999"}`}>
          <Phone size={12} />
          {c?.phone || "+211 924 265 999"}
        </a>
        <span className="top-tag">A partner for every property journey.</span>
      </div>
      <header className="header">
        <Link
          to="/"
          className="brand brand-logo"
          aria-label="K&M Real Estate home"
        >
          <img src={c?.logo || "/branding/logo.webp"} alt="" />
        </Link>
        <button
          className="mobile-toggle"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav aria-label="Main navigation" className={open ? "open" : ""}>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/about">About Us</NavLink>
          <div className="nav-dropdown">
            <NavLink to="/properties">
              Properties <ChevronDown size={12} />
            </NavLink>
            <div className="dropdown">
              <Link to="/properties">All Properties</Link>
              <Link to="/properties?transaction=SALE">Properties for Sale</Link>
              <Link to="/properties?transaction=RENT">Properties for Rent</Link>
              <Link to="/properties?category=land-and-plots">Land & Plots</Link>
              <Link to="/properties?category=commercial">
                Commercial Properties
              </Link>
            </div>
          </div>
          <div className="nav-dropdown">
            <NavLink to="/services">
              Services <ChevronDown size={12} />
            </NavLink>
            <div className="dropdown">
              <Link to="/services/category/real-estate-and-property-services">
                Real Estate & Property Services
              </Link>
              <Link to="/services/category/construction-and-design">
                Construction & Design
              </Link>
              <Link to="/services/category/construction-materials">
                Construction Materials
              </Link>
              <Link to="/services/category/general-supplies-and-procurement">
                General Supplies & Procurement
              </Link>
              <Link to="/services/category/electrical-electronics-and-it-solutions">
                Electrical, Electronics & IT
              </Link>
              <Link to="/services/category/plumbing-and-technical-services">
                Plumbing & Technical Services
              </Link>
            </div>
          </div>
          <NavLink to="/projects">Projects</NavLink>
          <NavLink to="/gallery">Gallery</NavLink>
          <NavLink to="/blog">Insights</NavLink>
          <NavLink to="/contact">Contact Us</NavLink>
          <Link to="/quote" className="button small">
            Request a Quote <ArrowUpRight size={15} />
          </Link>
        </nav>
      </header>
    </>
  );
}
function Footer() {
  const c = useCompany();
  return (
    <footer className="footer">
      <div className="container footer-top">
        <div>
          <Link to="/" className="brand brand-logo footer-brand">
            <img
              src={c?.logo || "/branding/logo.webp"}
              alt="K&M Real Estate logo"
            />
          </Link>
          <p>{c?.footer || "Real Estate. Real Results."}</p>
        </div>
        <div>
          <h3>Explore</h3>
          <Link to="/about">Our company</Link>
          <Link to="/gallery">Gallery</Link>
          <Link to="/properties">Find a property</Link>
          <Link to="/projects">Our projects</Link>
          <Link to="/blog">Blog & insights</Link>
        </div>
        <div>
          <h3>Expertise</h3>
          <Link to="/services">Property services</Link>
          <Link to="/services/category/construction-and-design">
            Construction & design
          </Link>
          <Link to="/catalogue">Materials & supplies</Link>
          <Link to="/quote">Request a quote</Link>
        </div>
        <div>
          <h3>Let’s talk</h3>
          <a href={`tel:${c?.phone || "+211924265999"}`}>
            <Phone size={15} />
            {c?.phone || "+211 924 265 999"}
          </a>
          <a href={`mailto:${c?.email || "kmrealestate38@gmail.com"}`}>
            <Mail size={15} />
            {c?.email || "kmrealestate38@gmail.com"}
          </a>
          <p>
            <MapPin size={15} />
            {c?.address ||
              "Juba Town, opposite Gabat Primary School, Juba, South Sudan"}
          </p>
          {c?.socialLinks.map((s) => (
            <a
              key={s.url}
              href={s.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {s.label} <ArrowUpRight size={12} />
            </a>
          ))}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} K&M Real Estate.</span>
        <div>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/admin">Staff access</Link>
        </div>
        <span>Built around your next chapter.</span>
      </div>
    </footer>
  );
}
