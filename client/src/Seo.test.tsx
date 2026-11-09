import { describe, expect, it } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { Link, MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Seo from "./Seo";

describe("page metadata during navigation", () => {
  it("keeps published service category pages indexable", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity } },
    });
    queryClient.setQueryData(
      ["services", "categories"],
      [
        {
          id: "design",
          slug: "construction-and-design",
          kind: "service",
          name: "Construction & Design",
          description: "Discuss your building plans.",
        },
      ],
    );
    queryClient.setQueryData(["products", "categories"], []);
    const view = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={["/services/category/construction-and-design"]}
        >
          <Seo company={null} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(document.title).toBe("Construction & Design | K&M Real Estate"),
    );
    expect(
      document.querySelector('meta[name="robots"]')?.getAttribute("content"),
    ).toBe("index,follow");
    expect(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content"),
    ).toBe("Discuss your building plans.");
    view.unmount();
  });
  it("updates canonical, description and indexing rules, including returning home", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const view = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/contact"]}>
          <Seo company={null} />
          <Link to="/admin">Staff</Link>
          <Link to="/">Home</Link>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(document.title).toBe("Contact Us | K&M Real Estate"),
    );
    expect(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content"),
    ).toContain("+211 924 265 999");
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    ).toBe("https://kmrealestatecompany.com/contact");
    fireEvent.click(view.getByText("Staff"));
    await waitFor(() =>
      expect(
        document.querySelector('meta[name="robots"]')?.getAttribute("content"),
      ).toBe("noindex,nofollow"),
    );
    fireEvent.click(view.getByText("Home"));
    await waitFor(() =>
      expect(document.title).toBe(
        "Real Estate in Juba, South Sudan | K&M Real Estate",
      ),
    );
    expect(
      document.querySelector('meta[name="robots"]')?.getAttribute("content"),
    ).toBe("index,follow");
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    ).toBe("https://kmrealestatecompany.com/");
    view.unmount();
  });
});
