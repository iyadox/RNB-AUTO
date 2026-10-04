import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout (npm run e2e). Le site est lancé avec une base vide en mémoire et des
 * trajets simulés : aucun service extérieur n'est appelé, aucune donnée réelle n'est touchée.
 */
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    trace: "retain-on-failure",
  },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"], browserName: "chromium" } }],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/robots.txt`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: "pglite:memory://",
      GEO_PROVIDER: "simulation",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      SETUP_TOKEN: "",
    },
  },
});
