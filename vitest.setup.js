import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { createElement } from "react";
import "./app/globals.css";

afterEach(cleanup);

// next/image renders through an optimization loader that jsdom can't serve;
// tests only care that the right src/alt reach the DOM, so swap in a plain <img>.
vi.mock("next/image", () => ({
  default: ({ fill, sizes, priority, ...rest }) => createElement("img", rest),
}));
