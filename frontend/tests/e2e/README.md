# Frontend E2E (Playwright)

## Install browser binaries

```bash
pnpm exec playwright install chromium
```

## Run tests

```bash
pnpm e2e
```

## Credential environment variables

Admin test accepts either:

- `E2E_ADMIN_USERNAME` and `E2E_ADMIN_PASSWORD`
- or `TEST_ADMIN_USERNAME` and `TEST_ADMIN_PASSWORD`

Role workspace tests are optional and auto-skip unless credentials exist.

Supported role credential pairs:

- `E2E_SECURITY_USERNAME` / `E2E_SECURITY_PASSWORD`
- `E2E_FACILITIES_USERNAME` / `E2E_FACILITIES_PASSWORD`
- `E2E_RESEARCH_OFFICE_USERNAME` / `E2E_RESEARCH_OFFICE_PASSWORD`
- `E2E_IT_ADMIN_USERNAME` / `E2E_IT_ADMIN_PASSWORD`
- `E2E_REGISTRAR_USERNAME` / `E2E_REGISTRAR_PASSWORD`
- `E2E_ADMISSIONS_USERNAME` / `E2E_ADMISSIONS_PASSWORD`

## Notes

- Base URL defaults to `http://127.0.0.1:3000`.
- Override with `E2E_BASE_URL`.
- Dev server port defaults to `3000` and can be overridden with `E2E_PORT`.
