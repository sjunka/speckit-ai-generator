import { test, expect } from "@playwright/test";

// The route side of FR-003, in a real browser rather than against a mocked
// matcher: the gallery is not reachable without a session.
test("a visitor with no session is sent from the gallery to sign-in", async ({ page }) => {
  await page.goto("/gallery");

  await expect(page).toHaveURL(/\/sign-in/);
});
