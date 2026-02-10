import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { api } from "../../lib/api";
import { Zap, Plus } from "lucide-react";

export function SellerFlashDealsPage() {
  const { shopId } = useParams();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    menuItemIds: [],
    discountType: "PERCENT",
    discountValue: "10",
    startAt: "",
    endAt: "",
  });

  const { data: dealsData } = useQuery({
    queryKey: ["seller-flash-deals", shopId],
    queryFn: () => api.get(`/api/v1/flash-deals?shopId=${shopId}`, getToken),
    enabled: !!shopId,
  });

  const { data: menuData } = useQuery({
    queryKey: ["seller-menu", shopId],
    queryFn: () => api.get(`/api/v1/shops/${shopId}/menu/all`, getToken),
    enabled: !!shopId,
  });

  const createDeal = useMutation({
    mutationFn: (body) => api.post("/api/v1/flash-deals", body, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-flash-deals", shopId] });
      setShowForm(false);
      setForm({ title: "", menuItemIds: [], discountType: "PERCENT", discountValue: "10", startAt: "", endAt: "" });
    },
  });

  const toggleDeal = useMutation({
    mutationFn: ({ dealId, isActive }) =>
      api.patch(`/api/v1/flash-deals/${dealId}`, { isActive }, getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seller-flash-deals", shopId] }),
  });

  const deals = dealsData?.data ?? [];
  const menuItems = menuData?.data ?? [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || form.menuItemIds.length === 0) return;
    const start = form.startAt ? new Date(form.startAt).toISOString() : new Date().toISOString();
    const end = form.endAt ? new Date(form.endAt).toISOString() : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    createDeal.mutate({
      shopId,
      title: form.title.trim(),
      menuItemIds: form.menuItemIds,
      discountType: form.discountType,
      discountValue: Number(form.discountValue) || 10,
      startAt: start,
      endAt: end,
    });
  };

  const toggleItem = (id) => {
    setForm((f) => ({
      ...f,
      menuItemIds: f.menuItemIds.includes(id)
        ? f.menuItemIds.filter((x) => x !== id)
        : [...f.menuItemIds, id],
    }));
  };

  return (
    <div>
      <Link to="/seller" className="text-sm text-amber-600 hover:underline">
        ← Dashboard
      </Link>
      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">Flash deals</h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" /> Create deal
        </button>
      </div>
      <p className="text-stone-600">Shop ID: {shopId}</p>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4">
          <h2 className="font-medium text-stone-900">New flash deal</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Deal title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="rounded-lg border border-stone-300 px-3 py-2"
              required
            />
            <select
              value={form.discountType}
              onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
              className="rounded-lg border border-stone-300 px-3 py-2"
            >
              <option value="PERCENT">Percent off</option>
              <option value="FLAT_LKR">Flat LKR off</option>
            </select>
            <input
              type="number"
              placeholder={form.discountType === "PERCENT" ? "Percent (e.g. 10)" : "LKR off"}
              value={form.discountValue}
              onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
              className="rounded-lg border border-stone-300 px-3 py-2"
              min={1}
              required
            />
            <input
              type="datetime-local"
              placeholder="Start"
              value={form.startAt}
              onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
              className="rounded-lg border border-stone-300 px-3 py-2"
            />
            <input
              type="datetime-local"
              placeholder="End"
              value={form.endAt}
              onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
              className="rounded-lg border border-stone-300 px-3 py-2"
            />
          </div>
          <div className="mt-3">
            <p className="text-sm font-medium text-stone-700">Menu items in this deal</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {menuItems.map((i) => (
                <label key={i.id} className="flex items-center gap-2 rounded border border-stone-200 bg-white px-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={form.menuItemIds.includes(i.id)}
                    onChange={() => toggleItem(i.id)}
                  />
                  {i.name} (LKR {i.priceLkr})
                </label>
              ))}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={createDeal.isPending || form.menuItemIds.length === 0}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {createDeal.isPending ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
          </div>
          {createDeal.isError && (
            <p className="mt-2 text-sm text-red-600">{createDeal.error.message}</p>
          )}
        </form>
      )}

      {deals.length === 0 && !showForm ? (
        <p className="mt-4 text-stone-500">No flash deals yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {deals.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-stone-900">{d.title}</p>
                  <p className="text-sm text-stone-500">
                    {d.discountType === "PERCENT" ? `${d.discountValue}% off` : `LKR ${d.discountValue} off`} · {d.menuItemIds?.length ?? 0} items
                  </p>
                  <p className="text-xs text-stone-400">
                    {d.startAt ? new Date(d.startAt).toLocaleString() : ""} – {d.endAt ? new Date(d.endAt).toLocaleString() : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleDeal.mutate({ dealId: d.id, isActive: !d.isActive })}
                disabled={toggleDeal.isPending}
                className={`rounded px-3 py-1 text-sm ${d.isActive ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-600"}`}
              >
                {d.isActive ? "Active" : "Inactive"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
