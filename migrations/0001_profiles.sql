CREATE TABLE IF NOT EXISTS linkoutpost_users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS linkoutpost_oauth_accounts (
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (provider, provider_user_id),
  FOREIGN KEY (user_id) REFERENCES linkoutpost_users (id)
);

CREATE TABLE IF NOT EXISTS linkoutpost_profiles (
  handle TEXT PRIMARY KEY,
  owner_user_id TEXT,
  title TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  avatar_asset_id TEXT,
  links_json TEXT NOT NULL DEFAULT '[]',
  theme_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_user_id) REFERENCES linkoutpost_users (id)
);

CREATE INDEX IF NOT EXISTS idx_linkoutpost_oauth_accounts_user_id ON linkoutpost_oauth_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_linkoutpost_profiles_owner_user_id ON linkoutpost_profiles (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_linkoutpost_profiles_updated_at ON linkoutpost_profiles (updated_at);
