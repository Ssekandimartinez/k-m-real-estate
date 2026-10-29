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
          <Analytics />
        </>
      )}
    </CompanyContext.Provider>
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
          className="brand"
          aria-label="K&M Real Estate. Real Estate. Real Results. Home"
        >
          <img src={c?.logo || "/branding/logo.webp"} alt="" />
          <span>
            K&M <strong>REAL ESTATE</strong>
            <small>Real Estate. Real Results.</small>
          </span>
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
              <Link to="/services#real-estate-and-property-services">
                Real Estate & Property Services
              </Link>
              <Link to="/services#construction-and-design">
                Construction & Design
              </Link>
              <Link to="/catalogue?category=construction-materials">
                Construction Materials
              </Link>
              <Link to="/catalogue?category=general-supplies-and-procurement">
                General Supplies & Procurement
              </Link>
              <Link to="/catalogue?category=electrical-electronics-and-it-solutions">
                Electrical, Electronics & IT
              </Link>
              <Link to="/services#plumbing-and-technical-services">
                Plumbing & Technical Services
              </Link>
            </div>
          </div>
          <NavLink to="/projects">Projects</NavLink>
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
          <Link to="/" className="brand footer-brand">
            <img
              src={c?.logo || "/branding/logo.webp"}
              alt="K&M Real Estate logo"
            />
            <span>
              K&M <strong>REAL ESTATE</strong>
            </span>
          </Link>
          <p>{c?.footer || "Real Estate. Real Results."}</p>
        </div>
        <div>
          <h3>Explore</h3>
          <Link to="/about">Our company</Link>
          <Link to="/properties">Find a property</Link>
          <Link to="/projects">Our projects</Link>
          <Link to="/blog">Blog & insights</Link>
        </div>
        <div>
          <h3>Expertise</h3>
          <Link to="/services">Property services</Link>
          <Link to="/services#construction-and-design">
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
