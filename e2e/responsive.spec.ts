import { expect, test } from "@playwright/test";

const MOBILE = { width: 375, height: 800 };
const DESKTOP = { width: 1200, height: 900 };

test.describe("mobile layout (~375px)", () => {
  test.use({ viewport: MOBILE });

  test("nav links hide, wordmark and buttons stay reachable and tap-sized", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Cómo funciona" })).toBeHidden();
    await expect(page.getByRole("link", { name: "Gastos" })).toBeHidden();

    const banner = page.getByRole("banner");
    await expect(banner.getByText("wonderSplit", { exact: true })).toBeVisible();

    const ingresar = banner.getByRole("button", { name: "Ingresar" });
    const armar = banner.getByRole("button", { name: "Armar un viaje" });
    await expect(ingresar).toBeVisible();
    await expect(armar).toBeVisible();

    for (const button of [ingresar, armar]) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("hero and cómo funciona collapse to a single column", async ({ page }) => {
    await page.goto("/");

    const heroHeading = page.getByRole("heading", { level: 1 });
    const tripCard = page.getByText("12–19 oct · 6 viajeros");
    const headingBox = await heroHeading.boundingBox();
    const cardBox = await tripCard.boundingBox();
    // stacked vertically: the trip card starts below the heading, not beside it
    expect(cardBox!.y).toBeGreaterThan(headingBox!.y + headingBox!.height);

    const steps = page.locator("#como-funciona h2 ~ div > div");
    const first = await steps.nth(0).boundingBox();
    const second = await steps.nth(1).boundingBox();
    expect(second!.y).toBeGreaterThan(first!.y + first!.height - 5);
  });

  test("a ledger row's label sits above its amount, not beside it", async ({
    page,
  }) => {
    await page.goto("/");

    // "Depa en Triana" also appears as a Vouchers stop-card item, so scope
    // to the hero (the page's first section) to find the ledger row.
    const heroSection = page.locator("section").first();
    const row = heroSection
      .getByText("Depa en Triana")
      .locator("xpath=..")
      .locator("xpath=..");
    const label = row.getByText("Depa en Triana");
    const amount = row.getByText("€620,00");
    const labelBox = await label.boundingBox();
    const amountBox = await amount.boundingBox();
    expect(amountBox!.y).toBeGreaterThan(labelBox!.y + labelBox!.height - 5);
  });
});

test.describe("desktop layout (~1200px)", () => {
  test.use({ viewport: DESKTOP });

  test("nav links are visible and grids run multi-column", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Cómo funciona" })).toBeVisible();

    const heroHeading = page.getByRole("heading", { level: 1 });
    const tripCard = page.getByText("12–19 oct · 6 viajeros");
    const headingBox = await heroHeading.boundingBox();
    const cardBox = await tripCard.boundingBox();
    // side by side: the trip card is roughly level with the heading, not below it
    expect(Math.abs(cardBox!.y - headingBox!.y)).toBeLessThan(headingBox!.height * 2);

    const steps = page.locator("#como-funciona h2 ~ div > div");
    const first = await steps.nth(0).boundingBox();
    const second = await steps.nth(1).boundingBox();
    expect(Math.abs(second!.y - first!.y)).toBeLessThan(10);
  });

  test("a ledger row's label and amount sit side by side", async ({ page }) => {
    await page.goto("/");

    // "Depa en Triana" also appears as a Vouchers stop-card item, so scope
    // to the hero (the page's first section) to find the ledger row.
    const heroSection = page.locator("section").first();
    const row = heroSection
      .getByText("Depa en Triana")
      .locator("xpath=..")
      .locator("xpath=..");
    const label = row.getByText("Depa en Triana");
    const amount = row.getByText("€620,00");
    const labelBox = await label.boundingBox();
    const amountBox = await amount.boundingBox();
    expect(Math.abs(amountBox!.y - labelBox!.y)).toBeLessThan(10);
  });
});

test("keyboard-focusing a nav link shows the terracota ring, not the browser default", async ({
  page,
}) => {
  await page.setViewportSize(DESKTOP);
  await page.goto("/");

  const link = page.getByRole("link", { name: "Cómo funciona" });
  await link.focus();

  const outline = await link.evaluate((el) => {
    const style = getComputedStyle(el);
    return { color: style.outlineColor, style: style.outlineStyle };
  });

  expect(outline.style).toBe("solid");
  expect(outline.color).toBe("rgb(193, 104, 47)"); // --focus-ring (light mode)
});

test("prefers-reduced-motion collapses the hero's entrance animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const duration = await page
    .locator("section")
    .first()
    .evaluate((el) => getComputedStyle(el).animationDuration);

  expect(parseFloat(duration)).toBeLessThan(0.01);
});
