import { test, expect } from "@playwright/test";

// Credential-free by design (plan, Bloque E). The point of this spec is what a
// stranger gets, so the empty storageState is the subject of the test, not setup.
test.use({ storageState: { cookies: [], origins: [] } });

test("a visitor with no session is sent from the gallery to sign-in", async ({ page }) => {
  await page.goto("/gallery");

  // FR-003, route side: the Vitest suite asserts the matcher's contents, which
  // only proves the list is what we wrote. This proves a real browser is
  // actually turned away.
  await expect(page).toHaveURL(/\/sign-in/);
});
