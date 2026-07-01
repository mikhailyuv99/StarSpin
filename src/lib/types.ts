export type SubscriptionStatus = "active" | "trial" | "past_due" | "cancelled";
export type ReviewScreenshotStatus = "pending" | "verified" | "rejected";

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
}

export interface Merchant {
  id: string;
  slug: string;
  owner_id: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  google_review_link: string | null;
  google_place_id: string | null;
  social_links: SocialLinks;
  subscription_status: SubscriptionStatus;
  created_at: string;
}

export interface Prize {
  id: string;
  merchant_id: string;
  label: string;
  probability_weight: number;
  stock_remaining: number | null;
  active: boolean;
  created_at: string;
}

export interface Spin {
  id: string;
  merchant_id: string;
  prize_id: string;
  device_fingerprint: string;
  phone_number: string | null;
  followed_social: boolean;
  review_screenshot_url: string | null;
  review_screenshot_status: ReviewScreenshotStatus;
  claim_first_name?: string | null;
  claim_email?: string | null;
  prize_code?: string | null;
  claim_notified_at?: string | null;
  created_at: string;
  prize?: Prize;
}

export interface ReviewCountHistory {
  id: string;
  merchant_id: string;
  count: number;
  checked_at: string;
}

export type PublicStep = "social" | "review" | "wheel" | "claim" | "result";
