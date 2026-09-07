import { expect, test } from "@playwright/test";

test.describe("route map", () => {
  test("mounts without error and shows the 3 labeled stops", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));

    await page.goto("/");

    const map = page.locator('[role="img"][aria-label*="Mapa"]');
    await map.scrollIntoViewIfNeeded();

    await expect(map.locator("text=Sevilla")).toBeVisible();
    await expect(map.locator("text=Madrid")).toBeVisible();
    await expect(map.locator("text=Barcelona")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("redraws when the viewport is resized", async ({ page }) => {
    await page.goto("/");

    const map = page.locator('[role="img"][aria-label*="Mapa"]');
    await map.scrollIntoViewIfNeeded();
    await expect(map.locator("text=Sevilla")).toBeVisible();

    const svg = map.locator("svg");
    const before = await svg.getAttribute("width");

    await page.setViewportSize({ width: 500, height: 900 });
    await page.waitForTimeout(200);

    const after = await svg.getAttribute("width");
    expect(after).not.toBe(before);
    // still mounted and labeled correctly after the resize redraw
    await expect(map.locator("text=Barcelona")).toBeVisible();
  });
});
