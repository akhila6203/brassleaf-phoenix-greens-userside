import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import Breadcrumb from "../components/Breadcrumb";
import { useCart } from "../context/CartContext";
import {
  fetchCustomerOrder,
  fetchPaytmConfig,
} from "../services/orderService";
import { payOrderWithPaytm } from "../services/paymentService";
import { clearCheckoutDraft } from "../utils/checkoutDraft";

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

function PaytmLogo() {
  return (
    <span className="inline-flex items-center font-black">
      <span className="text-[#162d70]">pay</span>
      <span className="text-[#00baf2]">tm</span>
      <span className="ml-1 rounded bg-[#00baf2] px-1.5 py-0.5 text-[10px] text-white">
        PG
      </span>
    </span>
  );
}

function FullPaySummary({
  order,
  orderId,
  paytmDescription,
  paying,
  onPay,
  onCancel,
}) {
  const cgst = Number(order?.cgst || 0);
  const sgst = Number(order?.sgst || 0);

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-[#f4f4f4] text-[#243346]">
            <th className="px-5 py-4 font-bold">Product</th>
            <th className="px-5 py-4 font-bold">Qty</th>
            <th className="px-5 py-4 text-right font-bold">Totals</th>
          </tr>
        </thead>
        <tbody>
          {(order?.items || []).map((item) => (
            <tr
              key={item.id || `${item.name}-${item.size}`}
              className="border-b border-slate-100"
            >
              <td className="px-5 py-4">
                <p className="font-semibold text-[#243346]">{item.name}</p>
                {item.size && (
                  <p className="mt-1 text-xs text-slate-500">size: {item.size}</p>
                )}
              </td>
              <td className="px-5 py-4 text-[#243346]">× {item.quantity}</td>
              <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[#243346]">
                {formatMoney(item.total ?? item.price * item.quantity)}
              </td>
            </tr>
          ))}

          <tr className="border-b border-slate-100">
            <td colSpan={2} className="px-5 py-4 font-semibold text-[#243346]">
              Subtotal:
            </td>
            <td className="px-5 py-4 text-right font-semibold text-[#243346]">
              {formatMoney(order?.subtotal)}
            </td>
          </tr>

          <tr className="border-b border-slate-100">
            <td colSpan={2} className="px-5 py-4 font-semibold text-[#243346]">
              Shipping:
            </td>
            <td className="px-5 py-4 text-right font-semibold text-[#243346]">
              {formatMoney(order?.shipping)} via Flat rate
            </td>
          </tr>

          <tr className="border-b border-slate-100">
            <td colSpan={2} className="px-5 py-4 font-semibold text-[#243346]">
              Payment method:
            </td>
            <td className="px-5 py-4 text-right font-semibold text-[#243346]">
              Paytm Payment Gateway
            </td>
          </tr>

          <tr>
            <td colSpan={2} className="px-5 py-4 font-black text-[#243346]">
              Total:
            </td>
            <td className="px-5 py-4 text-right font-black text-[#243346]">
              {formatMoney(order?.total)}
              {(cgst > 0 || sgst > 0) && (
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  (includes {formatMoney(cgst)} 2.5% CGST, {formatMoney(sgst)}{" "}
                  2.5% SGST)
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="border-t border-slate-200 p-6">
        <label className="flex cursor-pointer items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <input type="radio" checked readOnly className="mt-1 accent-[#D9A537]" />
            <div>
              <p className="text-sm font-bold text-[#243346]">Paytm Payment Gateway</p>
              <p className="mt-3 max-w-xl text-xs font-semibold leading-5 text-[#243346]">
                {paytmDescription}
              </p>
            </div>
          </div>
          <PaytmLogo />
        </label>

        <button
          type="button"
          onClick={onPay}
          disabled={paying}
          className="btn-gold mt-7 w-full rounded-sm py-4 text-sm font-bold disabled:opacity-60"
        >
          {paying ? "Opening Paytm…" : "Pay for order"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-3 w-full rounded-sm border border-[#243346] py-3 text-sm font-bold text-[#243346] hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function CompactPaySummary({ order, orderId, paying, onPay, onCancel }) {
  return (
    <>
      <div className="mt-10 grid gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-4">
        <div className="border-b border-slate-100 px-6 py-6 sm:border-b-0 sm:border-r">
          <p className="text-sm font-bold text-[#243346]">Order number:</p>
          <p className="mt-1 text-base text-[#243346]">{orderId}</p>
        </div>
        <div className="border-b border-slate-100 px-6 py-6 sm:border-b-0 sm:border-r">
          <p className="text-sm font-bold text-[#243346]">Date:</p>
          <p className="mt-1 text-base text-[#243346]">
            {formatDate(order?.date || order?.createdAt)}
          </p>
        </div>
        <div className="border-b border-slate-100 px-6 py-6 sm:border-b-0 sm:border-r">
          <p className="text-sm font-bold text-[#243346]">Total:</p>
          <p className="mt-1 text-base text-[#243346]">{formatMoney(order?.total)}</p>
        </div>
        <div className="px-6 py-6">
          <p className="text-sm font-bold text-[#243346]">Payment method:</p>
          <p className="mt-1 text-base text-[#243346]">Paytm Payment Gateway</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onPay}
          disabled={paying}
          className="btn-gold min-w-[140px] rounded-sm px-6 py-3 text-sm font-bold disabled:opacity-60"
        >
          {paying ? (
            <>
              <Loader2 className="mr-2 inline animate-spin" size={16} />
              Opening…
            </>
          ) : (
            "Pay Now"
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-w-[140px] rounded-sm border border-[#243346] px-6 py-3 text-sm font-bold text-[#243346] hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </>
  );
}

export default function PayForOrder() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const source = searchParams.get("source") || "orders";
  const isCheckoutFlow = source === "checkout";

  const [order, setOrder] = useState(null);
  const [paytmConfig, setPaytmConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  const paymentFailed = searchParams.get("payment") === "failed";

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [orderData, config] = await Promise.all([
          fetchCustomerOrder(orderId),
          fetchPaytmConfig().catch(() => null),
        ]);

        if (active) {
          setOrder(orderData);
          setPaytmConfig(config);
        }
      } catch (err) {
        if (active) {
          setError(
            err?.response?.data?.message ||
              "Unable to load this order."
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

  const startPayment = async () => {
    if (paying) return;

    setPaying(true);
    setError("");

    try {
      await payOrderWithPaytm(orderId, {
        onSuccess: async () => {
          await clearCart();
          clearCheckoutDraft();
          navigate(`/order-success?orderId=${orderId}`, { replace: true });
        },
        onFailure: () => {
          setError("Payment was not completed. Please try again.");
        },
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to start payment."
      );
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = () => {
    if (isCheckoutFlow) {
      navigate("/checkout");
      return;
    }
    navigate("/profile?tab=orders");
  };

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
          className="mt-4 inline-block text-sm font-bold text-[#D9A537]"
        >
          Back to orders
        </Link>
      </main>
    );
  }

  const status = String(order?.status || "").toLowerCase();
  const isPending = ["pending", "failed", "pending-payment"].includes(status);
  const paytmDescription =
    paytmConfig?.description ||
    "The best payment gateway provider in India for e-payment through credit card, debit card & netbanking.";

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Checkout", to: "/checkout" },
          { label: "Pay for order" },
        ]}
      />

      <main className="container-site py-10 lg:py-14">
        <h1 className="text-3xl font-black text-[#243346] lg:text-4xl">Checkout</h1>

        {paymentFailed && (
          <div className="mt-6 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Payment was not completed. Please try again.
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {!isPending ? (
          <div className="mt-10 rounded-xl border border-slate-200 bg-white p-8">
            <p className="text-sm text-slate-600">
              Order <b>#{orderId}</b> is <b>{status.replace(/-/g, " ")}</b>.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={`/profile?tab=orders&orderId=${orderId}`}
                className="btn-gold rounded-sm px-5 py-3 text-sm font-bold"
              >
                View order
              </Link>
              <Link
                to="/profile?tab=orders"
                className="rounded-sm border border-slate-200 px-5 py-3 text-sm font-bold text-[#243346]"
              >
                My orders
              </Link>
            </div>
          </div>
        ) : isCheckoutFlow ? (
          <CompactPaySummary
            order={order}
            orderId={orderId}
            paying={paying}
            onPay={startPayment}
            onCancel={handleCancel}
          />
        ) : (
          <FullPaySummary
            order={order}
            orderId={orderId}
            paytmDescription={paytmDescription}
            paying={paying}
            onPay={startPayment}
            onCancel={handleCancel}
          />
        )}
      </main>
    </>
  );
}



// import { useEffect, useState } from "react";
// import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
// import { Loader2 } from "lucide-react";

// import Breadcrumb from "../components/Breadcrumb";
// import { useCart } from "../context/CartContext";
// import {
//   fetchCustomerOrder,
//   fetchPaytmConfig,
// } from "../services/orderService";
// import { payOrderWithPaytm } from "../services/paymentService";
// import { clearCheckoutDraft } from "../utils/checkoutDraft";

// function formatMoney(value) {
//   return `₹${Number(value || 0).toLocaleString("en-IN", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;
// }

// function formatDate(value) {
//   if (!value) return "—";
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return String(value);
//   return date.toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "long",
//     year: "numeric",
//   });
// }

// function PaytmLogo() {
//   return (
//     <span className="inline-flex items-center font-black">
//       <span className="text-[#162d70]">pay</span>
//       <span className="text-[#00baf2]">tm</span>
//       <span className="ml-1 rounded bg-[#00baf2] px-1.5 py-0.5 text-[10px] text-white">
//         PG
//       </span>
//     </span>
//   );
// }

// function FullPaySummary({
//   order,
//   orderId,
//   paytmDescription,
//   paying,
//   onPay,
//   onCancel,
// }) {
//   const cgst = Number(order?.cgst || 0);
//   const sgst = Number(order?.sgst || 0);

//   return (
//     <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
//       <table className="min-w-full border-collapse text-left text-sm">
//         <thead>
//           <tr className="bg-[#f4f4f4] text-[#243346]">
//             <th className="px-5 py-4 font-bold">Product</th>
//             <th className="px-5 py-4 font-bold">Qty</th>
//             <th className="px-5 py-4 text-right font-bold">Totals</th>
//           </tr>
//         </thead>
//         <tbody>
//           {(order?.items || []).map((item) => (
//             <tr
//               key={item.id || `${item.name}-${item.size}`}
//               className="border-b border-slate-100"
//             >
//               <td className="px-5 py-4">
//                 <p className="font-semibold text-[#243346]">{item.name}</p>
//                 {item.size && (
//                   <p className="mt-1 text-xs text-slate-500">size: {item.size}</p>
//                 )}
//               </td>
//               <td className="px-5 py-4 text-[#243346]">× {item.quantity}</td>
//               <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-[#243346]">
//                 {formatMoney(item.total ?? item.price * item.quantity)}
//               </td>
//             </tr>
//           ))}

//           <tr className="border-b border-slate-100">
//             <td colSpan={2} className="px-5 py-4 font-semibold text-[#243346]">
//               Subtotal:
//             </td>
//             <td className="px-5 py-4 text-right font-semibold text-[#243346]">
//               {formatMoney(order?.subtotal)}
//             </td>
//           </tr>

//           <tr className="border-b border-slate-100">
//             <td colSpan={2} className="px-5 py-4 font-semibold text-[#243346]">
//               Shipping:
//             </td>
//             <td className="px-5 py-4 text-right font-semibold text-[#243346]">
//               {formatMoney(order?.shipping)} via Flat rate
//             </td>
//           </tr>

//           <tr className="border-b border-slate-100">
//             <td colSpan={2} className="px-5 py-4 font-semibold text-[#243346]">
//               Payment method:
//             </td>
//             <td className="px-5 py-4 text-right font-semibold text-[#243346]">
//               Paytm Payment Gateway
//             </td>
//           </tr>

//           <tr>
//             <td colSpan={2} className="px-5 py-4 font-black text-[#243346]">
//               Total:
//             </td>
//             <td className="px-5 py-4 text-right font-black text-[#243346]">
//               {formatMoney(order?.total)}
//               {(cgst > 0 || sgst > 0) && (
//                 <span className="mt-1 block text-xs font-normal text-slate-500">
//                   (includes {formatMoney(cgst)} 2.5% CGST, {formatMoney(sgst)}{" "}
//                   2.5% SGST)
//                 </span>
//               )}
//             </td>
//           </tr>
//         </tbody>
//       </table>

//       <div className="border-t border-slate-200 p-6">
//         <label className="flex cursor-pointer items-start justify-between gap-4">
//           <div className="flex items-start gap-4">
//             <input type="radio" checked readOnly className="mt-1 accent-[#D9A537]" />
//             <div>
//               <p className="text-sm font-bold text-[#243346]">Paytm Payment Gateway</p>
//               <p className="mt-3 max-w-xl text-xs font-semibold leading-5 text-[#243346]">
//                 {paytmDescription}
//               </p>
//             </div>
//           </div>
//           <PaytmLogo />
//         </label>

//         <button
//           type="button"
//           onClick={onPay}
//           disabled={paying}
//           className="btn-gold mt-7 w-full rounded-sm py-4 text-sm font-bold disabled:opacity-60"
//         >
//           {paying ? "Opening Paytm…" : "Pay for order"}
//         </button>

//         {onCancel && (
//           <button
//             type="button"
//             onClick={onCancel}
//             className="mt-3 w-full rounded-sm border border-[#243346] py-3 text-sm font-bold text-[#243346] hover:bg-slate-50"
//           >
//             Cancel
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }

// function CompactPaySummary({ order, orderId, paying, onPay, onCancel }) {
//   return (
//     <>
//       <div className="mt-10 grid gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-4">
//         <div className="border-b border-slate-100 px-6 py-6 sm:border-b-0 sm:border-r">
//           <p className="text-sm font-bold text-[#243346]">Order number:</p>
//           <p className="mt-1 text-base text-[#243346]">{orderId}</p>
//         </div>
//         <div className="border-b border-slate-100 px-6 py-6 sm:border-b-0 sm:border-r">
//           <p className="text-sm font-bold text-[#243346]">Date:</p>
//           <p className="mt-1 text-base text-[#243346]">
//             {formatDate(order?.date || order?.createdAt)}
//           </p>
//         </div>
//         <div className="border-b border-slate-100 px-6 py-6 sm:border-b-0 sm:border-r">
//           <p className="text-sm font-bold text-[#243346]">Total:</p>
//           <p className="mt-1 text-base text-[#243346]">{formatMoney(order?.total)}</p>
//         </div>
//         <div className="px-6 py-6">
//           <p className="text-sm font-bold text-[#243346]">Payment method:</p>
//           <p className="mt-1 text-base text-[#243346]">Paytm Payment Gateway</p>
//         </div>
//       </div>

//       <div className="mt-8 flex flex-wrap gap-3">
//         <button
//           type="button"
//           onClick={onPay}
//           disabled={paying}
//           className="btn-gold min-w-[140px] rounded-sm px-6 py-3 text-sm font-bold disabled:opacity-60"
//         >
//           {paying ? (
//             <>
//               <Loader2 className="mr-2 inline animate-spin" size={16} />
//               Opening…
//             </>
//           ) : (
//             "Pay Now"
//           )}
//         </button>
//         <button
//           type="button"
//           onClick={onCancel}
//           className="min-w-[140px] rounded-sm border border-[#243346] px-6 py-3 text-sm font-bold text-[#243346] hover:bg-slate-50"
//         >
//           Cancel
//         </button>
//       </div>
//     </>
//   );
// }

// export default function PayForOrder() {
//   const { orderId } = useParams();
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const { clearCart } = useCart();

//   const source = searchParams.get("source") || "orders";
//   const isCheckoutFlow = source === "checkout";

//   const [order, setOrder] = useState(null);
//   const [paytmConfig, setPaytmConfig] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [paying, setPaying] = useState(false);

//   const paymentFailed = searchParams.get("payment") === "failed";

//   useEffect(() => {
//     let active = true;

//     async function load() {
//       setLoading(true);
//       setError("");

//       try {
//         const [orderData, config] = await Promise.all([
//           fetchCustomerOrder(orderId),
//           fetchPaytmConfig().catch(() => null),
//         ]);

//         if (active) {
//           setOrder(orderData);
//           setPaytmConfig(config);
//         }
//       } catch (err) {
//         if (active) {
//           setError(
//             err?.response?.data?.message ||
//               "Unable to load this order."
//           );
//         }
//       } finally {
//         if (active) setLoading(false);
//       }
//     }

//     load();
//     return () => {
//       active = false;
//     };
//   }, [orderId]);

//   const startPayment = async () => {
//     if (paying) return;

//     setPaying(true);
//     setError("");

//     try {
//       await payOrderWithPaytm(orderId, {
//         onSuccess: async () => {
//           await clearCart();
//           clearCheckoutDraft();
//           navigate(`/order-success?orderId=${orderId}`, { replace: true });
//         },
//         onFailure: () => {
//           setError("Payment was not completed. Please try again.");
//         },
//       });
//     } catch (err) {
//       setError(
//         err?.response?.data?.message ||
//           err?.message ||
//           "Unable to start payment."
//       );
//     } finally {
//       setPaying(false);
//     }
//   };

//   const handleCancel = () => {
//     if (isCheckoutFlow) {
//       navigate("/checkout");
//       return;
//     }
//     navigate("/profile?tab=orders");
//   };

//   if (loading) {
//     return (
//       <main className="container-site py-24 text-center text-[#243346]">
//         <Loader2 className="mx-auto animate-spin" size={32} />
//         <p className="mt-4 text-sm font-semibold">Loading order…</p>
//       </main>
//     );
//   }

//   if (error && !order) {
//     return (
//       <main className="container-site py-24 text-center">
//         <p className="text-sm font-semibold text-red-600">{error}</p>
//         <Link
//           to="/profile?tab=orders"
//           className="mt-4 inline-block text-sm font-bold text-[#D9A537]"
//         >
//           Back to orders
//         </Link>
//       </main>
//     );
//   }

//   const status = String(order?.status || "").toLowerCase();
//   const isPending = ["pending", "failed", "pending-payment"].includes(status);
//   const paytmDescription =
//     paytmConfig?.description ||
//     "The best payment gateway provider in India for e-payment through credit card, debit card & netbanking.";

//   return (
//     <>
//       <Breadcrumb
//         items={[
//           { label: "Checkout", to: "/checkout" },
//           { label: "Pay for order" },
//         ]}
//       />

//       <main className="container-site py-10 lg:py-14">
//         <h1 className="text-3xl font-black text-[#243346] lg:text-4xl">Checkout</h1>

//         {paymentFailed && (
//           <div className="mt-6 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
//             Payment was not completed. Please try again.
//           </div>
//         )}

//         {error && (
//           <div className="mt-6 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
//             {error}
//           </div>
//         )}

//         {!isPending ? (
//           <div className="mt-10 rounded-xl border border-slate-200 bg-white p-8">
//             <p className="text-sm text-slate-600">
//               Order <b>#{orderId}</b> is <b>{status.replace(/-/g, " ")}</b>.
//             </p>
//             <div className="mt-6 flex flex-wrap gap-3">
//               <Link
//                 to={`/profile?tab=orders&orderId=${orderId}`}
//                 className="btn-gold rounded-sm px-5 py-3 text-sm font-bold"
//               >
//                 View order
//               </Link>
//               <Link
//                 to="/profile?tab=orders"
//                 className="rounded-sm border border-slate-200 px-5 py-3 text-sm font-bold text-[#243346]"
//               >
//                 My orders
//               </Link>
//             </div>
//           </div>
//         ) : isCheckoutFlow ? (
//           <CompactPaySummary
//             order={order}
//             orderId={orderId}
//             paying={paying}
//             onPay={startPayment}
//             onCancel={handleCancel}
//           />
//         ) : (
//           <FullPaySummary
//             order={order}
//             orderId={orderId}
//             paytmDescription={paytmDescription}
//             paying={paying}
//             onPay={startPayment}
//             onCancel={handleCancel}
//           />
//         )}
//       </main>
//     </>
//   );
// }
