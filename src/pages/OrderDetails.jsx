import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CreditCard, Loader2, XCircle } from "lucide-react";

import Breadcrumb from "../components/Breadcrumb";
import {
  cancelCustomerOrder,
  fetchCustomerOrder,
} from "../services/orderService";

function formatMoney(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
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
  if (value === "cancelled" || value === "canceled") {
    return "Cancelled";
  }
  if (value === "processing") return "Processing";
  if (value === "completed") return "Completed";
  if (!value) return "—";
  return value.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

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

  const statusLabel = normalizeStatus(order?.status);
  const isPending = statusLabel === "Pending payment";

  const handlePay = () => {
    navigate(`/pay-for-order/${orderId}?source=orders`);
  };

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

  const billing = order?.billingAddress || order?.billing || {};
  const billingDetails = order?.billingDetails || {};
  const cgst = Number(order?.cgst || 0);
  const sgst = Number(order?.sgst || 0);

  if (loading) {
    return (
      <main className="container-site py-24 text-center text-[#243346]">
        <Loader2 className="mx-auto animate-spin" size={32} />
        <p className="mt-4 text-sm font-semibold">Loading order…</p>
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="container-site py-24 text-center">
        <p className="text-sm font-semibold text-red-600">{error}</p>
        <Link
          to="/profile?tab=orders"
          className="mt-4 inline-block text-sm font-bold text-[#ff7900]"
        >
          Back to orders
        </Link>
      </main>
    );
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: "My account", to: "/profile" },
          { label: "Orders", to: "/profile?tab=orders" },
          { label: `Order #${orderId}` },
        ]}
      />

      <main className="container-site py-10 lg:py-14">
        <h1 className="text-3xl font-black text-[#243346]">Order details</h1>

        <p className="mt-4 text-sm text-slate-600">
          Order <b>#{orderId}</b> was placed on{" "}
          <b>{formatDate(order?.date || order?.createdAt)}</b> and is
          currently <b>{statusLabel}.</b>
        </p>

        {error && (
          <div className="mt-4 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
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
                      <p className="mt-1 text-xs text-slate-500">
                        size: {item.size}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#243346]">
                    {formatMoney(item.total)}
                  </td>
                </tr>
              ))}

              <tr className="border-b border-slate-100">
                <td className="px-5 py-4 font-semibold text-[#243346]">
                  Subtotal:
                </td>
                <td className="px-5 py-4 font-semibold text-[#243346]">
                  {formatMoney(order?.subtotal)}
                </td>
              </tr>

              <tr className="border-b border-slate-100 even:bg-[#f7f7f7]">
                <td className="px-5 py-4 font-semibold text-[#243346]">
                  Shipping:
                </td>
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
                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      {/* (includes {formatMoney(cgst)} 2.5% CGST,{" "}
                      {formatMoney(sgst)} 2.5% SGST) */}
                      (includes {formatMoney(cgst)} 9% CGST,{" "}
{formatMoney(sgst)} 9% SGST)
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {isPending && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePay}
              className="inline-flex items-center gap-2 bg-[#ff7900] px-5 py-3 text-sm font-bold text-white hover:bg-[#e96f00]"
            >
              <CreditCard size={16} />
              Pay
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex items-center gap-2 bg-[#ff7900] px-5 py-3 text-sm font-bold text-white hover:bg-[#e96f00] disabled:opacity-60"
            >
              {cancelling ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <XCircle size={16} />
              )}
              Cancel
            </button>
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-[#f4f4f4]">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-black text-[#243346]">
              Billing Details
            </h2>
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
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-black text-[#243346]">Billing address</h2>

          <div className="mt-4 text-sm leading-7 text-slate-600">
            <p className="font-semibold text-[#243346]">
              {[billing.firstName, billing.lastName]
                .filter(Boolean)
                .join(" ")}
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

        <Link
          to="/profile?tab=orders"
          className="mt-10 inline-block text-sm font-bold text-[#ff7900] hover:underline"
        >
          ← Back to orders
        </Link>
      </main>
    </>
  );
}
