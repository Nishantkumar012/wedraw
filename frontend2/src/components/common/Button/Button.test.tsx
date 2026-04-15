import { render, screen } from "@testing-library/react";
import { Button } from "./Button";
import { describe, test, expect } from "vitest";
import "@testing-library/jest-dom";

describe("Button", () => {
  test("renders button text", () => {
    render(<Button />);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });
});