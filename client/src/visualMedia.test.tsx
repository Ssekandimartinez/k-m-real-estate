import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import MediaGallery from "./MediaGallery";
import { VisualPhoto } from "./visualMedia";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("renders curated photos and gallery videos without any API requests", () => {
  const fetch = vi.fn(() => new Promise(() => {}));
  vi.stubGlobal("fetch", fetch);
  const { container } = render(
    <MemoryRouter initialEntries={["/gallery?type=video"]}>
      <VisualPhoto slot="home-hero-0" priority />
      <MediaGallery />
    </MemoryRouter>,
  );
  expect(container.querySelector("img")).toHaveAttribute(
    "src",
    expect.stringMatching(/^\/media\//),
  );
  expect(screen.getByRole("status")).toHaveTextContent("Page 1 of");
  const videos = container.querySelectorAll("video");
  expect(videos.length).toBeGreaterThan(0);
  for (const video of videos) {
    expect(video).toHaveAttribute("preload", "none");
    expect(video.querySelector("source")).toHaveAttribute(
      "src",
      expect.stringMatching(/^\/media\/library\/.*\.mp4$/),
    );
  }
  expect(fetch).not.toHaveBeenCalled();
});
