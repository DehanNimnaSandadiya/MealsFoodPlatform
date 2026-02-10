import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { api } from "../../lib/api";

export function CreateShopPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.post(
        "/api/v1/shops",
        { name: name.trim(), address: address.trim(), phone: phone.trim() },
        getToken
      ),
    onSuccess: () => {
      navigate("/seller/shops", { replace: true });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !phone.trim()) return;
    create.mutate();
  };

  return (
    <div>
      <Link to="/seller/shops" className="text-sm text-amber-600 hover:underline">
        ← My shops
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-stone-900">Create shop</h1>
      <p className="mt-1 text-stone-600">
        Add your home kitchen. It will be reviewed by an admin before going live.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700">Shop name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Nanda's Kitchen"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            minLength={2}
            maxLength={80}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full address for pickup"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            minLength={5}
            maxLength={200}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Contact number"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            minLength={7}
            maxLength={30}
            required
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {create.isPending ? "Creating…" : "Create shop"}
          </button>
          <Link
            to="/seller/shops"
            className="rounded-lg border border-stone-300 px-4 py-2 font-medium text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </Link>
        </div>
        {create.isError && (
          <p className="text-sm text-red-600">{create.error.message}</p>
        )}
      </form>
    </div>
  );
}
