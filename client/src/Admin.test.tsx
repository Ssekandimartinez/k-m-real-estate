import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Admin from "./Admin";

afterEach(cleanup);

it("removes website settings access even when an administrator opens the old URL", () => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  client.setQueryData(["session"], {
    user: {
      id: "admin",
      name: "Administrator",
      email: "admin@example.test",
      role: "ADMIN",
    },
    csrfToken: "test-token",
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/admin/settings"]}>
        <Admin />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  expect(
    screen.queryByRole("link", { name: "Website content" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Save website settings/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText("You do not have access to this module."),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Properties" })).toHaveAttribute(
    "href",
    "/admin/property",
  );
  expect(screen.getByRole("link", { name: "Media library" })).toHaveAttribute(
    "href",
    "/admin/media",
  );
});
