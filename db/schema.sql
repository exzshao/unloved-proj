CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone_hash TEXT UNIQUE NOT NULL,
  phone_last4 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_phone_hash ON users(phone_hash);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_target_hash ON submissions(target_hash);

CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  user_a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_pair UNIQUE (user_a, user_b)
);
