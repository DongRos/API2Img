# Deploy To EdgeOne Pages

This project builds a static frontend plus EdgeOne functions into `.edgeone`.
The money-related API routes are proxied to the PHP/MySQL wallet backend.

## Build Settings

Use these EdgeOne Pages settings:

- Framework preset: Other / Static Site
- Build command: `node scripts/build-edgeone.mjs`
- Output directory: `.edgeone`
- Node version: `22.11.0`

The repo already includes `edgeone.json` with these settings.

## Required Environment Variable

Set this in EdgeOne Pages:

```text
PHP_API_BASE_URL=https://zj.tdyun.top/php-api/index.php
```

Use an HTTPS URL. The frontend is served from `https://api2image.top`, so the
proxied PHP API must also be reachable over HTTPS.

## Runtime Check

After deployment, open:

```text
https://api2image.top/api/health
```

A healthy production setup should report:

- `dbOk: true`
- `platformConfigured: true`
- `mailConfigured: true`
- `secretConfigured: true`
- `extensions.pdo_mysql: true`
- `extensions.curl: true`
- `extensions.openssl: true`

If `phpProxy` is false or the status is 503, EdgeOne is not reaching the PHP
backend. Check `PHP_API_BASE_URL` first.

## Notes

- Do not put the recommended API key in frontend code.
- Do not commit `php-api/config/config.local.php`.
- Recommended API generation uses `/api/generate/platform`; the backend handles
  balance reservation, upstream generation, and refund on upstream failure.
- Old Blob wallet routes are deprecated. Announcements and site statistics may
  still use EdgeOne Blob because they do not affect balances.
