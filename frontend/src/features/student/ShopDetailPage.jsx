import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useCart } from "../../lib/CartContext";
import { Plus, ShoppingCart, Zap, Star, ChevronLeft } from "lucide-react";

const BRAND = "#006B3D";
const DEFAULT_SHOP_IMAGE = "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=85";
const DEFAULT_ITEM_IMAGE = "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=200&q=80";

export function ShopDetailPage() {
  const { shopId } = useParams();
  const { shopId: cartShopId, setShop, addItem, items, subtotal } = useCart();

  const { data: shopData, isLoading: shopLoading } = useQuery({
    queryKey: ["shop", shopId],
    queryFn: () => api.get(`/api/v1/shops/${shopId}`),
    enabled: !!shopId,
  });

  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ["shop-menu", shopId],
    queryFn: () => api.get(`/api/v1/shops/${shopId}/menu`),
    enabled: !!shopId,
  });

  const { data: dealsData } = useQuery({
    queryKey: ["flash-deals-active"],
    queryFn: () => api.get("/api/v1/flash-deals/active"),
  });

  const { data: ratingsData } = useQuery({
    queryKey: ["shop-ratings", shopId],
    queryFn: () => api.get(`/api/v1/shops/${shopId}/ratings`),
    enabled: !!shopId,
  });

  const shop = shopData?.data;
  const ratings = ratingsData?.data;
  const menu = menuData?.data ?? [];
  const allDeals = dealsData?.data ?? [];
  const shopDeals = allDeals.filter((d) => d.shopId === shopId);
  const dealByItemId = new Map();
  shopDeals.forEach((d) => {
    d.items?.forEach((it) => {
      dealByItemId.set(it.menuItemId, {
        discountedPriceLkr: it.discountedPriceLkr,
        originalPriceLkr: it.originalPriceLkr,
        title: d.title,
      });
    });
  });
  const isLoading = shopLoading || menuLoading;

  const handleAdd = (item) => {
    if (cartShopId && cartShopId !== shopId) {
      if (!window.confirm("Your cart has items from another shop. Replace cart?")) return;
    }
    setShop(shopId, shop?.name ?? "Shop");
    const deal = dealByItemId.get(item.id);
    const priceLkr = deal ? deal.discountedPriceLkr : item.priceLkr;
    addItem({
      menuItemId: item.id,
      name: item.name,
      priceLkr,
      qty: 1,
    });
  };

  if (isLoading || !shop) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="h-8 w-32 animate-pulse rounded bg-black/10" />
        <div className="mt-6 h-48 animate-pulse rounded-2xl bg-black/5" />
        <p className="mt-4 text-black/60">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <Link
        to="/student/shops"
        className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
        style={{ color: BRAND }}
      >
        <ChevronLeft className="h-4 w-4" /> Shops
      </Link>

      {/* Hero */}
      <div className="relative mt-4 aspect-[21/9] overflow-hidden rounded-2xl bg-black/10">
        <img src={DEFAULT_SHOP_IMAGE} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="font-display text-2xl font-bold drop-shadow md:text-3xl">{shop.name}</h1>
          {ratings?.averageRating != null && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/90">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {ratings.averageRating} ({ratings.totalCount} reviews)
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm text-black/60">
        <span>{shop.address}</span>
        {shop.phone && <span>· {shop.phone}</span>}
      </div>

      {/* Flash deals */}
      {shopDeals.length > 0 && (
        <div className="mt-6 rounded-2xl border-2 p-5" style={{ borderColor: `${BRAND}30`, backgroundColor: `${BRAND}08` }}>
          <h2 className="flex items-center gap-2 font-semibold text-black">
            <Zap className="h-5 w-5" style={{ color: BRAND }} /> Flash deals
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-black/80">
            {shopDeals.map((d) => (
              <li key={d.id}>
                <strong>{d.title}</strong>
                {d.items?.length > 0 && (
                  <span className="ml-2">
                    — {d.items.map((i) => `${i.name} LKR ${i.discountedPriceLkr}`).join(", ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Menu */}
      <h2 className="mt-8 font-display text-xl font-bold text-black">Menu</h2>
      {menu.length === 0 ? (
        <p className="mt-4 text-black/60">No items available right now.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {menu.map((item) => {
            const deal = dealByItemId.get(item.id);
            const displayPrice = deal ? deal.discountedPriceLkr : item.priceLkr;
            return (
              <li
                key={item.id}
                className="flex gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-black/5">
                  <img
                    src={item.imageUrl || DEFAULT_ITEM_IMAGE}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-black">{item.name}</p>
                      {item.description && (
                        <p className="mt-0.5 line-clamp-2 text-sm text-black/60">{item.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAdd(item)}
                      className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                      style={{ backgroundColor: BRAND }}
                    >
                      Add
                    </button>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-sm font-medium" style={{ color: BRAND }}>
                    LKR {displayPrice}
                    {deal && (
                      <span className="text-xs text-black/50 line-through">LKR {item.priceLkr}</span>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Sticky cart bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-black">{items.length} item{items.length !== 1 ? "s" : ""} · LKR {subtotal}</p>
              <p className="text-xs text-black/60">{shop.name}</p>
            </div>
            <Link
              to="/student/cart"
              className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition hover:opacity-95"
              style={{ backgroundColor: BRAND }}
            >
              <ShoppingCart className="h-5 w-5" /> View cart
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
