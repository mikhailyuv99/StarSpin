export type SubscriptionStatus = "active" | "trial" | "past_due" | "cancelled";
export type ReviewScreenshotStatus = "pending" | "verified" | "rejected";

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  tripadvisor?: string;
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
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  billing_plan?: "monthly" | "quarterly" | "annual" | null;
  spin_cooldown_days?: number;
  flow_steps?: import("@/lib/flow-steps").FlowActionStep[];
  qr_fg_color?: string;
  qr_bg_color?: string;
  qr_design?: Record<string, unknown> | null;
  customer_page_headline?: string | null;
  customer_page_subtitle?: string | null;
  spin_button_label?: string | null;
  journey_theme?: Record<string, unknown> | null;
  prize_odds_mode?: import("@/lib/prize-rarity").PrizeOddsMode;
  created_at: string;
}

export type PrizeMechanic =
  | "standard"
  | "retry"
  | "no_win"
  | "near_miss"
  | "mystery"
  | "double_or_nothing"
  | "social_unlock";

export interface Prize {
  id: string;
  merchant_id: string;
  label: string;
  /** Catalog key for the wheel silhouette (see prize-icons). */
  icon?: string | null;
  /** Win chance percent (1–100); active wheel prizes should sum to 100 in advanced mode. */
  probability_weight: number;
  rarity_tier?: import("@/lib/prize-rarity").PrizeRarityTier | string | null;
  prize_mechanic?: PrizeMechanic | string | null;
  /** Required when prize_mechanic is social_unlock. */
  social_unlock_platform?: "instagram" | "facebook" | "tiktok" | string | null;
  stock_remaining: number | null;
  active: boolean;
  redeem_next_visit?: boolean;
  redeem_min_spend_cents?: number | null;
  redeem_valid_days?: number | null;
  created_at: string;
}

export interface Spin {
  id: string;
  merchant_id: string;
  prize_id: string;
  resolved_prize_id?: string | null;
  device_fingerprint: string;
  phone_number: string | null;
  followed_social: boolean;
  review_screenshot_url: string | null;
  review_screenshot_status: ReviewScreenshotStatus;
  claim_first_name?: string | null;
  claim_email?: string | null;
  claim_phone?: string | null;
  prize_code?: string | null;
  claim_notified_at?: string | null;
  redeem_next_visit?: boolean | null;
  redeem_min_spend_cents?: number | null;
  redeem_expires_at?: string | null;
  completed_flow_steps?: import("@/lib/flow-steps").FlowActionStep[];
  created_at: string;
  prize?: Prize;
}

export interface ReviewCountHistory {
  id: string;
  merchant_id: string;
  count: number;
  checked_at: string;
}

export type { PublicStep } from "@/lib/flow-steps";
