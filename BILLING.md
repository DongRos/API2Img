# Billing Wallet Notes

The current production billing flow uses the PHP/MySQL wallet in `php-api`.
Generated images are not stored in MySQL. The database stores users, sessions,
redeem codes, balances, generation requests, and wallet ledger rows.

## User Flow

1. User opens the wallet and logs in with an email verification code.
2. User buys a 5 yuan or 10 yuan card on the card-selling site.
3. The card-selling site emails the card code to the user.
4. User enters the code while logged in.
5. PHP marks the code as used and credits the logged-in user's database wallet.
6. Recommended API generation reserves balance, calls the upstream API, and
   refunds automatically if the upstream generation fails.

The frontend only displays server balance. Local storage must not be treated as
the source of truth for money.

## Required Production Setup

1. Upload `php-api` to the PHP 8.1 virtual host.
2. Copy `php-api/config/config.tdyun.example.php` to
   `php-api/config/config.local.php` on the server.
3. Fill real MySQL, QQ SMTP, recommended API, `secret`, and admin password
   values in `config.local.php`.
4. Import `php-api/sql/schema.sql` into MySQL.
5. Set EdgeOne Pages environment variable `PHP_API_BASE_URL` to the HTTPS URL
   of the PHP API.
6. Visit `https://api2image.top/api/health` and confirm database, mail,
   platform, secret, `pdo_mysql`, `curl`, and `openssl` are ready.

Never commit `php-api/config/config.local.php`.

## Create Redeem Codes

In the website admin panel, open the hidden admin panel with `?admin=1` or by
typing `codeadmin`, enter the PHP admin password, then generate and download the
CSV.

Command-line alternative:

```powershell
$env:BILLING_ADMIN_PASSWORD="your-admin-password"
$env:BILLING_BASE_URL="https://api2image.top"
node scripts/billing-admin.js codes:generate 5 100 "5 yuan redeem code"
node scripts/billing-admin.js codes:generate 10 100 "10 yuan redeem code"
```

Import the CSV `code` column into the card-selling platform as card inventory.
Each code can be redeemed once only.
