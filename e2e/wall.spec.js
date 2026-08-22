import { test, expect } from "@playwright/test";

// Credential-free by design (plan, Bloque E). An empty storageState says so
// explicitly rather than leaning on Playwright's default: if a signed-in state
// is ever added to playwright.config.js, this spec must keep running anonymous,
// because the claim it makes is about strangers.
test.use({ storageState: { cookies: [], origins: [] } });

test("a visitor with no session reaches the wall", async ({ page }) => {
  // Every navigation the browser actually performed, redirects included.
  const visited = [];
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) visited.push(frame.url());
  });

  await page.goto("/wall");

  await expect(page.getByRole("heading", { name: "Wall" })).toBeVisible();
  await expect(page).toHaveURL(/\/wall$/);

  // SC-004: not merely "ends up on the wall" — never bounced through sign-in on
  // the way. A redirect out and back would satisfy the URL assertion alone.
  expect(visited.filter((url) => url.includes("/sign-in"))).toEqual([]);
});
