import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import PasswordInput from "./PasswordInput";
afterEach(cleanup);
it("shows and hides the typed password without changing its value", () => {
  render(
    <label>
      Password
      <PasswordInput name="password" defaultValue="example-password" />
    </label>,
  );
  const input = screen.getByLabelText("Password", { exact: true });
  expect(input).toHaveAttribute("type", "password");
  fireEvent.click(screen.getByRole("button", { name: "Show password" }));
  expect(input).toHaveAttribute("type", "text");
  expect(input).toHaveValue("example-password");
  fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
  expect(input).toHaveAttribute("type", "password");
  expect(input).toHaveValue("example-password");
});
