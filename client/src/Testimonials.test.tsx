import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Testimonials from "./Testimonials";
import { api, type Entry } from "./api";

vi.mock("./api", () => ({ api: vi.fn() }));
vi.mock("motion/react", async (original) => ({
  ...(await original<typeof import("motion/react")>()),
  useReducedMotion: () => true,
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function show(items: Entry[]) {
  vi.mocked(api).mockResolvedValue({ items });
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Testimonials />
    </QueryClientProvider>,
  );
}
const entries = ["Mary", "Joseph", "Rose"].map((title, i) => ({
  id: String(i),
  title,
  summary: `Story from ${title}`,
  specs: { sample: true },
  images: [{ url: `/images/${i}.webp`, alt: `Portrait ${i}` }],
})) as unknown as Entry[];

describe("Testimonial stories", () => {
  it("lets visitors select stories, navigate in both directions and wrap around", async () => {
    show(entries);
    expect(await screen.findByText("“Story from Mary”")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Previous testimonial" }),
    );
    expect(await screen.findByText("“Story from Rose”")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next testimonial" }));
    expect(await screen.findByText("“Story from Mary”")).toBeInTheDocument();
    const choice = screen.getByRole("button", {
      name: "Read testimonial from Joseph",
    });
    fireEvent.click(choice);
    expect(await screen.findByText("“Story from Joseph”")).toBeInTheDocument();
    expect(choice).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getAllByText(/these stories and names are fictional/),
    ).toHaveLength(1);
    expect(
      screen.queryByText("Fictional sample testimonial"),
    ).not.toBeInTheDocument();
  });
  it("omits controls and sample disclosure for a single genuine testimonial", async () => {
    show([{ ...entries[0], specs: {} }]);
    expect(await screen.findByText("“Story from Mary”")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/these stories and names are fictional/),
    ).not.toBeInTheDocument();
  });
  it("does not show an empty section when there are no published stories", async () => {
    const view = show([]);
    expect(view.container).toBeEmptyDOMElement();
  });
});
