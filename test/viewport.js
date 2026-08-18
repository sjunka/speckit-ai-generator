import { render } from "@testing-library/react";

export function renderAt360px(component) {
  // Create a container with 360px width for testing
  const container = document.createElement("div");
  container.style.width = "360px";
  container.style.height = "auto";
  document.body.appendChild(container);
  
  const result = render(component, { container });
  
  return {
    ...result,
    cleanup: () => {
      result.unmount();
      document.body.removeChild(container);
    },
  };
}
