import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useCart } from "../../lib/CartContext";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { shopId, shopName, items, subtotal, clearCart } = useCart();
  const [addressMode, setAddressMode] = useState("saved"); // "saved" | "custom"
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [customAddress, setCustomAddress] = useState("");
  const [distanceKm, setDistanceKm] = useState(2);

  const { data: addressesData } = useQuery({
    queryKey: ["student-addresses"],
    queryFn: () => api.get("/api/v1/addresses", getToken),
  });
  const addresses = addressesData?.data ?? [];
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const effectiveMode = addresses.length === 0 ? "custom" : addressMode;

  const placeOrder = useMutation({
    mutationFn: async () => {
      const payload = {
        shopId,
        distanceKm: Number(distanceKm) || 1,
        items: items.map((i) => ({ menuItemId: i.menuItemId, qty: i.qty })),
      };
      if (effectiveMode === "custom" && customAddress.trim()) {
        payload.deliveryAddress = customAddress.trim();
      } else {
        const id = effectiveMode === "saved" ? (selectedAddressId ?? defaultAddress?.id) : null;
        if (id) payload.addressId = id;
        else payload.deliveryAddress = customAddress.trim();
      }
      return api.post("/api/v1/orders", payload, getToken);
    },
    onSuccess: (data) => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      navigate(`/student/orders/${data.data.id}`, { state: { otp: data.data.otp } });
    },
  });

  const BRAND = "#006B3D";

  if (!shopId || items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link to="/student/cart" className="text-sm font-semibold hover:underline" style={{ color: BRAND }}>
          ← Cart
        </Link>
        <p className="mt-8 text-black/60">Cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/student/cart" className="text-sm font-semibold hover:underline" style={{ color: BRAND }}>
        ← Cart
      </Link>
      <h1 className="mt-6 font-display text-2xl font-bold text-black">Checkout</h1>
      <p className="mt-1 text-black/60">{shopName}</p>

      <div className="mt-6 space-y-5">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <label className="block text-sm font-semibold text-black">
            Delivery address
          </label>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="addressMode"
                checked={effectiveMode === "saved"}
                onChange={() => setAddressMode("saved")}
              />
              <span className="text-sm text-black">Use saved address</span>
            </label>
            {addresses.length > 0 && effectiveMode === "saved" && (
              <select
                value={selectedAddressId ?? defaultAddress?.id ?? ""}
                onChange={(e) => setSelectedAddressId(e.target.value || null)}
                className="ml-6 w-full rounded-lg border border-black/20 px-3 py-2 text-sm text-black"
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label ? `${a.label}: ${a.address}` : a.address}
                  </option>
                ))}
              </select>
            )}
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="addressMode"
                checked={effectiveMode === "custom"}
                onChange={() => setAddressMode("custom")}
              />
              <span className="text-sm">Enter custom address</span>
            </label>
            {effectiveMode === "custom" && (
              <input
                type="text"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="Full address"
                className="ml-6 w-full rounded-lg border border-black/20 px-3 py-2 text-black"
              />
            )}
          </div>
          {addresses.length === 0 && (
            <p className="mt-1 text-xs text-black/60">
              <Link to="/student/addresses" className="font-medium hover:underline" style={{ color: BRAND }}>
                Add saved addresses
              </Link>
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <label className="block text-sm font-semibold text-black">
            Distance (km) – for delivery fee
          </label>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            className="mt-2 w-full rounded-xl border-2 border-black/10 px-4 py-2.5 text-black focus:border-[#006B3D] focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <p className="flex justify-between font-medium text-black">
          Subtotal <span style={{ color: BRAND }}>LKR {subtotal}</span>
        </p>
      </div>

      <button
        type="button"
        disabled={
          placeOrder.isPending ||
          (effectiveMode === "custom" ? !customAddress.trim() : !(selectedAddressId ?? defaultAddress?.id))
        }
        onClick={() => placeOrder.mutate()}
        className="mt-6 w-full rounded-xl py-4 font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
        style={{ backgroundColor: BRAND }}
      >
        {placeOrder.isPending ? "Placing…" : "Place order"}
      </button>
      {placeOrder.isError && (
        <p className="mt-2 text-sm text-red-600">{placeOrder.error.message}</p>
      )}
    </div>
  );
}
