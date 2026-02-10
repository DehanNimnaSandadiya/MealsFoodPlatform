import { Link } from "react-router-dom";
import { useCart } from "../../lib/CartContext";
import { Minus, Plus, Trash2, ShoppingBag, ChevronRight } from "lucide-react";

const BRAND = "#006B3D";

export function CartPage() {
  const { shopId, shopName, items, updateQty, removeItem, subtotal } = useCart();

  if (!shopId || items.length === 0) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/5">
            <ShoppingBag className="h-10 w-10 text-black/30" />
          </div>
        </div>
        <h2 className="mt-6 font-display text-xl font-bold text-black">Your cart is empty</h2>
        <p className="mt-2 text-black/60">Add meals from a shop to get started.</p>
        <Link
          to="/student/shops"
          className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition hover:opacity-95"
          style={{ backgroundColor: BRAND }}
        >
          Browse shops <ChevronRight className="h-4 w-4" />
        </Link>
        <p className="mt-6">
          <Link to="/student" className="text-sm font-semibold hover:underline" style={{ color: BRAND }}>
            ← Back to dashboard
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <Link to="/student" className="text-sm font-semibold hover:underline" style={{ color: BRAND }}>
          ← Dashboard
        </Link>
        <Link
          to="/student/checkout"
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
          style={{ backgroundColor: BRAND }}
        >
          Checkout
        </Link>
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold text-black">Your cart</h1>
      <p className="mt-1 text-black/60">{shopName}</p>

      <ul className="mt-6 space-y-4">
        {items.map((i) => (
          <li
            key={i.menuItemId}
            className="flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-black">{i.name}</p>
              <p className="text-sm font-medium" style={{ color: BRAND }}>
                LKR {i.priceLkr} × {i.qty}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateQty(i.menuItemId, Math.max(0, i.qty - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-black hover:bg-black/5"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-medium">{i.qty}</span>
              <button
                type="button"
                onClick={() => updateQty(i.menuItemId, i.qty + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-black hover:bg-black/5"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => removeItem(i.menuItemId)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <p className="flex justify-between font-semibold text-black">
          Subtotal <span style={{ color: BRAND }}>LKR {subtotal}</span>
        </p>
      </div>
      <Link
        to="/student/checkout"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-semibold text-white transition hover:opacity-95"
        style={{ backgroundColor: BRAND }}
      >
        Proceed to checkout <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
