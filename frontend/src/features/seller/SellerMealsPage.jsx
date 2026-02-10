import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { api } from "../../lib/api";
import { MENU_CATEGORIES } from "../../lib/constants";
import { Plus, Pencil, Trash2 } from "lucide-react";

export function SellerMealsPage() {
  const { shopId } = useParams();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "RICE",
    priceLkr: "",
    isAvailable: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["seller-menu", shopId],
    queryFn: () => api.get(`/api/v1/shops/${shopId}/menu/all`, getToken),
    enabled: !!shopId,
  });

  const addMeal = useMutation({
    mutationFn: (body) =>
      api.post(`/api/v1/shops/${shopId}/menu`, body, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-menu", shopId] });
      setShowAdd(false);
      setForm({ name: "", description: "", category: "RICE", priceLkr: "", isAvailable: true });
    },
  });

  const updateMeal = useMutation({
    mutationFn: ({ itemId, body }) =>
      api.patch(`/api/v1/menu/${itemId}`, body, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-menu", shopId] });
      setEditingId(null);
    },
  });

  const deleteMeal = useMutation({
    mutationFn: (itemId) => api.delete(`/api/v1/menu/${itemId}`, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-menu", shopId] });
    },
  });

  const items = data?.data ?? [];

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const price = Number(form.priceLkr);
    if (!form.name.trim() || !price || price < 50) return;
    addMeal.mutate({
      name: form.name.trim(),
      description: (form.description || "").trim(),
      category: form.category,
      priceLkr: price,
      isAvailable: form.isAvailable,
    });
  };

  const handleEditSubmit = (e, item) => {
    e.preventDefault();
    const price = Number(form.priceLkr);
    if (!form.name.trim() || !price || price < 50) return;
    updateMeal.mutate({
      itemId: item.id,
      body: {
        name: form.name.trim(),
        description: (form.description || "").trim(),
        category: form.category,
        priceLkr: price,
        isAvailable: form.isAvailable,
      },
    });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      category: item.category,
      priceLkr: String(item.priceLkr),
      isAvailable: item.isAvailable ?? true,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", description: "", category: "RICE", priceLkr: "", isAvailable: true });
  };

  if (isLoading) return <p className="text-stone-500">Loading…</p>;

  return (
    <div>
      <Link to="/seller" className="text-sm text-amber-600 hover:underline">
        ← Dashboard
      </Link>
      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">Meals</h1>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" /> Add meal
        </button>
      </div>
      <p className="text-stone-600">Shop ID: {shopId}</p>

      {showAdd && (
        <form
          onSubmit={handleAddSubmit}
          className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4"
        >
          <h2 className="font-medium text-stone-900">New meal (Rice & Curry)</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-lg border border-stone-300 px-3 py-2"
              required
              minLength={2}
            />
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="rounded-lg border border-stone-300 px-3 py-2"
            >
              {MENU_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Price (LKR)"
              value={form.priceLkr}
              onChange={(e) => setForm((f) => ({ ...f, priceLkr: e.target.value }))}
              className="rounded-lg border border-stone-300 px-3 py-2"
              min={50}
              max={50000}
              required
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
              />
              <span className="text-sm text-stone-700">Available</span>
            </label>
          </div>
          <input
            type="text"
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2"
            maxLength={300}
          />
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={addMeal.isPending}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {addMeal.isPending ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100"
            >
              Cancel
            </button>
          </div>
          {addMeal.isError && (
            <p className="mt-2 text-sm text-red-600">{addMeal.error.message}</p>
          )}
        </form>
      )}

      {items.length === 0 && !showAdd ? (
        <p className="mt-4 text-stone-500">No menu items yet. Add your first meal.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((i) => (
            <li
              key={i.id}
              className="rounded-xl border border-stone-200 bg-white p-4"
            >
              {editingId === i.id ? (
                <form
                  onSubmit={(e) => handleEditSubmit(e, i)}
                  className="space-y-3"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="rounded border border-stone-300 px-2 py-1"
                      required
                    />
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="rounded border border-stone-300 px-2 py-1"
                    >
                      {MENU_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={form.priceLkr}
                      onChange={(e) => setForm((f) => ({ ...f, priceLkr: e.target.value }))}
                      className="rounded border border-stone-300 px-2 py-1"
                      min={50}
                      required
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.isAvailable}
                        onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
                      />
                      <span className="text-sm">Available</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full rounded border border-stone-300 px-2 py-1 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={updateMeal.isPending}
                      className="rounded bg-amber-600 px-2 py-1 text-sm text-white hover:bg-amber-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded border border-stone-300 px-2 py-1 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-stone-900">{i.name}</p>
                    <p className="text-sm text-stone-500">
                      {i.category} · LKR {i.priceLkr}
                      {!i.isAvailable && " · Unavailable"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(i)}
                      className="rounded p-1.5 text-stone-500 hover:bg-stone-100"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Remove this meal from the menu?")) {
                          deleteMeal.mutate(i.id);
                        }
                      }}
                      disabled={deleteMeal.isPending}
                      className="rounded p-1.5 text-red-600 hover:bg-red-50"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
