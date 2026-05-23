CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(254) NOT NULL,
  email_hash CHAR(64) NOT NULL,
  balance_cents INT NOT NULL DEFAULT 0,
  status ENUM('active','disabled') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  last_login_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_users_email (email),
  UNIQUE KEY uniq_users_email_hash (email_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  last_seen_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_sessions_token_hash (token_hash),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_visitors (
  visitor_hash CHAR(64) NOT NULL,
  first_seen_at DATETIME NOT NULL,
  last_seen_at DATETIME NOT NULL,
  PRIMARY KEY (visitor_hash),
  KEY idx_site_visitors_last_seen (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_daily_stats (
  stat_date DATE NOT NULL,
  total_visits INT NOT NULL DEFAULT 0,
  peak_online INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(254) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  purpose VARCHAR(32) NOT NULL DEFAULT 'login',
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  attempts INT NOT NULL DEFAULT 0,
  ip_hash CHAR(64) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_email_codes_email (email),
  KEY idx_email_codes_created (created_at),
  KEY idx_email_codes_ip (ip_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS redeem_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code_hash CHAR(64) NOT NULL,
  code_prefix VARCHAR(12) NOT NULL DEFAULT '',
  code_suffix VARCHAR(12) NOT NULL DEFAULT '',
  amount_cents INT NOT NULL,
  label VARCHAR(120) NOT NULL DEFAULT '',
  status ENUM('active','used','disabled') NOT NULL DEFAULT 'active',
  used_by_user_id BIGINT UNSIGNED NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_redeem_codes_hash (code_hash),
  KEY idx_redeem_codes_status (status),
  KEY idx_redeem_codes_user (used_by_user_id),
  CONSTRAINT fk_redeem_codes_user FOREIGN KEY (used_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('redeem','charge','refund','adjust') NOT NULL,
  amount_cents INT NOT NULL,
  balance_before_cents INT NOT NULL,
  balance_after_cents INT NOT NULL,
  related_id VARCHAR(80) NOT NULL DEFAULT '',
  log_code VARCHAR(40) NOT NULL DEFAULT '',
  note VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_wallet_ledger_user_created (user_id, created_at),
  KEY idx_wallet_ledger_related (related_id),
  KEY idx_wallet_ledger_log_code (log_code),
  CONSTRAINT fk_wallet_ledger_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS generation_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  request_id VARCHAR(80) NOT NULL,
  log_code VARCHAR(40) NOT NULL DEFAULT '',
  mode VARCHAR(16) NOT NULL,
  model VARCHAR(80) NOT NULL DEFAULT '',
  prompt VARCHAR(1000) NOT NULL DEFAULT '',
  size VARCHAR(40) NOT NULL DEFAULT '',
  ratio VARCHAR(40) NOT NULL DEFAULT '',
  batch_index INT NOT NULL DEFAULT 0,
  batch_total INT NOT NULL DEFAULT 0,
  image_count INT NOT NULL,
  price_cents INT NOT NULL,
  total_cents INT NOT NULL,
  status ENUM('reserved','succeeded','failed','refunded') NOT NULL DEFAULT 'reserved',
  error_message VARCHAR(500) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_generation_request_id (request_id),
  KEY idx_generation_user_created (user_id, created_at),
  KEY idx_generation_log_code (log_code),
  CONSTRAINT fk_generation_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gallery_images (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  image_filename VARCHAR(120) NOT NULL,
  mime_type VARCHAR(80) NOT NULL DEFAULT 'image/jpeg',
  prompt VARCHAR(1000) NOT NULL DEFAULT '',
  model VARCHAR(120) NOT NULL DEFAULT '',
  ratio VARCHAR(20) NOT NULL DEFAULT '',
  resolution_tier VARCHAR(10) NOT NULL DEFAULT '',
  size VARCHAR(40) NOT NULL DEFAULT '',
  quality VARCHAR(40) NOT NULL DEFAULT '',
  width INT NOT NULL DEFAULT 1,
  height INT NOT NULL DEFAULT 1,
  status ENUM('active','hidden') NOT NULL DEFAULT 'active',
  pinned_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_gallery_status_created (status, id),
  KEY idx_gallery_status_pinned_created (status, pinned_at, id),
  KEY idx_gallery_user_created (user_id, id),
  UNIQUE KEY uniq_gallery_filename (image_filename),
  CONSTRAINT fk_gallery_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  scope VARCHAR(40) NOT NULL,
  key_hash CHAR(64) NOT NULL,
  count INT NOT NULL DEFAULT 0,
  window_start_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_rate_limit_scope_key (scope, key_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  action VARCHAR(80) NOT NULL,
  target_id VARCHAR(80) NOT NULL DEFAULT '',
  detail TEXT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_admin_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_settings (
  setting_key VARCHAR(80) NOT NULL,
  setting_value MEDIUMTEXT NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
