/**
 * Shared flash deal helpers (order placement + flash deal routes).
 */

export function calcDiscountedPrice(priceLkr, discountType, discountValue) {
  let discounted = priceLkr;
  if (discountType === "PERCENT") {
    discounted = Math.round(priceLkr * (1 - discountValue / 100));
  } else if (discountType === "FLAT_LKR") {
    discounted = Math.round(priceLkr - discountValue);
  }
  if (discounted < 50) discounted = 50;
  if (discounted > priceLkr) discounted = priceLkr;
  return discounted;
}

/**
 * Returns a Map: menuItemId (string) -> { discountedPriceLkr, dealId }.
 * Caller must pass deals already filtered by time window. First deal per item wins.
 */
export function buildItemDealPrices(activeDeals, menuItems) {
  const menuMap = new Map(menuItems.map((m) => [String(m._id), m]));
  const result = new Map();
  for (const deal of activeDeals) {
    for (const mid of deal.menuItemIds || []) {
      const idStr = String(mid);
      if (result.has(idStr)) continue;
      const m = menuMap.get(idStr);
      if (m) {
        const discounted = calcDiscountedPrice(m.priceLkr, deal.discountType, deal.discountValue);
        result.set(idStr, { discountedPriceLkr: discounted, dealId: deal._id });
      }
    }
  }
  return result;
}
