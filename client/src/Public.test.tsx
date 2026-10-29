import React from "react";
import { afterEach, describe, it, expect, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RequestForm, Empty } from "./Public";
afterEach(() => {
  cleanup();
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
describe("Customer request flow", () => {
  it("does not pretend empty inventory is an active listing", () => {
    wrap(<Empty kind="property" />);
    expect(screen.getByText(/No published properties/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Talk to our team/ }),
    ).toHaveAttribute("href", "/contact");
  });
  it("shows server errors rather than successful submission", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Database temporarily unavailable" }),
      }),
    );
    wrap(<RequestForm />);
    fireEvent.change(await screen.findByLabelText("Full name *"), {
      target: { value: "Test Customer" },
    });
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
  });
});
