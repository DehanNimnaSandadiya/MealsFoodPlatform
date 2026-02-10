import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { api } from "../../lib/api";
import { ORDER_STATUS_LABELS } from "../../lib/constants";
import { Package, Star, AlertCircle } from "lucide-react";

export function OrderTrackingPage() {
  const { orderId } = useParams();
  const { getToken } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const otpFromState = location.state?.otp;
  const [rated, setRated] = useState(false);
  const [ratingForm, setRatingForm] = useState({ sellerRating: 5, riderRating: 5, comment: "" });
  const [showComplaint, setShowComplaint] = useState(false);
  const [complaintMessage, setComplaintMessage] = useState("");
  const [complaintTarget, setComplaintTarget] = useState("ORDER");

  const { data, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => api.get(`/api/v1/orders/${orderId}`, getToken),
    enabled: !!orderId,
  });

  const order = data?.data;

  const submitRating = useMutation({
    mutationFn: (body) => api.post("/api/v1/ratings", body, getToken),
    onSuccess: () => {
      setRated(true);
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
  });

  const handleRateSubmit = (e) => {
    e.preventDefault();
    submitRating.mutate({
      orderId,
      sellerRating: ratingForm.sellerRating,
      riderRating: order?.riderClerkUserId ? ratingForm.riderRating : undefined,
      comment: ratingForm.comment.trim() || undefined,
    });
  };

  const cancelOrder = useMutation({
    mutationFn: () => api.post(`/api/v1/orders/${orderId}/cancel`, {}, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["student-orders"] });
    },
  });

  const submitComplaint = useMutation({
    mutationFn: (body) => api.post("/api/v1/complaints", body, getToken),
    onSuccess: () => {
      setShowComplaint(false);
      setComplaintMessage("");
      setComplaintTarget("ORDER");
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
  });

  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    if (!complaintMessage.trim() || complaintMessage.trim().length < 5) return;
    submitComplaint.mutate({
      orderId,
      targetType: complaintTarget,
      message: complaintMessage.trim(),
    });
  };

  if (isLoading || (!order && !error)) {
    return (
      <div>
        <Link to="/student" className="text-sm text-amber-600 hover:underline">
          ← Dashboard
        </Link>
        <p className="mt-4 text-stone-500">Loading order…</p>
      </div>
    );
  }
  if (error || !order) {
    return (
      <div>
        <Link to="/student" className="text-sm text-amber-600 hover:underline">
          ← Dashboard
        </Link>
        <p className="mt-4 text-red-600">Order not found.</p>
      </div>
    );
  }

  const showOtp =
    otpFromState &&
    order.status !== "COMPLETED" &&
    order.status !== "DELIVERED" &&
    order.status !== "CANCELLED";

  return (
    <div>
      <Link to="/student" className="text-sm text-amber-600 hover:underline">
        ← Dashboard
      </Link>
      <div className="mt-6 flex items-center gap-3">
        <Package className="h-8 w-8 text-amber-600" />
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Order #{orderId?.slice(-6)}</h1>
          <p className="text-stone-600">
            Status: <strong>{ORDER_STATUS_LABELS[order.status] ?? order.status}</strong>
          </p>
        </div>
      </div>

      {order.status === "PLACED" && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => window.confirm("Cancel this order?") && cancelOrder.mutate()}
            disabled={cancelOrder.isPending}
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {cancelOrder.isPending ? "Cancelling…" : "Cancel order"}
          </button>
          {cancelOrder.isError && (
            <p className="mt-2 text-sm text-red-600">{cancelOrder.error.message}</p>
          )}
        </div>
      )}

      {showOtp && (
        <div className="mt-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">Delivery OTP (give to rider)</p>
          <p className="mt-2 text-2xl font-mono font-bold tracking-widest text-amber-800">
            {otpFromState}
          </p>
          <p className="mt-2 text-xs text-amber-700">Also sent to your email.</p>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="font-medium text-stone-900">Items</h2>
        <ul className="mt-2 space-y-1">
          {order.items?.map((item, idx) => (
            <li key={idx} className="text-stone-600">
              {item.nameSnapshot} × {item.qty} — LKR {item.lineTotalLkr}
            </li>
          ))}
        </ul>
        <p className="mt-4 font-medium text-stone-900">
          Total: LKR {order.totalLkr}
        </p>
        <p className="mt-1 text-sm text-stone-500">Delivery: {order.deliveryAddress}</p>
      </div>

      {order.statusHistory?.length > 0 && (
        <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="font-medium text-stone-900">Timeline</h2>
          <ul className="mt-3 space-y-2">
            {order.statusHistory.map((h, idx) => (
              <li key={idx} className="text-sm text-stone-600">
                {ORDER_STATUS_LABELS[h.status] ?? h.status} —{" "}
                {new Date(h.at).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {order.status === "COMPLETED" && !rated && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="flex items-center gap-2 font-medium text-stone-900">
            <Star className="h-5 w-5 text-amber-600" /> Rate this order
          </h2>
          {submitRating.isError && (
            <p className="mt-2 text-sm text-red-600">
              {submitRating.error?.status === 409 ? "You already rated this order." : submitRating.error?.message}
            </p>
          )}
          <form onSubmit={handleRateSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-stone-700">Seller (1–5)</label>
              <select
                value={ratingForm.sellerRating}
                onChange={(e) => setRatingForm((f) => ({ ...f, sellerRating: Number(e.target.value) }))}
                className="mt-1 rounded border border-stone-300 px-2 py-1"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} ★</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Rider (1–5)</label>
              <select
                value={ratingForm.riderRating}
                onChange={(e) => setRatingForm((f) => ({ ...f, riderRating: Number(e.target.value) }))}
                className="mt-1 rounded border border-stone-300 px-2 py-1"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} ★</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Comment (optional)</label>
              <textarea
                value={ratingForm.comment}
                onChange={(e) => setRatingForm((f) => ({ ...f, comment: e.target.value }))}
                className="mt-1 w-full rounded border border-stone-300 px-2 py-1 text-sm"
                rows={2}
                maxLength={500}
              />
            </div>
            <button
              type="submit"
              disabled={submitRating.isPending}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {submitRating.isPending ? "Submitting…" : "Submit rating"}
            </button>
          </form>
        </div>
      )}
      {order.status === "COMPLETED" && rated && (
        <p className="mt-6 text-sm text-stone-500">Thanks for your rating.</p>
      )}

      {order.status !== "CANCELLED" && (
        <div className="mt-6">
          {!showComplaint ? (
            <button
              type="button"
              onClick={() => setShowComplaint(true)}
              className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
            >
              <AlertCircle className="h-4 w-4" /> Report a problem
            </button>
          ) : (
          <form onSubmit={handleComplaintSubmit} className="rounded-xl border border-stone-200 bg-white p-4">
            <h3 className="font-medium text-stone-900">Report a problem</h3>
            <select
              value={complaintTarget}
              onChange={(e) => setComplaintTarget(e.target.value)}
              className="mt-2 rounded border border-stone-300 px-2 py-1 text-sm"
            >
              <option value="ORDER">About order</option>
              <option value="SELLER">About seller</option>
              <option value="RIDER">About rider</option>
            </select>
            <textarea
              placeholder="Describe the issue (min 5 characters)"
              value={complaintMessage}
              onChange={(e) => setComplaintMessage(e.target.value)}
              className="mt-2 w-full rounded border border-stone-300 px-2 py-1 text-sm"
              rows={3}
              minLength={5}
              required
            />
            <div className="mt-2 flex gap-2">
              <button
                type="submit"
                disabled={submitComplaint.isPending || complaintMessage.trim().length < 5}
                className="rounded bg-stone-700 px-3 py-1 text-sm text-white hover:bg-stone-800 disabled:opacity-50"
              >
                {submitComplaint.isPending ? "Submitting…" : "Submit"}
              </button>
              <button
                type="button"
                onClick={() => { setShowComplaint(false); setComplaintMessage(""); }}
                className="rounded border border-stone-300 px-3 py-1 text-sm"
              >
                Cancel
              </button>
            </div>
            {submitComplaint.isError && (
              <p className="mt-2 text-sm text-red-600">{submitComplaint.error.message}</p>
            )}
          </form>
          )}
        </div>
      )}
    </div>
  );
}
