# API2image PHP Wallet API

This directory contains the PHP/MySQL backend for the database-backed wallet.
It stores only text and numeric billing data. Generated images remain outside
the database.

## Install

1. Upload `php-api` to the PHP 8.1 virtual host.
2. Copy `config/config.tdyun.example.php` to `config/config.local.php`.
3. Fill the real MySQL, SMTP, platform API, and secret values in
   `config/config.local.php`.
4. Import `sql/schema.sql` in phpMyAdmin.
5. Point the web root to `php-api/public`, or rewrite `/api/*` to
   `php-api/public/index.php`.
6. In EdgeOne Pages, set `PHP_API_BASE_URL` to the HTTPS URL of this PHP API.
7. Open `/api/health` on `api2image.top` and confirm `dbOk`,
   `platformConfigured`, `mailConfigured`, `secretConfigured`, `pdo_mysql`,
   `curl`, and `openssl` are all true.

Do not commit `config/config.local.php`.

## Important

If `api2image.top` is served over HTTPS, the API must also be HTTPS or served
from the same HTTPS domain path. Browsers block HTTPS pages from calling plain
HTTP APIs.

When the frontend calls the PHP API through EdgeOne, the proxy rewrites the
PHP login cookie onto `api2image.top`, so keep `PHP_API_BASE_URL` on HTTPS.

## API path

The frontend defaults to same-origin `/api/...`. If the PHP API has to live on
another hostname, add this before `app.js` in `index.html`:

```html
<script>
  window.API2IMAGE_API_BASE = "https://zj.tdyun.top/php-api/index.php";
</script>
```

Cookies and CORS must then also allow that domain in `config.local.php`.
