import { useEffect, useState } from "react";
import PasswordInput from "./PasswordInput";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Check,
  FileText,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Save,
  Search,
  Settings,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  api,
  setCsrf,
  write,
  type Category,
  type Company,
  type CustomerRequest,
  type Entry,
  type Staff,
} from "./api";
import { LoadingError } from "./Public";
const modules = [
  ["overview", "Overview"],
  ["property", "Properties"],
  ["service", "Services"],
  ["product", "Catalogue"],
  ["project", "Projects"],
  ["post", "Blog articles"],
  ["requests", "Inquiries & quotations"],
  ["media", "Media library"],
  ["team", "Team members"],
  ["testimonial", "Testimonials"],
  ["categories", "Categories"],
  ["settings", "Website content"],
  ["users", "Staff accounts"],
  ["audit", "Audit log"],
  ["password", "Change password"],
];
const blankEntry = (kind: string) =>
  ({
    kind,
    slug: "",
    title: "",
    summary: "",
    body: "",
    status: "DRAFT",
    featured: false,
    verified: false,
    categoryId: null,
    location: "",
    price: null,
    currency: "USD",
    transaction: null,
    bedrooms: null,
    bathrooms: null,
    area: null,
    amenities: [],
    specs: {},
    seoTitle: "",
    seoDescription: "",
    images: [],
  }) as unknown as Entry;
function ErrorMessage({ error }: { error: string }) {
  return error ? (
    <div role="alert" className="notice error">
      {error}
    </div>
  ) : null;
}
export default function Admin() {
  const query = useQueryClient(),
    location = useLocation();
  const {
    data: session,
    isPending,
    error,
  } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const s = await api<{ user: Staff; csrfToken: string }>("/auth/me");
      setCsrf(s.csrfToken);
      return s;
    },
    retry: false,
  });
  const [mobile, setMobile] = useState(false);
  const module = location.pathname.split("/")[2] || "overview";
  if (module === "reset") return <Login resetMode />;
  if (isPending) return <LoadingError />;
  if (error || !session) return <Login />;
  const isAdmin = session.user.role === "ADMIN";
  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${mobile ? "open" : ""}`}>
        <Link to="/" className="admin-brand">
          K&M <span>STAFF WORKSPACE</span>
        </Link>
        <p className="sidebar-label">MANAGE YOUR BUSINESS</p>
        <nav aria-label="Staff navigation">
          {modules
            .filter(
              ([k]) => isAdmin || !["settings", "users", "audit"].includes(k),
            )
            .map(([key, label]) => (
              <Link
                className={module === key ? "active" : ""}
                key={key}
                to={`/admin/${key}`}
                onClick={() => setMobile(false)}
              >
                {key === "overview" ? (
                  <LayoutDashboard size={16} />
                ) : key === "media" ? (
                  <ImagePlus size={16} />
                ) : key === "users" ? (
                  <Users size={16} />
                ) : key === "settings" ? (
                  <Settings size={16} />
                ) : (
                  <FileText size={16} />
                )}{" "}
                {label}
              </Link>
            ))}
        </nav>
        <div className="sidebar-user">
          <strong>{session.user.name}</strong>
          <span>{session.user.role}</span>
          <button
            onClick={async () => {
              await api("/auth/logout", write("POST"));
              setCsrf("");
              query.setQueryData(["session"], null);
              await query.invalidateQueries({ queryKey: ["session"] });
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <div className="admin-body">
        <header className="admin-header">
          <button
            className="mobile-toggle"
            aria-label="Toggle staff navigation"
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>
          <span>
            <span className="live-dot" /> K&M REAL ESTATE /{" "}
            <b>{modules.find(([v]) => v === module)?.[1] || "Workspace"}</b>
          </span>
          <Link to="/">
            View website <ArrowUpRight size={16} />
          </Link>
        </header>
        <main className="admin-main" key={module}>
          {module === "overview" ? (
            <Overview />
          ) : module === "requests" ? (
            <Requests />
          ) : module === "media" ? (
            <Media />
          ) : module === "categories" ? (
            <Categories />
          ) : module === "settings" && isAdmin ? (
            <SettingsEditor />
          ) : module === "users" && isAdmin ? (
            <UsersEditor />
          ) : module === "audit" && isAdmin ? (
            <Audit />
          ) : module === "password" ? (
            <Password />
          ) : [
              "property",
              "service",
              "product",
              "project",
              "post",
              "team",
              "testimonial",
            ].includes(module) ? (
            <ContentModule kind={module} />
          ) : (
            <p>You do not have access to this module.</p>
          )}
        </main>
      </div>
    </div>
  );
}
function Login({ resetMode = false }: { resetMode?: boolean }) {
  const query = useQueryClient();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [forgot, setForgot] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <div className="login-page">
      <div className="login-intro">
        <Link to="/" className="brand">
          <img src="/branding/logo.webp" alt="K&M Real Estate logo" />
        </Link>
        <p className="eyebrow light">THE K&M WORKSPACE</p>
        <h1>
          Thoughtful service
          <br />
          starts here.
        </h1>
        <p>
          A secure space for the people behind
          <br />
          every property journey.
        </p>
        <Link to="/" className="text-link">
          <ArrowLeft size={16} /> Back to website
        </Link>
      </div>
      <div className="login-form">
        <Shield size={30} strokeWidth={1} />
        <h2>
          {resetMode
            ? "Set a new password"
            : forgot
              ? "Reset your password"
              : "Welcome back."}
        </h2>
        <p className="muted">Authorized company staff only.</p>
        <ErrorMessage error={error} />
        {message && <div className="notice success">{message}</div>}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const f = new FormData(e.currentTarget);
            try {
              if (resetMode) {
                const r = await api(
                  "/auth/reset",
                  write("POST", {
                    token: params.get("token"),
                    password: f.get("password"),
                  }),
                );
                setMessage(r.message);
                navigate("/admin");
              } else if (forgot) {
                const r = await api(
                  "/auth/forgot",
                  write("POST", { email: f.get("email") }),
                );
                setMessage(r.message);
              } else {
                const s = await api(
                  "/auth/login",
                  write("POST", {
                    email: f.get("email"),
                    password: f.get("password"),
                  }),
                );
                setCsrf(s.csrfToken);
                query.setQueryData(["session"], s);
              }
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {!resetMode && (
            <label>
              {forgot ? "Email address" : "Email or username"}
              <input
                required
                name="email"
                type={forgot ? "email" : "text"}
                autoComplete="username"
              />
            </label>
          )}
          {(!forgot || resetMode) && (
            <label>
              Password
              <PasswordInput
                name="password"
                minLength={resetMode ? 12 : 1}
                maxLength={128}
                required
                autoComplete={resetMode ? "new-password" : "current-password"}
              />
            </label>
          )}
          <button className="button" disabled={busy}>
            {busy
              ? "Please wait…"
              : forgot
                ? "Request reset link"
                : resetMode
                  ? "Save password"
                  : "Sign in"}{" "}
            <ArrowUpRight size={16} />
          </button>
        </form>
        {!resetMode && (
          <button
            className="link-button"
            onClick={() => {
              setForgot(!forgot);
              setError("");
              setMessage("");
            }}
          >
            {forgot ? "Back to sign in" : "Forgot password?"}
          </button>
        )}
      </div>
    </div>
  );
}
function Overview() {
  const { data, error } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api<Record<string, number>>("/admin/stats"),
  });
  const names: Record<string, string> = {
    totalProperties: "Total properties",
    publishedProperties: "Published properties",
    sale: "For sale",
    rent: "For rent",
    inquiries: "Total inquiries",
    pending: "Pending inquiries",
    viewings: "Viewing requests",
    quotations: "Quotation requests",
    projects: "Published projects",
    posts: "Published articles",
  };
  return (
    <>
      <AdminTitle
        eyebrow="YOUR BUSINESS AT A GLANCE"
        title="A clear view of what’s next."
      />
      <p className="muted">Current records from your company database.</p>
      {error || !data ? (
        <LoadingError error={error} />
      ) : (
        <div className="stats-grid">
          {Object.entries(data).map(([key, value]) => (
            <Link
              to={`/admin/${["inquiries", "pending", "viewings", "quotations"].includes(key) ? "requests" : key === "projects" ? "project" : key === "posts" ? "post" : "property"}`}
              className="stat"
              key={key}
            >
              <BarChart3 size={19} />
              <span>{names[key]}</span>
              <strong>{value}</strong>
            </Link>
          ))}
        </div>
      )}
      <section className="admin-welcome">
        <div>
          <p className="eyebrow">MAKE YOUR NEXT MOVE</p>
          <h2>Keep your company story current.</h2>
          <p>
            Publish genuine listings, update services and follow up with
            customers.
          </p>
        </div>
        <Link className="button" to="/admin/property">
          Manage properties <ArrowUpRight size={16} />
        </Link>
      </section>
    </>
  );
}
function AdminTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {action}
    </div>
  );
}
function ContentModule({ kind }: { kind: string }) {
  const query = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["admin-content", kind],
    queryFn: () => api<Entry[]>(`/admin/content/${kind}`),
  });
  const [editing, setEditing] = useState<Entry | null>(null),
    [filter, setFilter] = useState(""),
    [errorText, setError] = useState("");
  async function remove(item: Entry) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`))
      return;
    try {
      await api(`/admin/content/${item.id}`, write("DELETE"));
      await query.invalidateQueries({ queryKey: ["admin-content", kind] });
      await query.invalidateQueries({ queryKey: ["stats"] });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <AdminTitle
        eyebrow="COMPANY CONTENT"
        title={modules.find(([v]) => v === kind)?.[1] || kind}
        action={
          <button
            className="button"
            onClick={() => setEditing(blankEntry(kind))}
          >
            <Plus size={16} /> Add new
          </button>
        }
      />
      <ErrorMessage error={errorText} />
      {editing ? (
        <EntryEditor
          value={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await query.invalidateQueries();
          }}
        />
      ) : (
        <>
          <label className="admin-search">
            <Search size={17} />
            <input
              placeholder="Search records"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </label>
          {error || !data ? (
            <LoadingError error={error} />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data
                    .filter((v) =>
                      v.title.toLowerCase().includes(filter.toLowerCase()),
                    )
                    .map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.title}</strong>
                          <small>{item.location || item.slug}</small>
                        </td>
                        <td>{item.category?.name || "—"}</td>
                        <td>
                          <span
                            className={`status ${item.status.toLowerCase()}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>{item.featured ? "Yes" : "—"}</td>
                        <td className="table-actions">
                          <button onClick={() => setEditing(item)}>Edit</button>
                          <button
                            onClick={() => remove(item)}
                            aria-label={`Delete ${item.title}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {!data.length && (
                    <tr>
                      <td colSpan={5}>
                        No records yet. Add your first genuine company record.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        "aria-label": "Full description",
        role: "textbox",
        "aria-multiline": "true",
      },
    },
  });
  if (!editor) return null;
  return (
    <div className="rich-editor">
      <div className="editor-toolbar">
        {[
          ["Bold", () => editor.chain().focus().toggleBold().run()],
          ["Italic", () => editor.chain().focus().toggleItalic().run()],
          [
            "Heading",
            () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          ],
          [
            "Bullet list",
            () => editor.chain().focus().toggleBulletList().run(),
          ],
          ["Undo", () => editor.chain().focus().undo().run()],
        ].map(([name, fn]) => (
          <button type="button" key={String(name)} onClick={fn as () => void}>
            {String(name)}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
function EntryEditor({
  value,
  onClose,
  onSaved,
}: {
  value: Entry;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [v, setV] = useState({
      ...value,
      price: value.price === null ? null : Number(value.price),
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const { data: categories } = useQuery({
    queryKey: ["all-categories"],
    queryFn: () => api<Category[]>("/admin/categories"),
  });
  const { data: media } = useQuery({
    queryKey: ["admin-media"],
    queryFn: () => api<any[]>("/admin/media"),
  });
  const update = (k: string, value: any) =>
    setV((prev) => ({ ...prev, [k]: value }));
  const spec = (k: string, value: any) =>
    update("specs", { ...v.specs, [k]: value });
  return (
    <form
      className="editor-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await api(
            `/admin/content${v.id ? "/" + v.id : ""}`,
            write(v.id ? "PUT" : "POST", v),
          );
          onSaved();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="editor-top">
        <button type="button" onClick={onClose}>
          <ArrowLeft size={16} /> Back to records
        </button>
        <span>{v.id ? "Edit record" : "New record"}</span>
      </div>
      <ErrorMessage error={error} />
      <div className="grid two">
        <label>
          Title *
          <input
            value={v.title}
            required
            maxLength={200}
            onChange={(e) => {
              update("title", e.target.value);
              if (!v.id)
                update(
                  "slug",
                  e.target.value
                    .toLowerCase()
                    .replace(/&/g, "and")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, ""),
                );
            }}
          />
        </label>
        <label>
          URL slug *
          <input
            value={v.slug}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={180}
            onChange={(e) => update("slug", e.target.value)}
          />
        </label>
        <label>
          Category
          <select
            value={v.categoryId || ""}
            onChange={(e) => update("categoryId", e.target.value || null)}
          >
            <option value="">No category</option>
            {categories
              ?.filter((c) => c.kind === v.kind)
              .map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Publication status
          <select
            value={v.status}
            onChange={(e) => update("status", e.target.value)}
          >
            <option>DRAFT</option>
            <option>PUBLISHED</option>
            <option>ARCHIVED</option>
          </select>
        </label>
      </div>
      <label>
        Summary
        <textarea
          rows={3}
          value={v.summary}
          maxLength={1000}
          onChange={(e) => update("summary", e.target.value)}
        />
      </label>
      <span className="field-label">Full description</span>
      <RichEditor value={v.body} onChange={(html) => update("body", html)} />
      <div className="check-row">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={v.featured}
            onChange={(e) => update("featured", e.target.checked)}
          />{" "}
          Featured on homepage
        </label>
        {v.kind === "testimonial" && (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={v.verified}
              onChange={(e) => update("verified", e.target.checked)}
            />{" "}
            Genuine testimonial verified and approved
          </label>
        )}
      </div>
      {["property", "project"].includes(v.kind) && (
        <label>
          Location
          <input
            value={v.location}
            onChange={(e) => update("location", e.target.value)}
          />
        </label>
      )}
      {v.kind === "property" && (
        <>
          <div className="grid three">
            <label>
              Transaction
              <select
                value={v.transaction || ""}
                onChange={(e) => update("transaction", e.target.value || null)}
              >
                <option value="">Choose sale or rent</option>
                <option value="SALE">For sale</option>
                <option value="RENT">For rent</option>
              </select>
            </label>
            <label>
              Price (blank = on request)
              <input
                type="number"
                min="0"
                step="0.01"
                value={v.price ?? ""}
                onChange={(e) =>
                  update(
                    "price",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
            </label>
            <label>
              Currency
              <select
                value={v.currency}
                onChange={(e) => update("currency", e.target.value)}
              >
                <option>USD</option>
                <option>SSP</option>
              </select>
            </label>
            {["bedrooms", "bathrooms", "area"].map((key) => (
              <label key={key}>
                {key === "area" ? "Area in m²" : key}
                <input
                  type="number"
                  min="0"
                  step={key === "area" ? "0.01" : "1"}
                  value={v[key as "bedrooms"] ?? ""}
                  onChange={(e) =>
                    update(
                      key,
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              </label>
            ))}
          </div>
          <label>
            Amenities (one per line)
            <textarea
              rows={3}
              value={v.amenities.join("\n")}
              onChange={(e) => update("amenities", e.target.value.split("\n"))}
            />
          </label>
          <div className="grid two">
            <label>
              Availability
              <input
                value={v.specs.availability || ""}
                onChange={(e) => spec("availability", e.target.value)}
                placeholder="Available, under offer, let…"
              />
            </label>
            <label>
              Rental period
              <input
                value={v.specs.rentalPeriod || ""}
                onChange={(e) => spec("rentalPeriod", e.target.value)}
                placeholder="Per month, per year…"
              />
            </label>
          </div>
        </>
      )}
      {v.kind === "product" && (
        <label>
          Supply group
          <input
            value={v.specs.supplyCategory || ""}
            onChange={(e) => spec("supplyCategory", e.target.value)}
            placeholder="Foodstuff Supply, Furniture Supply, Safety Equipment…"
          />
        </label>
      )}
      {v.kind === "project" && (
        <div className="grid three">
          <label>
            Project status
            <input
              value={v.specs.projectStatus || ""}
              onChange={(e) => spec("projectStatus", e.target.value)}
              placeholder="Ongoing / completed"
            />
          </label>
          <label>
            Verified completion date
            <input
              type="date"
              value={v.specs.completionDate || ""}
              onChange={(e) => spec("completionDate", e.target.value)}
            />
          </label>
          <label>
            Services provided
            <input
              value={v.specs.servicesProvided || ""}
              onChange={(e) => spec("servicesProvided", e.target.value)}
            />
          </label>
        </div>
      )}
      {v.kind === "team" && (
        <label>
          Job title
          <input
            value={v.specs.jobTitle || ""}
            onChange={(e) => spec("jobTitle", e.target.value)}
          />
        </label>
      )}
      <fieldset>
        <legend>Image gallery · first image is the cover</legend>
        {v.images.map((img, i) => (
          <div className="image-editor" key={i}>
            <img src={img.url} alt={img.alt} />
            <label>
              Image URL
              <input
                value={img.url}
                onChange={(e) =>
                  update(
                    "images",
                    v.images.map((v, n) =>
                      n === i
                        ? { ...v, url: e.target.value, mediaId: null }
                        : v,
                    ),
                  )
                }
                required
              />
            </label>
            <label>
              Alternative text
              <input
                value={img.alt}
                minLength={2}
                onChange={(e) =>
                  update(
                    "images",
                    v.images.map((v, n) =>
                      n === i ? { ...v, alt: e.target.value } : v,
                    ),
                  )
                }
                required
              />
            </label>
            <button
              type="button"
              aria-label={`Remove image ${i + 1}`}
              onClick={() =>
                update(
                  "images",
                  v.images.filter((_, n) => n !== i),
                )
              }
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <div className="actions">
          <button
            type="button"
            onClick={() =>
              update("images", [...v.images, { url: "", alt: "" }])
            }
          >
            <Plus size={15} /> Add image URL
          </button>
          <label>
            Or select uploaded media
            <select
              value=""
              onChange={(e) => {
                const m = media?.find((m) => m.id === e.target.value);
                if (m)
                  update("images", [
                    ...v.images,
                    { url: m.url, alt: m.alt, mediaId: m.id },
                  ]);
              }}
            >
              <option value="">Choose from media library</option>
              {media
                ?.filter((m) => m.type === "image")
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <p className="caption">
          Upload new files in Media library. Publish only genuine listing and
          project photos.
        </p>
      </fieldset>
      <div className="grid two">
        <label>
          SEO title
          <input
            value={v.seoTitle}
            maxLength={200}
            onChange={(e) => update("seoTitle", e.target.value)}
          />
        </label>
        <label>
          SEO description
          <textarea
            rows={2}
            value={v.seoDescription}
            maxLength={350}
            onChange={(e) => update("seoDescription", e.target.value)}
          />
        </label>
      </div>
      <button className="button" disabled={busy}>
        <Save size={16} />
        {busy ? "Saving…" : "Save record"}
      </button>
    </form>
  );
}
function Requests() {
  const query = useQueryClient();
  const [filters, setFilters] = useState({
      q: "",
      kind: "",
      status: "",
      service: "",
    }),
    [page, setPage] = useState(1),
    [editing, setEditing] = useState<CustomerRequest | null>(null),
    [error, setError] = useState("");
  const search = new URLSearchParams({
    ...filters,
    page: String(page),
    limit: "100",
  });
  const { data, error: loadError } = useQuery({
    queryKey: ["requests", search.toString()],
    queryFn: () => api<CustomerRequest[]>(`/admin/requests?${search}`),
  });
  return (
    <>
      <AdminTitle
        eyebrow="CUSTOMER RELATIONSHIPS"
        title="Every conversation matters."
        action={
          <a className="button" href={`/api/admin/requests/export?${search}`}>
            Export CSV <ArrowUpRight size={16} />
          </a>
        }
      />
      <ErrorMessage error={error} />
      <form
        className="collection-filter"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setPage(1);
          setFilters(
            Object.fromEntries(
              ["q", "kind", "status", "service"].map((k) => [
                k,
                String(f.get(k) || ""),
              ]),
            ) as typeof filters,
          );
        }}
      >
        <label>
          Search
          <input name="q" placeholder="Name, email or message" />
        </label>
        <label>
          Type
          <select name="kind">
            <option value="">All requests</option>
            {[
              "CONTACT",
              "PROPERTY",
              "VIEWING",
              "QUOTATION",
              "CONSULTATION",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select name="status">
            <option value="">All statuses</option>
            {["NEW", "IN_PROGRESS", "CLOSED"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Service
          <input name="service" placeholder="Service or item" />
        </label>
        <button className="button">
          <Search size={17} /> Filter
        </button>
      </form>
      {editing ? (
        <form
          className="editor-form"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api(
                `/admin/requests/${editing.id}`,
                write("PATCH", {
                  status: editing.status,
                  notes: editing.notes,
                  followUpAt: editing.followUpAt
                    ? new Date(editing.followUpAt).toISOString()
                    : null,
                }),
              );
              setEditing(null);
              await query.invalidateQueries({ queryKey: ["requests"] });
              await query.invalidateQueries({ queryKey: ["stats"] });
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <button type="button" onClick={() => setEditing(null)}>
            <ArrowLeft size={16} /> Back
          </button>
          <h2>{editing.name}</h2>
          <p>
            {editing.kind} · {new Date(editing.createdAt).toLocaleString()}
          </p>
          <p>
            <a href={`mailto:${editing.email}`}>{editing.email}</a> ·{" "}
            <a href={`tel:${editing.phone}`}>{editing.phone}</a>
          </p>
          <p>
            Service: {editing.service || "—"} · Location:{" "}
            {editing.location || "—"}
          </p>
          {editing.entry && <p>Record: {editing.entry.title}</p>}
          <p className="request-message">{editing.message}</p>
          {editing.quantities && (
            <p className="request-message">
              Quantities/specifications: {editing.quantities}
            </p>
          )}
          {editing.preferredDate && (
            <p>
              Preferred viewing:{" "}
              {new Date(editing.preferredDate).toLocaleString()}
            </p>
          )}
          <p>Email notification: {editing.notificationStatus}</p>
          <label>
            Status
            <select
              value={editing.status}
              onChange={(e) =>
                setEditing({ ...editing, status: e.target.value })
              }
            >
              {["NEW", "IN_PROGRESS", "CLOSED"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Internal notes
            <textarea
              rows={5}
              value={editing.notes}
              onChange={(e) =>
                setEditing({ ...editing, notes: e.target.value })
              }
            />
          </label>
          <label>
            Follow-up date
            <input
              type="datetime-local"
              value={
                editing.followUpAt
                  ? new Date(
                      new Date(editing.followUpAt).getTime() -
                        new Date(editing.followUpAt).getTimezoneOffset() *
                          60000,
                    )
                      .toISOString()
                      .slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                setEditing({ ...editing, followUpAt: e.target.value || null })
              }
            />
          </label>
          <button className="button">
            <Save size={16} /> Save follow-up
          </button>
        </form>
      ) : loadError || !data ? (
        <LoadingError error={loadError} />
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Type / service</th>
                  <th>Received</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <strong>{v.name}</strong>
                      <small>{v.email}</small>
                    </td>
                    <td>
                      {v.kind}
                      <small>{v.service}</small>
                    </td>
                    <td>{new Date(v.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className="status">{v.status}</span>
                    </td>
                    <td>
                      {v.followUpAt
                        ? new Date(v.followUpAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <button onClick={() => setEditing(v)}>Review</button>
                    </td>
                  </tr>
                ))}
                {!data.length && (
                  <tr>
                    <td colSpan={6}>No requests match these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            {page > 1 && (
              <button onClick={() => setPage(page - 1)}>Previous</button>
            )}
            {data.length === 100 && (
              <button onClick={() => setPage(page + 1)}>Next</button>
            )}
          </div>
        </>
      )}
    </>
  );
}
function Categories() {
  const query = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["all-categories"],
    queryFn: () => api<Category[]>("/admin/categories"),
  });
  const [v, setV] = useState<Category | null>(null),
    [err, setError] = useState("");
  return (
    <>
      <AdminTitle
        eyebrow="CONTENT ORGANIZATION"
        title="Categories"
        action={
          <button
            className="button"
            onClick={() =>
              setV({
                id: "",
                kind: "property",
                name: "",
                slug: "",
                description: "",
              })
            }
          >
            <Plus size={16} /> Add category
          </button>
        }
      />
      <ErrorMessage error={err} />
      {v && (
        <form
          className="editor-form"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api(
                `/admin/categories${v.id ? "/" + v.id : ""}`,
                write(v.id ? "PUT" : "POST", v),
              );
              setV(null);
              await query.invalidateQueries({ queryKey: ["all-categories"] });
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <div className="grid two">
            <label>
              Name
              <input
                required
                value={v.name}
                onChange={(e) =>
                  setV({
                    ...v,
                    name: e.target.value,
                    slug: v.id
                      ? v.slug
                      : e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, ""),
                  })
                }
              />
            </label>
            <label>
              Slug
              <input
                required
                value={v.slug}
                onChange={(e) => setV({ ...v, slug: e.target.value })}
              />
            </label>
            <label>
              Content type
              <select
                value={v.kind}
                disabled={Boolean(v.id)}
                onChange={(e) => setV({ ...v, kind: e.target.value })}
              >
                {[
                  "property",
                  "service",
                  "product",
                  "project",
                  "post",
                  "team",
                  "testimonial",
                ].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <label>
              Image URL
              <input
                value={v.image || ""}
                onChange={(e) =>
                  setV({ ...v, image: e.target.value || undefined })
                }
              />
            </label>
          </div>
          <label>
            Description
            <textarea
              value={v.description}
              onChange={(e) => setV({ ...v, description: e.target.value })}
            />
          </label>
          <div className="actions">
            <button className="button">Save category</button>
            <button type="button" onClick={() => setV(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {error || !data ? (
        <LoadingError error={error} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Content type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.kind}</td>
                  <td className="table-actions">
                    <button onClick={() => setV(c)}>Edit</button>
                    <button
                      aria-label={`Delete ${c.name}`}
                      onClick={async () => {
                        if (!window.confirm("Delete this category?")) return;
                        try {
                          await api(
                            `/admin/categories/${c.id}`,
                            write("DELETE"),
                          );
                          await query.invalidateQueries({
                            queryKey: ["all-categories"],
                          });
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
function SettingsEditor() {
  const query = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["company"],
    queryFn: () => api<Company>("/settings"),
  });
  const [v, setV] = useState<Company | null>(null),
    [err, setError] = useState(""),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    if (data) setV(structuredClone(data));
  }, [data]);
  if (error || !v) return <LoadingError error={error} />;
  const fields = [
    "tagline",
    "phone",
    "email",
    "address",
    "heroTitle",
    "heroDescription",
    "overview",
    "mission",
    "vision",
    "heroImage",
    "logo",
    "footer",
    "seoDescription",
    "primaryColor",
    "analyticsId",
  ] as const;
  return (
    <>
      <AdminTitle
        eyebrow="YOUR COMPANY STORY"
        title="Website content & settings"
      />
      <ErrorMessage error={err} />
      {saved && (
        <div className="notice success">
          <Check size={16} /> Website settings saved.
        </div>
      )}
      <form
        className="editor-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setSaved(false);
          try {
            await api("/admin/settings", write("PUT", v));
            await query.invalidateQueries({ queryKey: ["company"] });
            setSaved(true);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <div className="grid two">
          {fields.map((k) => (
            <label key={k}>
              {k.replace(/([A-Z])/g, " $1")}
              {[
                "heroDescription",
                "overview",
                "mission",
                "vision",
                "footer",
                "seoDescription",
              ].includes(k) ? (
                <textarea
                  rows={4}
                  value={v[k]}
                  onChange={(e) => setV({ ...v, [k]: e.target.value })}
                />
              ) : (
                <input
                  required
                  value={v[k]}
                  type={
                    k === "primaryColor"
                      ? "color"
                      : k === "email"
                        ? "email"
                        : "text"
                  }
                  onChange={(e) => setV({ ...v, [k]: e.target.value })}
                />
              )}
            </label>
          ))}
        </div>
        <fieldset>
          <legend>Core values</legend>
          {v.values.map((item, i) => (
            <div className="grid two" key={i}>
              <label>
                Value title
                <input
                  value={item.title}
                  onChange={(e) =>
                    setV({
                      ...v,
                      values: v.values.map((val, n) =>
                        n === i ? { ...val, title: e.target.value } : val,
                      ),
                    })
                  }
                />
              </label>
              <label>
                Description
                <textarea
                  value={item.text}
                  onChange={(e) =>
                    setV({
                      ...v,
                      values: v.values.map((val, n) =>
                        n === i ? { ...val, text: e.target.value } : val,
                      ),
                    })
                  }
                />
              </label>
            </div>
          ))}
        </fieldset>
        <fieldset>
          <legend>Homepage sections</legend>
          <div className="check-row">
            {["properties", "projects", "posts", "testimonials"].map((s) => (
              <label className="checkbox" key={s}>
                <input
                  type="checkbox"
                  checked={v.featuredSections.includes(s)}
                  onChange={(e) =>
                    setV({
                      ...v,
                      featuredSections: e.target.checked
                        ? [...v.featuredSections, s]
                        : v.featuredSections.filter((k) => k !== s),
                    })
                  }
                />
                {s}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Contact channels</legend>
          <label>
            WhatsApp number (digits with country code)
            <input
              value={v.whatsappNumber}
              onChange={(e) => setV({ ...v, whatsappNumber: e.target.value })}
            />
          </label>
          <p className="caption">
            WhatsApp links use this number, or the company telephone when blank.
          </p>
          {v.socialLinks.map((s, i) => (
            <div className="image-editor" key={i}>
              <label>
                Platform
                <input
                  value={s.label}
                  onChange={(e) =>
                    setV({
                      ...v,
                      socialLinks: v.socialLinks.map((s, n) =>
                        n === i ? { ...s, label: e.target.value } : s,
                      ),
                    })
                  }
                />
              </label>
              <label>
                Verified profile URL
                <input
                  value={s.url}
                  type="url"
                  onChange={(e) =>
                    setV({
                      ...v,
                      socialLinks: v.socialLinks.map((s, n) =>
                        n === i ? { ...s, url: e.target.value } : s,
                      ),
                    })
                  }
                />
              </label>
              <button
                type="button"
                aria-label="Remove social profile"
                onClick={() =>
                  setV({
                    ...v,
                    socialLinks: v.socialLinks.filter((_, n) => n !== i),
                  })
                }
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setV({
                ...v,
                socialLinks: [...v.socialLinks, { label: "", url: "" }],
              })
            }
          >
            <Plus size={16} /> Add verified social profile
          </button>
        </fieldset>
        <button className="button">
          <Save size={16} /> Save website settings
        </button>
      </form>
    </>
  );
}
function Media() {
  const query = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["admin-media"],
    queryFn: () => api<any[]>("/admin/media"),
  });
  const [err, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState<any>(null);
  return (
    <>
      <AdminTitle eyebrow="PERSISTENT COMPANY ASSETS" title="Media library" />
      <ErrorMessage error={err} />
      <form
        className="editor-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          setBusy(true);
          setError("");
          try {
            await api("/admin/media", {
              method: "POST",
              body: new FormData(form),
            });
            form.reset();
            await query.invalidateQueries({ queryKey: ["admin-media"] });
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <p>
          Images: JPEG, PNG or WebP. Videos: MP4. Maximum 20 MB. Cloudinary
          credentials are required for persistent uploads.
        </p>
        <div className="grid two">
          <label>
            File
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,video/mp4"
              required
            />
          </label>
          <label>
            Asset name
            <input name="name" required />
          </label>
          <label>
            Alternative text
            <input name="alt" required minLength={2} />
          </label>
          <label>
            Folder
            <input
              name="folder"
              defaultValue="general"
              required
              pattern="[a-z0-9-]{1,80}"
            />
          </label>
        </div>
        <button className="button" disabled={busy}>
          <ImagePlus size={16} />
          {busy ? "Uploading…" : "Upload media"}
        </button>
      </form>
      {editing && (
        <form
          className="editor-form"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api(
                `/admin/media/${editing.id}`,
                write("PATCH", {
                  name: editing.name,
                  alt: editing.alt,
                  folder: editing.folder,
                }),
              );
              setEditing(null);
              await query.invalidateQueries({ queryKey: ["admin-media"] });
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          {["name", "alt", "folder"].map((k) => (
            <label key={k}>
              {k}
              <input
                value={editing[k]}
                onChange={(e) =>
                  setEditing({ ...editing, [k]: e.target.value })
                }
              />
            </label>
          ))}
          <div className="actions">
            <button className="button">Save details</button>
            <button type="button" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {error || !data ? (
        <LoadingError error={error} />
      ) : (
        <div className="grid three media-grid">
          {data.map((m) => (
            <article className="card" key={m.id}>
              {m.type === "image" ? (
                <img src={m.url} alt={m.alt} loading="lazy" />
              ) : (
                <video src={m.url} controls preload="metadata" />
              )}
              <div className="card-content">
                <h3>{m.name}</h3>
                <p>
                  {m.folder} · {(m.bytes / 1024).toFixed(0)} KB
                </p>
                <label>
                  Persistent URL
                  <input
                    value={m.url}
                    readOnly
                    onFocus={(e) => e.target.select()}
                  />
                </label>
                <div className="table-actions">
                  <button onClick={() => setEditing(m)}>Edit details</button>
                  <button
                    onClick={async () => {
                      if (
                        !window.confirm(
                          "Delete this stored asset? Referenced assets are protected.",
                        )
                      )
                        return;
                      try {
                        await api(`/admin/media/${m.id}`, write("DELETE"));
                        await query.invalidateQueries({
                          queryKey: ["admin-media"],
                        });
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
function UsersEditor() {
  const query = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => api<Staff[]>("/admin/users"),
  });
  const [err, setError] = useState(""),
    [editing, setEditing] = useState<Staff | null>(null);
  return (
    <>
      <AdminTitle eyebrow="ACCESS & PERMISSIONS" title="Staff accounts" />
      <ErrorMessage error={err} />
      <form
        className="editor-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          try {
            await api("/admin/users", write("POST", Object.fromEntries(f)));
            form.reset();
            await query.invalidateQueries({ queryKey: ["users"] });
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <h2>Add staff account</h2>
        <div className="grid two">
          <label>
            Full name
            <input name="name" required minLength={2} />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Role
            <select name="role">
              <option>STAFF</option>
              <option>ADMIN</option>
            </select>
          </label>
          <label>
            Initial password
            <PasswordInput
              name="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
            />
          </label>
        </div>
        <p className="caption">
          Staff can manage company content, media and requests. Administrators
          can also manage website settings, accounts and audit logs.
        </p>
        <button className="button">
          <Plus size={16} /> Create staff account
        </button>
      </form>
      {editing && (
        <form
          className="editor-form"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api(
                `/admin/users/${editing.id}`,
                write("PATCH", {
                  name: editing.name,
                  role: editing.role,
                  active: editing.active,
                }),
              );
              setEditing(null);
              await query.invalidateQueries({ queryKey: ["users"] });
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <label>
            Name
            <input
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </label>
          <label>
            Role
            <select
              value={editing.role}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  role: e.target.value as Staff["role"],
                })
              }
            >
              <option>STAFF</option>
              <option>ADMIN</option>
            </select>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={editing.active}
              onChange={(e) =>
                setEditing({ ...editing, active: e.target.checked })
              }
            />{" "}
            Account active
          </label>
          <div className="actions">
            <button className="button">Save permissions</button>
            <button type="button" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {error || !data ? (
        <LoadingError error={error} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((v) => (
                <tr key={v.id}>
                  <td>{v.name}</td>
                  <td>{v.email}</td>
                  <td>{v.role}</td>
                  <td>{v.active ? "Yes" : "No"}</td>
                  <td>
                    <button onClick={() => setEditing(v)}>Edit access</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
function Password() {
  const query = useQueryClient();
  const [err, setError] = useState("");
  return (
    <>
      <AdminTitle eyebrow="ACCOUNT SECURITY" title="Change your password" />
      <ErrorMessage error={err} />
      <form
        className="editor-form narrow"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          try {
            await api(
              "/auth/password",
              write("POST", {
                current: f.get("current"),
                password: f.get("password"),
              }),
            );
            setCsrf("");
            query.setQueryData(["session"], null);
            await query.invalidateQueries({ queryKey: ["session"] });
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <label>
          Current password
          <PasswordInput
            name="current"
            autoComplete="current-password"
            required
          />
        </label>
        <label>
          New password
          <PasswordInput
            name="password"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
        <p>All sessions will be signed out after your password changes.</p>
        <button className="button">
          <Shield size={16} /> Update password
        </button>
      </form>
    </>
  );
}
function Audit() {
  const { data, error } = useQuery({
    queryKey: ["audit"],
    queryFn: () => api<any[]>("/admin/audit"),
  });
  return (
    <>
      <AdminTitle eyebrow="ACCOUNTABILITY" title="Recent audit history" />
      {error || !data ? (
        <LoadingError error={error} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Staff ID</th>
                <th>Record</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.map((v) => (
                <tr key={v.id}>
                  <td>{v.action}</td>
                  <td>{v.userId || "System"}</td>
                  <td>{v.entityId || "—"}</td>
                  <td>{new Date(v.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
