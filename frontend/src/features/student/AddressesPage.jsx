import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { api } from "../../lib/api";
import { MapPin, Star, Pencil, Trash2 } from "lucide-react";

export function AddressesPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["student-addresses"],
    queryFn: () => api.get("/api/v1/addresses", getToken),
  });

  const addresses = data?.data ?? [];

  const setDefault = useMutation({
    mutationFn: (id) => api.post(`/api/v1/addresses/${id}/default`, {}, getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student-addresses"] }),
  });

  const deleteAddress = useMutation({
    mutationFn: (id) => api.delete(`/api/v1/addresses/${id}`, getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student-addresses"] }),
  });

  const updateAddress = useMutation({
    mutationFn: ({ id, label, address, isDefault }) =>
      api.patch(`/api/v1/addresses/${id}`, { label, address, isDefault }, getToken),
    onSuccess: () => {
      setEditingId(null);
      setEditLabel("");
      setEditAddress("");
      queryClient.invalidateQueries({ queryKey: ["student-addresses"] });
    },
  });

  const createAddress = useMutation({
    mutationFn: (body) => api.post("/api/v1/addresses", body, getToken),
    onSuccess: () => {
      setShowAdd(false);
      setNewLabel("");
      setNewAddress("");
      queryClient.invalidateQueries({ queryKey: ["student-addresses"] });
    },
  });

  const startEdit = (a) => {
    setEditingId(a.id);
    setEditLabel(a.label ?? "");
    setEditAddress(a.address ?? "");
  };

  if (isLoading) return <p className="text-stone-500">Loading…</p>;

  return (
    <div>
      <Link to="/student" className="text-sm text-amber-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-stone-900">Saved addresses</h1>
      <p className="mt-1 text-stone-600">Manage delivery addresses for checkout.</p>

      {!showAdd ? (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          <MapPin className="h-4 w-4" /> Add address
        </button>
      ) : (
        <div className="mt-6 max-w-md rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="font-medium text-stone-900">New address</h2>
          <input
            type="text"
            placeholder="Label (e.g. Home)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Full address (min 5 characters)"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={newAddress.trim().length < 5 || createAddress.isPending}
              onClick={() =>
                createAddress.mutate({
                  label: newLabel.trim() || undefined,
                  address: newAddress.trim(),
                  isDefault: addresses.length === 0,
                })
              }
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {createAddress.isPending ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setNewLabel("");
                setNewAddress("");
              }}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
          </div>
          {createAddress.isError && (
            <p className="mt-2 text-sm text-red-600">{createAddress.error.message}</p>
          )}
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {addresses.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-stone-200 bg-white p-4"
          >
            {editingId === a.id ? (
              <div className="min-w-0 flex-1">
                <input
                  type="text"
                  placeholder="Label"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full rounded border border-stone-300 px-2 py-1 text-sm"
                />
                <textarea
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows={2}
                  className="mt-2 w-full rounded border border-stone-300 px-2 py-1 text-sm"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={editAddress.trim().length < 5 || updateAddress.isPending}
                    onClick={() =>
                      updateAddress.mutate({
                        id: a.id,
                        label: editLabel.trim() || undefined,
                        address: editAddress.trim(),
                      })
                    }
                    className="rounded bg-amber-600 px-2 py-1 text-xs text-white"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setEditLabel("");
                      setEditAddress("");
                    }}
                    className="rounded border border-stone-300 px-2 py-1 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {a.label && (
                      <span className="font-medium text-stone-900">{a.label}</span>
                    )}
                    {a.isDefault && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                        <Star className="h-3 w-3 fill-current" /> Default
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-stone-600">{a.address}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!a.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefault.mutate(a.id)}
                      disabled={setDefault.isPending}
                      className="rounded p-1.5 text-stone-400 hover:bg-stone-100 hover:text-amber-600"
                      title="Set as default"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => startEdit(a)}
                    className="rounded p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => window.confirm("Delete this address?") && deleteAddress.mutate(a.id)}
                    disabled={deleteAddress.isPending}
                    className="rounded p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {addresses.length === 0 && !showAdd && (
        <p className="mt-6 text-stone-500">No saved addresses. Add one to use at checkout.</p>
      )}
    </div>
  );
}
