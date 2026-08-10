import { expect, test, type Page } from "@playwright/test"

type RoleCase = {
  role: string
  path: string
  envPrefix: string
  visibleNav: string[]
  hiddenNav: string[]
}

const roleCases: RoleCase[] = [
  {
    role: "security",
    path: "/dashboard/security",
    envPrefix: "SECURITY",
    visibleNav: ["Dashboard"],
    hiddenNav: ["Users"],
  },
  {
    role: "facilities",
    path: "/dashboard/facilities",
    envPrefix: "FACILITIES",
    visibleNav: ["Dashboard"],
    hiddenNav: ["Users"],
  },
  {
    role: "research-office",
    path: "/dashboard/research-office",
    envPrefix: "RESEARCH_OFFICE",
    visibleNav: ["Dashboard"],
    hiddenNav: ["Users"],
  },
  {
    role: "it-admin",
    path: "/dashboard/it-admin",
    envPrefix: "IT_ADMIN",
    visibleNav: ["Users", "Settings"],
    hiddenNav: ["Finance"],
  },
  {
    role: "registrar",
    path: "/dashboard/registrar",
    envPrefix: "REGISTRAR",
    visibleNav: ["Enrollment"],
    hiddenNav: ["Finance"],
  },
  {
    role: "admissions",
    path: "/dashboard/admissions",
    envPrefix: "ADMISSIONS",
    visibleNav: ["Applications", "Enrollment"],
    hiddenNav: ["Users"],
  },
]

function resolveCredential(prefix: string) {
  const username = process.env[`E2E_${prefix}_USERNAME`] ?? process.env[`TEST_${prefix}_USERNAME`] ?? ""
  const password = process.env[`E2E_${prefix}_PASSWORD`] ?? process.env[`TEST_${prefix}_PASSWORD`] ?? ""
  return { username, password }
}

async function loginAs(page: Page, username: string, password: string) {
  await page.goto("/login")
  await page.getByLabel(/username/i).fill(username)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole("button", { name: /sign in/i }).click()
}

for (const entry of roleCases) {
  test(`${entry.role} lands on own workspace and sees role-appropriate nav`, async ({ page }) => {
    const creds = resolveCredential(entry.envPrefix)
    test.skip(!creds.username || !creds.password, `Set E2E_${entry.envPrefix}_USERNAME and E2E_${entry.envPrefix}_PASSWORD`)

    await loginAs(page, creds.username, creds.password)
    await expect(page).toHaveURL(new RegExp(entry.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))

    for (const label of entry.visibleNav) {
      await expect(page.getByRole("link", { name: new RegExp(`^${label}$`, "i") })).toBeVisible()
    }

    for (const label of entry.hiddenNav) {
      await expect(page.getByRole("link", { name: new RegExp(`^${label}$`, "i") })).toHaveCount(0)
    }
  })
}
