export interface Env {
  ASSETS: Fetcher;
  BUCKET?: R2Bucket;
  DB?: D1Database;
  AUTH_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  TWITTER_CLIENT_ID?: string;
  TWITTER_CLIENT_SECRET?: string;
}
