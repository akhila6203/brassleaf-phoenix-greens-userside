import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  cancelCustomerOrder,
  fetchCustomerOrder,
} from "../services/orderService";

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function normalizeStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/^wc-/, "");

  if (value === "pending" || value === "pending-payment") {
    return "Pending payment";
  }
  if (value === "cancelled" || value === "canceled") return "Cancelled";
  if (value === "processing") return "Processing";
  if (value === "completed") return "Completed";
  if (!value) return "—";
  return value.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function OrderDetailPanel({
  orderId,
  onBack,
  onPay,
}) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchCustomerOrder(orderId);
        if (active) setOrder(data);
      } catch (err) {
        if (active) {
          setError(
            err?.response?.data?.message ||
              "Unable to load order details."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [orderId]);

  const handleCancel = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel order #${orderId}?`
    );
    if (!confirmed) return;

    setCancelling(true);
    setError("");

    try {
      const updated = await cancelCustomerOrder(orderId);
      setOrder(updated);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to cancel this order."
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-[#243346]">
        <Loader2 className="mx-auto animate-spin" size={28} />
        <p className="mt-3 text-sm font-semibold">Loading order…</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {error}
      </div>
    );
  }

  const statusLabel = normalizeStatus(order?.status);
  const isPending = statusLabel === "Pending payment";
  const billing = order?.billingAddress || order?.billing || {};
  const billingDetails = order?.billingDetails || {};
  const cgst = Number(order?.cgst || 0);
  const sgst = Number(order?.sgst || 0);

  return (
    <div>
      <p className="text-sm text-slate-600">
        Order <b>#{orderId}</b> was placed on{" "}
        <b>{formatDate(order?.date || order?.createdAt)}</b> and is currently{" "}
        <b>{statusLabel}.</b>
      </p>

      {error && (
        <div className="mt-4 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <h2 className="mt-6 text-2xl font-black text-[#243346]">Order details</h2>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#f4f4f4] text-[#243346]">
              <th className="px-5 py-4 font-bold">Product</th>
              <th className="px-5 py-4 font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {(order?.items || []).map((item) => (
              <tr
                key={item.id || `${item.name}-${item.size}`}
                className="border-b border-slate-100 even:bg-[#f7f7f7]"
              >
                <td className="px-5 py-4">
                  <p className="font-semibold text-[#243346]">
                    {item.name} × {item.quantity}
                  </p>
                  {item.size && (
                    <p className="mt-1 text-xs text-slate-500">size: {item.size}</p>
                  )}
                </td>
                <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#243346]">
                  {formatMoney(item.total ?? item.price * item.quantity)}
                </td>
              </tr>
            ))}

            <tr className="border-b border-slate-100">
              <td className="px-5 py-4 font-semibold text-[#243346]">Subtotal:</td>
              <td className="px-5 py-4 font-semibold text-[#243346]">
                {formatMoney(order?.subtotal)}
              </td>
            </tr>

            <tr className="border-b border-slate-100 even:bg-[#f7f7f7]">
              <td className="px-5 py-4 font-semibold text-[#243346]">Shipping:</td>
              <td className="px-5 py-4 font-semibold text-[#243346]">
                {formatMoney(order?.shipping)} via Flat rate
              </td>
            </tr>

            <tr className="border-b border-slate-100">
              <td className="px-5 py-4 font-semibold text-[#243346]">
                Payment method:
              </td>
              <td className="px-5 py-4 font-semibold text-[#243346]">
                {order?.paymentMethodTitle ||
                  order?.payment_method_title ||
                  "Paytm Payment Gateway"}
              </td>
            </tr>

            <tr className="even:bg-[#f7f7f7]">
              <td className="px-5 py-4 font-black text-[#243346]">Total:</td>
              <td className="px-5 py-4 font-black text-[#243346]">
                {formatMoney(order?.total)}
                {(cgst > 0 || sgst > 0) && (
                   <span className="ml-2 text-xs font-normal text-slate-500">
                   {/* <span className="mt-1 block text-xs font-normal text-slate-500"> */}
                    {/* (includes {formatMoney(cgst)} 2.5% CGST, {formatMoney(sgst)}{" "}
                    2.5% SGST) */}
                    (includes {formatMoney(cgst)} 9% CGST, {formatMoney(sgst)}{" "}
                    9% SGST)
                  </span>
                )}
              </td>
            </tr>

            {isPending && (
              <tr className="border-t border-slate-200">
                <td className="px-5 py-4 font-semibold text-[#243346]">
                  Actions:
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onPay?.(order)}
                      className="btn-gold rounded-sm px-4 py-2 text-xs font-bold"
                    >
                      Pay
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="btn-gold rounded-sm px-4 py-2 text-xs font-bold disabled:opacity-60"
                    >
                      {cancelling ? "Cancelling…" : "Cancel"}
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-[#f4f4f4]">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-black text-[#243346]">Billing Details</h3>
        </div>
        <div className="grid gap-0 sm:grid-cols-2">
          {[
            ["Student Class", billingDetails.studentClass || billing.studentClass],
            [
              "Student Admission No.",
              billingDetails.admissionNo || billing.admissionNo,
            ],
            ["Parent name", billingDetails.parentName || billing.parentName],
            [
              "Note",
              billingDetails.note ||
                "Any exchanges should be done at the BrassLeaf, Punjagutta store only.",
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="border-b border-slate-200 px-5 py-4 sm:border-r"
            >
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-semibold text-[#243346]">
                {value || "—"}
              </p>
            </div>
          ))}
        </div>
      </div> */}

      <div className="mt-8">
        <h3 className="text-lg font-black text-[#243346]">Billing address</h3>
        <div className="mt-4 text-sm leading-7 text-slate-600">
          <p className="font-semibold text-[#243346]">
            {[billing.firstName, billing.lastName].filter(Boolean).join(" ")}
          </p>
          {billing.address1 && <p>{billing.address1}</p>}
          {billing.address2 && <p>{billing.address2}</p>}
          <p>
            {[billing.city, billing.postcode, billing.state]
              .filter(Boolean)
              .join(" ")}
          </p>
          {billing.phone && <p>{billing.phone}</p>}
          {billing.email && <p>{billing.email}</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-8 text-sm font-bold text-[#D9A537] hover:underline"
      >
        ← Back to orders
      </button>
    </div>
  );
}
