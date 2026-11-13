-- Additive only. Apply with the D1 migration runner's transaction.
CREATE TABLE event_feedback (
  id TEXT PRIMARY KEY NOT NULL,
  edition INTEGER NOT NULL CHECK (edition = 2026),
  rating INTEGER CHECK (rating IS NULL OR (typeof(rating) = 'integer' AND rating BETWEEN 1 AND 5)),
  enjoyed_most TEXT CHECK (length(enjoyed_most) <= 2000),
  improvements TEXT CHECK (length(improvements) <= 2000),
  next_time TEXT CHECK (length(next_time) <= 2000),
  favourite_food_drink TEXT CHECK (length(favourite_food_drink) <= 2000),
  missing_food_drink TEXT CHECK (length(missing_food_drink) <= 2000),
  organiser_message TEXT CHECK (length(organiser_message) <= 2000),
  locale TEXT NOT NULL CHECK (locale IN ('sk','en','de','es','ja')),
  submitted_at INTEGER NOT NULL,
  CHECK (rating IS NOT NULL OR length(trim(coalesce(enjoyed_most,'') || coalesce(improvements,'') || coalesce(next_time,'') || coalesce(favourite_food_drink,'') || coalesce(missing_food_drink,'') || coalesce(organiser_message,''))) > 0)
);
CREATE INDEX idx_feedback_edition_time ON event_feedback(edition, submitted_at);
CREATE TABLE newsletter_subscribers (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK (email = lower(trim(email)) COLLATE BINARY AND length(email) BETWEEN 3 AND 254),
  name TEXT CHECK (length(name) <= 100),
  status TEXT NOT NULL CHECK (status IN ('pending','confirmed','unsubscribed')),
  consent_version TEXT NOT NULL CHECK (length(consent_version) BETWEEN 1 AND 100),
  consent_accepted_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  unsubscribed_at INTEGER,
  source_locale TEXT NOT NULL CHECK (source_locale IN ('sk','en','de','es','ja')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (status != 'confirmed' OR confirmed_at IS NOT NULL),
  CHECK (status != 'unsubscribed' OR unsubscribed_at IS NOT NULL)
);
CREATE TABLE newsletter_tokens (
  token_hash TEXT PRIMARY KEY NOT NULL CHECK (length(token_hash) = 64),
  subscriber_id TEXT NOT NULL REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('confirm','unsubscribe')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  consumed_at INTEGER,
  operation_id TEXT UNIQUE,
  CHECK (purpose = 'unsubscribe' OR expires_at IS NOT NULL),
  CHECK (expires_at IS NULL OR expires_at > created_at),
  CHECK ((consumed_at IS NULL) = (operation_id IS NULL))
);
CREATE INDEX idx_newsletter_tokens_subscriber ON newsletter_tokens(subscriber_id, purpose);
CREATE TABLE newsletter_consent_events (
  id TEXT PRIMARY KEY NOT NULL,
  subscriber_id TEXT NOT NULL REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  event TEXT NOT NULL CHECK (event IN ('requested','confirmed','withdrawn')),
  consent_version TEXT NOT NULL,
  occurred_at INTEGER NOT NULL
);
CREATE INDEX idx_consent_subscriber_time ON newsletter_consent_events(subscriber_id, occurred_at);
-- Short-lived, pseudonymous abuse records; never raw IPs, email, or user agents.
CREATE TABLE submission_limits (
  key_hash TEXT PRIMARY KEY NOT NULL,
  count INTEGER NOT NULL CHECK (count > 0),
  expires_at INTEGER NOT NULL
);
CREATE TABLE submission_challenges (
  token_hash TEXT PRIMARY KEY NOT NULL,
  expires_at INTEGER NOT NULL
);
