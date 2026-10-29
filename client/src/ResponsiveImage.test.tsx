import React from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ResponsiveImage from "./ResponsiveImage";

afterEach(cleanup);
it("offers smaller local images while reserving their intrinsic dimensions", () => {
  render(
    <ResponsiveImage
      src="/images/architecture.webp"
      alt="Architecture"
      sizes="100vw"
    />,
  );
  const image = screen.getByRole("img");
  expect(image).toHaveAttribute("src", "/images/architecture.webp");
  expect(image.getAttribute("srcset")).toMatch(/320\.webp 320w/);
  expect(image.getAttribute("srcset")).toMatch(/480\.webp 480w/);
  expect(Number(image.getAttribute("width"))).toBeGreaterThan(960);
  expect(Number(image.getAttribute("height"))).toBeGreaterThan(0);
});
it("preserves unknown images and explicit dimensions", () => {
  render(
    <ResponsiveImage
      src="/images/new-photo.jpg"
      alt="New photo"
      width={80}
      height={80}
    />,
  );
  expect(screen.getByRole("img")).not.toHaveAttribute("srcset");
  expect(screen.getByRole("img")).toHaveAttribute("width", "80");
});
it("uses responsive transformations only for Cloudinary image uploads", () => {
  const { rerender } = render(
    <ResponsiveImage
      src="https://res.cloudinary.com/company/image/upload/v1/photo.webp"
      alt="Upload"
      sizes="48px"
    />,
  );
  expect(screen.getByRole("img").getAttribute("srcset")).toContain(
    "/image/upload/f_auto,q_auto,c_limit,w_96/v1/photo.webp 96w",
  );
  rerender(
    <ResponsiveImage
      src="https://other.example/image/upload/photo.jpg"
      alt="Other host"
    />,
  );
  expect(screen.getByRole("img")).not.toHaveAttribute("srcset");
});
