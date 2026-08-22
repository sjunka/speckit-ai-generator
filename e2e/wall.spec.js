import { test, expect } from "@playwright/test";

// Credential-free by design: the wall is the one screen a stranger reaches, and
// no unit test can prove the route matcher lets them through (SC-004).
test("a visitor with no session reaches the wall", async ({ page }) => {
  await page.goto("/wall");

  await expect(page.getByRole("heading", { name: "Wall" })).toBeVisible();
  await expect(page).toHaveURL(/\/wall$/);
  expect(page.url()).not.toContain("/sign-in");
});
