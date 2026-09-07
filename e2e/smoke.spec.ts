import { expect, test } from "@playwright/test";

test("home page loads in light mode", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("banner").getByText("wonderSplit", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
});
