import React from "react";
import { afterEach, describe, it, expect, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RequestForm,
  Empty,
  HeroSlideshow,
  PageHero,
  Services,
  Card,
} from "./Public";
import type { Entry } from "./api";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function wrap(node: React.ReactNode) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>,
  );
}

it.each([
  ["property", true, "Illustrative property — availability not confirmed"],
  ["project", true, "Design concept — not a completed company project"],
  ["property", false, null],
] as const)(
  "renders published %s content when demo is %s without extra notices",
  (kind, demo, disclosure) => {
    const item = {
      id: "published-record",
      kind,
      slug: "published-record",
      title: "Published record",
      images: [],
      specs: { demo },
      price: null,
      transaction: null,
      bedrooms: null,
      bathrooms: null,
      area: null,
      summary: "Published description",
    } as unknown as Entry;
    wrap(<Card item={item} />);
    expect(
      screen.getByRole("heading", { name: "Published record" }),
    ).toBeInTheDocument();
    if (disclosure)
      expect(screen.queryByText(disclosure)).not.toBeInTheDocument();
  },
);
describe("Customer request flow", () => {
  it("downloads hero slides only when they are first needed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          assets: [0, 1, 2].map((i) => ({
            id: String(i),
            placement: `home-hero-${i}`,
            url: `/images/slide-${i}.webp`,
            type: "image",
            alt: "",
            category: "",
          })),
        }),
      }),
    );
    const { container } = wrap(<HeroSlideshow />);
    await waitFor(() =>
      expect(container.querySelectorAll(".hero-slide")[0]).toHaveAttribute(
        "src",
        "/images/slide-0.webp",
      ),
    );
    const images = container.querySelectorAll(".hero-slide");
    expect(images[1]).not.toHaveAttribute("src");
    expect(images[2]).not.toHaveAttribute("src");
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(images[1]).toHaveAttribute("src", "/images/slide-1.webp");
    expect(images[2]).not.toHaveAttribute("src");
  });
  it("automatically changes slide content and can pause and resume", () => {
    vi.useFakeTimers();
    wrap(<HeroSlideshow />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Your Property.",
    );
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Spaces imagined.",
    );
    expect(
      screen.getByRole("link", { name: /Explore Construction/ }),
    ).toHaveAttribute("href", "/services#construction-and-design");
    expect(
      screen.queryByRole("button", { name: /automatic slideshow/ }),
    ).not.toBeInTheDocument();
    fireEvent.mouseEnter(
      screen.getByRole("region", { name: "Property and design inspiration" }),
    );
    act(() => vi.advanceTimersByTime(8000));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Spaces imagined.",
    );
    fireEvent.mouseLeave(
      screen.getByRole("region", { name: "Property and design inspiration" }),
    );
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Your next chapter",
    );
  }, 20000);
  it("lets visitors select and navigate hero slides", () => {
    wrap(<HeroSlideshow image="/company-hero.webp" />);
    expect(
      screen.getByRole("button", { name: "Show slide 1" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(
      screen.getByRole("button", { name: "Show slide 2" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(
      screen.getByRole("button", { name: "Show slide 1" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Show slide 3" }));
    expect(
      screen.getByRole("button", { name: "Show slide 3" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
  it("uses the published image for a detail hero", () => {
    const { container } = wrap(
      <PageHero
        eyebrow="Property"
        title="Published property"
        image="/published-property.webp"
      />,
    );
    expect(container.querySelector(".page-hero-image")).toHaveAttribute(
      "src",
      "/published-property.webp",
    );
  });
  it("does not pretend empty inventory is an active listing", () => {
    wrap(<Empty kind="property" />);
    expect(screen.getByText(/No published properties/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Talk to our team/ }),
    ).toHaveAttribute("href", "/contact");
  });
  it(
    "shows server errors rather than successful submission",
    { timeout: 15000 },
    async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          json: async () => ({ error: "Database temporarily unavailable" }),
        }),
      );
      wrap(<RequestForm />);
      fireEvent.change(
        await screen.findByLabelText("Full name *", {}, { timeout: 10000 }),
        {
          target: { value: "Test Customer" },
        },
      );
      fireEvent.change(screen.getByLabelText("Email *"), {
        target: { value: "customer@example.test" },
      });
      fireEvent.change(screen.getByLabelText("Telephone *"), {
        target: { value: "+211924265999" },
      });
      fireEvent.change(screen.getByLabelText("Your message *"), {
        target: { value: "Please help me find a property." },
      });
      fireEvent.click(screen.getByRole("checkbox"));
      fireEvent.click(screen.getByRole("button", { name: "Send request" }));
      await waitFor(() =>
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Database temporarily unavailable",
        ),
      );
      expect(
        screen.queryByText("Thank you. Your request is saved."),
      ).not.toBeInTheDocument();
    },
  );
});

describe("Dedicated service category pages", () => {
  it.each([
    ["real-estate-and-property-services", "service"],
    ["construction-and-design", "service"],
    ["construction-materials", "product"],
    ["general-supplies-and-procurement", "product"],
    ["electrical-electronics-and-it-solutions", "product"],
    ["plumbing-and-technical-services", "service"],
  ])("loads only the selected category: %s", async (slug, kind) => {
    const category = {
      id: "selected",
      slug,
      kind,
      name: "Selected category",
      description: "Published description",
    };
    const fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      json: async () =>
        url === `/api/categories?kind=${kind}`
          ? [category]
          : url.startsWith("/api/categories")
            ? []
            : url === "/api/visual-media"
              ? { assets: [] }
              : { items: [] },
    }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <MemoryRouter initialEntries={[`/services/category/${slug}`]}>
          <Routes>
            <Route
              path="/services/category/:slug"
              element={<Services categoryPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Selected category",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Discuss your requirements/ }),
    ).toHaveAttribute("href", "/quote?service=Selected%20category");
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/content/${kind}?category=${slug}&limit=100`,
        expect.anything(),
      ),
    );
  });
});

it("expands the published offerings and shows category preparation guidance", async () => {
  const category = {
    id: "plumbing",
    slug: "plumbing-and-technical-services",
    kind: "service",
    name: "Plumbing & Technical Services",
    description: "Published plumbing introduction",
  };
  const items = Array.from({ length: 7 }, (_, i) => ({
    id: String(i),
    slug: `work-${i}`,
    kind: "service",
    title: `Plumbing work ${i}`,
    summary: `Published explanation ${i}`,
    specs: {},
  }));
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => ({
      ok: true,
      json: async () =>
        url === "/api/categories?kind=service"
          ? [category]
          : url.startsWith("/api/categories")
            ? []
            : url === "/api/visual-media"
              ? {
                  assets: [
                    {
                      id: "planning-photo",
                      type: "image",
                      url: "/media/library/image-018.webp",
                      alt: "Repairing a sink drain",
                      placement:
                        "service-guide-plumbing-and-technical-services",
                      category: "Plumbing",
                    },
                  ],
                }
              : { items },
    })),
  );
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter
        initialEntries={["/services/category/plumbing-and-technical-services"]}
      >
        <Routes>
          <Route
            path="/services/category/:slug"
            element={<Services categoryPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  expect(
    await screen.findByText("Published explanation 0"),
  ).toBeInTheDocument();
  expect(screen.queryByText("Published explanation 6")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "View all 7 offerings" }));
  expect(screen.getByText("Published explanation 6")).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "From an idea to a defined request." }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Describe the affected system" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "Whether you need a new installation, repair or maintenance",
    ),
  ).toBeInTheDocument();
  expect(screen.getByAltText("Repairing a sink drain")).toHaveAttribute(
    "src",
    "/media/library/image-018.webp",
  );
  fireEvent.click(screen.getByRole("button", { name: "Show fewer" }));
  expect(screen.queryByText("Published explanation 6")).not.toBeInTheDocument();
});
