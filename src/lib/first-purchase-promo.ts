export const FIRST_PURCHASE_PROMO_SEEN_KEY = "mh_first_purchase_announcement_v2";
export const FIRST_PURCHASE_FOOTER_DISMISSED_KEY =
  "mh_first_purchase_footer_dismissed_v1";
export const FIRST_PURCHASE_PROMO_DISMISSED_EVENT =
  "mh-first-purchase-promo-dismissed";

export function markFirstPurchasePromoSeen() {
  try {
    sessionStorage.setItem(FIRST_PURCHASE_PROMO_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FIRST_PURCHASE_PROMO_DISMISSED_EVENT));
  }
}

export function hasSeenFirstPurchasePromo() {
  try {
    return sessionStorage.getItem(FIRST_PURCHASE_PROMO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markFirstPurchaseFooterDismissed() {
  try {
    localStorage.setItem(FIRST_PURCHASE_FOOTER_DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FIRST_PURCHASE_PROMO_DISMISSED_EVENT));
  }
}

export function hasDismissedFirstPurchaseFooter() {
  try {
    return localStorage.getItem(FIRST_PURCHASE_FOOTER_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}
