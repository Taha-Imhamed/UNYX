import { expect, test, type Page } from "@playwright/test"

function resolveCredential(prefix: string) {
  const username = process.env[`E2E_${prefix}_USERNAME`] ?? process.env[`TEST_${prefix}_USERNAME`] ?? ""
  const password = process.env[`E2E_${prefix}_PASSWORD`] ?? process.env[`TEST_${prefix}_PASSWORD`] ?? ""
  return { username, password }
}

async function loginAs(page: Page, username: string, password: string) {
  await page.goto("/login")
  await expect(page.getByRole("heading", { name: /continue to your dashboard/i })).toBeVisible()
  await page.getByLabel(/username/i).fill(username)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole("button", { name: /sign in/i }).click()
}

test("login screen renders forgot-password support", async ({ page }) => {
  await page.goto("/login")

  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible()
  await page.getByRole("button", { name: /forgot password\?/i }).click()
  await expect(page.getByText(/please contact your advisor or administrator/i)).toBeVisible()
})

test("invalid credentials show error message", async ({ page }) => {
  await loginAs(page, "definitely-wrong-user", "wrong-password")
  await expect(page.getByText(/invalid credentials\. please try again\./i)).toBeVisible()
})

test("admin can login and navigate core dashboard sections", async ({ page }) => {
  const admin = resolveCredential("ADMIN")
  test.skip(!admin.username || !admin.password, "Provide E2E_ADMIN_USERNAME/E2E_ADMIN_PASSWORD or TEST_ADMIN_USERNAME/TEST_ADMIN_PASSWORD")

  await loginAs(page, admin.username, admin.password)
  await expect(page).toHaveURL(/\/(dashboard|student)/)

  // If a student account was accidentally provided, stop this admin-specific test.
  test.skip(page.url().includes("/student"), "Admin credentials are required for dashboard role checks")

  await expect(page.getByText(/admin portal/i).first()).toBeVisible()
  await expect(page.getByPlaceholder(/search anything/i)).toBeVisible()

  await page.getByRole("link", { name: /^finance$/i }).click()
  await expect(page).toHaveURL(/\/dashboard\/finance/)

  await page.getByRole("link", { name: /^users$/i }).click()
  await expect(page).toHaveURL(/\/dashboard\/users/)
})
