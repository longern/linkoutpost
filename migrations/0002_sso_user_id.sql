ALTER TABLE linkoutpost_users
  ADD COLUMN sso_user_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_linkoutpost_users_sso_user_id
  ON linkoutpost_users(sso_user_id)
  WHERE sso_user_id IS NOT NULL AND sso_user_id <> '';
