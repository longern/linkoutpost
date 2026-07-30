export interface Env {
  ASSETS: Fetcher;
  BUCKET?: R2Bucket;
  DB?: D1Database;
  AUTH_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  SHOPIFY_STOREFRONT_DOMAIN?: string;
  SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID?: string;
  SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET?: string;
  TWITTER_CLIENT_ID?: string;
  TWITTER_CLIENT_SECRET?: string;
  VITE_SITE_TITLE?: string;
}
