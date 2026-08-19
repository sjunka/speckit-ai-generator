import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SignInPage from "./page.jsx";

vi.mock("@clerk/nextjs", () => ({
  SignIn: (props) => <div data-testid="clerk-sign-in" data-redirect={props.forceRedirectUrl} />,
}));

describe("Sign-in page", () => {
  it("delegates to Clerk's hosted component with no hand-written form", () => {
    const { container } = render(<SignInPage />);

    expect(screen.getByTestId("clerk-sign-in")).toBeInTheDocument();
    expect(container.querySelector("form")).toBeNull();
    expect(container.querySelector("input")).toBeNull();
  });

  it("lands on capture once sign-in completes", () => {
    render(<SignInPage />);

    expect(screen.getByTestId("clerk-sign-in")).toHaveAttribute("data-redirect", "/capture");
  });
});
