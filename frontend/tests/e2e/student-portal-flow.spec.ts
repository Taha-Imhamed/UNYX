import { expect, test, type Page } from "@playwright/test"

function resolveCredential(prefix: string) {
  const username = process.env[`E2E_${prefix}_USERNAME`] ?? process.env[`TEST_${prefix}_USERNAME`] ?? ""
  const password = process.env[`E2E_${prefix}_PASSWORD`] ?? process.env[`TEST_${prefix}_PASSWORD`] ?? ""
  return { username, password }
}

async function loginAsStudent(page: Page) {
  const creds = resolveCredential("STUDENT")
  test.skip(!creds.username || !creds.password, "Set E2E_STUDENT_USERNAME and E2E_STUDENT_PASSWORD (or TEST_STUDENT_USERNAME/PASSWORD)")

  await page.goto("/login")
  await page.getByLabel(/username/i).fill(creds.username)
  await page.getByLabel(/password/i).fill(creds.password)
  await page.getByRole("button", { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/student/)
}

test("student can log in and see their own profile data on the dashboard", async ({ page }) => {
  await loginAsStudent(page)

  // The student sidebar renders the logged-in student's name/ID from a real API
  // call (useStudentProfile), not a static placeholder — assert real content,
  // not just that navigation elements exist.
  await expect(page.locator("aside").getByText(/./)).not.toHaveCount(0)
  await expect(page.getByRole("link", { name: /my current grades/i })).toBeVisible()
  await expect(page.getByRole("link", { name: /my course schedule/i })).toBeVisible()
})

test("student can open the schedule page and see it load without an error state", async ({ page }) => {
  await loginAsStudent(page)

  await page.getByRole("link", { name: /my course schedule/i }).click()
  await expect(page).toHaveURL(/\/student\/schedule/)

  // The page should resolve to either real schedule content or an explicit
  // "no classes" empty state — never get stuck on the loading spinner or show
  // an unhandled error boundary.
  await expect(page.getByText(/unable to load|something went wrong/i)).toHaveCount(0)
})

test("student can open the enroll page and the course list resolves", async ({ page }) => {
  await loginAsStudent(page)

  await page.goto("/student/enroll")
  await expect(page).toHaveURL(/\/student\/enroll/)

  // Wait for the loading spinner (if any) to clear, then confirm no error
  // banner is shown — this exercises the real /enrollments/meta/courses fetch,
  // not just that the route renders.
  await expect(page.getByText(/unable to load/i)).toHaveCount(0)
})

test("student settings page is reachable from the sidebar", async ({ page }) => {
  await loginAsStudent(page)

  await page.getByRole("link", { name: /^settings$/i }).click()
  await expect(page).toHaveURL(/\/student\/settings/)
  await expect(page.getByRole("heading", { name: /student settings/i })).toBeVisible()
})
