import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import MediaGallery from "./MediaGallery";

vi.mock("./Public", () => ({
  PageHero: () => <h1>Visual collection</h1>,
  LoadingError: () => <p>Loading</p>,
}));
vi.mock("./visualMedia", () => ({
  useVisualMedia: () => ({
    data: {
      assets: Array.from({ length: 21 }, (_, i) => ({
        id: `image-${i}`,
        type: "image",
        url: `/media/image-${i}.webp`,
        alt: `Photo ${i}`,
        category: i < 19 ? "Property" : "Plumbing",
        placement: i === 20 ? "home-intro" : "gallery",
      })),
    },
  }),
  VisualVideo: () => <video />,
}));
afterEach(cleanup);
it("paginates the full collection without repeating page placements", () => {
  render(
    <MemoryRouter>
      <MediaGallery />
    </MemoryRouter>,
  );
  expect(screen.getAllByRole("img")).toHaveLength(18);
  expect(screen.queryByAltText("Photo 20")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getAllByRole("img")).toHaveLength(2);
  expect(screen.getByAltText("Photo 18")).toBeInTheDocument();
  expect(screen.queryByAltText("Photo 0")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Explore by subject"), {
    target: { value: "Plumbing" },
  });
  expect(screen.getAllByRole("img")).toHaveLength(1);
  expect(screen.getByRole("status")).toHaveTextContent("Page 1 of 1");
});
