export const FIRST_PURCHASE_PROMO_SEEN_KEY = "mh_first_purchase_promo_seen";
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
