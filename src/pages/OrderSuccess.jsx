import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  PackageCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import {
  Link,
  useLocation,
  useSearchParams,
} from "react-router-dom";

import {
  fetchCustomerOrder,
} from "../services/orderService";
import axiosClient from "../api/axiosClient";
import {
  useCart,
} from "../context/CartContext";

import {
  getProductById,
} from "../services/productService";

const resolveImageUrl = (image) => {
  if (!image) {
    return "";
  }

  const value = String(image).trim();

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const apiBase =
    String(
      axiosClient.defaults.baseURL || ""
    )
      .replace(/\/api\/?$/, "")
      .replace(/\/$/, "");

  return `${apiBase}/${value.replace(/^\/+/, "")}`;
};

export default function OrderSuccess() {
  const { clearCart } = useCart();
  const { state } = useLocation();

  const [searchParams] =
    useSearchParams();

  const orderId =
    searchParams.get("orderId");

  const storedOrder = (() => {
    try {
      return JSON.parse(
        sessionStorage.getItem(
          "uniforms_last_order"
        ) || "null"
      );
    } catch (error) {
      console.error(
        "Unable to read stored order:",
        error
      );

      return null;
    }
  })();

  const [order, setOrder] =
    useState(
      state ||
        storedOrder ||
        null
    );

  const [loading, setLoading] =
    useState(Boolean(orderId));

  const [loadError, setLoadError] =
    useState("");

    const [productImages, setProductImages] =
  useState({});

  useEffect(() => {
    let active = true;

    async function loadOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError("");

        const response =
          await fetchCustomerOrder(
            orderId
          );

       
        // const data =
        //   response?.data ??
        //   response;

        // if (!active) {
        //   return;
        // }

        // if (!data) {
        //   throw new Error(
        //     "Order information not found."
        //   );
        // }

        // setOrder(data);
        const data =
  response?.data ??
  response;

if (!active) {
  return;
}

if (!data) {
  throw new Error(
    "Order information not found."
  );
}


const status =
  String(
    data?.status ||
    data?.order_status ||
    ""
  )
    .replace(/^wc-/, "")
    .toLowerCase();

if (
  status === "processing" ||
  status === "completed"
) {
  await clearCart();
}

if (!active) {
  return;
}

setOrder(data);

        
        sessionStorage.setItem(
          "uniforms_last_order",
          JSON.stringify(data)
        );
      } catch (error) {
        console.error(
          "Unable to load successful order:",
          error
        );

        if (!active) {
          return;
        }

        setLoadError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load order information."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      active = false;
    };
  }, [orderId]);

  const orderItems =
    Array.isArray(order?.items)
      ? order.items
      : [];

      useEffect(() => {
  let active = true;

  async function loadProductImages() {
    if (!orderItems.length) {
      return;
    }

    const imageMap = {};

    await Promise.all(
      orderItems.map(async (item) => {
        // const productId =
        //   item?.product_id ||
        //   item?.productId;
        const productId =
  item?.product_id ||
  item?.productId ||
  item?.product?.id;

        if (!productId) {
          return;
        }

        try {
          const product =
            await getProductById(
              productId
            );

          const image =
            product?.images?.[0]?.url ||
            product?.images?.[0]?.guid ||
            product?.image ||
            "";
          // const { data } =
          //   await axiosClient.get(
          //     `/products/${productId}`
          //   );

          // const product =
          //   data?.data ||
          //   data?.product ||
          //   data;

          // const image =
          //   product?.image_url ||
          //   product?.thumbnail ||
          //   product?.images?.[0]?.image ||
          //   product?.images?.[0]?.url ||
          //   "";

          // if (image) {
          //   imageMap[productId] =
          //     image;
          // }
          if (image) {
            imageMap[productId] =
              resolveImageUrl(image);
          }
        } catch (error) {
          console.error(
            "Unable to load order product image:",
            productId,
            error
          );
        }
      })
    );

    if (active) {
      setProductImages(
        imageMap
      );
    }
  }

  loadProductImages();

  return () => {
    active = false;
  };
}, [order]);

  const totalQuantity =
    orderItems.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.quantity || 0
        ),
      0
    );


  const displayOrderId =
    order?.id ||
    order?.order_id ||
    orderId ||
    "BL-ORDER";

  const displayTotal =
    order?.total ??
    order?.order_total ??
    order?.total_amount ??
    0;

  const displayCustomer =
    order?.customer ||
    [
      order?.billing?.first_name,
      order?.billing?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    [
      order?.billing_first_name,
      order?.billing_last_name,
    ]
      .filter(Boolean)
      .join(" ");

  if (
    loading &&
    !order
  ) {
    return (
      <main className="min-h-[60vh] bg-[#f7f8fa] px-4 py-20">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#D9A537]/10">
            <ShoppingBag
              size={28}
              className="text-[#D9A537]"
            />
          </div>

          <p className="mt-5 text-base font-black text-[#243346]">
            Confirming your payment and loading your order...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Please wait while we prepare your order details.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#f7f8fa]">
      {/* =====================================================
          BREADCRUMB
          ===================================================== */}

      {/* =====================================================
          SUCCESS SECTION
          ===================================================== */}
      <section className="px-4 py-10 sm:py-12 lg:py-16">
        <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-sm">

          {/* =================================================
              SUCCESS TOP
              ================================================= */}
          <div className="px-5 pb-7 pt-8 text-center sm:px-10 sm:pb-9 sm:pt-10">

            {/* Success Icon */}
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-50 sm:h-24 sm:w-24">
              <CheckCircle2
                size={52}
                className="text-green-600"
              />
            </div>

            <p className="mt-6 text-xs font-extrabold uppercase tracking-[.2em] text-[#D9A537] sm:text-sm">
              Thank You
            </p>

            <h1 className="mt-2 text-3xl font-black text-[#243346] sm:text-4xl">
              Order Placed Successfully
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
              Your school uniform order has been received. We will
              process your order and update you with delivery details.
            </p>

            {loadError && (
              <div className="mx-auto mt-5 max-w-xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-amber-700">
                  Your payment was completed, but we could not refresh
                  all order details right now.
                </p>
              </div>
            )}
          </div>

          {/* =================================================
              ORDER BASIC INFORMATION
              ================================================= */}
          <div className="border-y border-slate-100 bg-[#f7f8fa] px-5 py-5 sm:px-8">
            <div className="grid gap-4 sm:grid-cols-3">

              {/* Order ID */}
              <div>
                <span className="text-xs font-semibold text-slate-500">
                  Order ID
                </span>

                <p className="mt-1 break-all text-sm font-black text-[#243346] sm:text-base">
                  {displayOrderId}
                </p>
              </div>

              {/* Items */}
              <div>
                <span className="text-xs font-semibold text-slate-500">
                  Total Items
                </span>

                <p className="mt-1 text-sm font-black text-[#243346] sm:text-base">
                  {totalQuantity}
                </p>
              </div>

              {/* Order Total */}
              <div>
                <span className="text-xs font-semibold text-slate-500">
                  Order Total
                </span>

                <p className="mt-1 text-lg font-black text-[#D9A537]">
                  ₹{displayTotal}
                </p>
              </div>

            </div>
          </div>

          {/* =================================================
              ORDERED PRODUCTS
              ================================================= */}
          <div className="px-5 py-7 sm:px-8">

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D9A537]/15">
                <ShoppingBag
                  size={19}
                  className="text-[#D9A537]"
                />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#243346] sm:text-xl">
                  Your Order
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Products included in this order
                </p>
              </div>
            </div>

            {/* Product List */}
            {orderItems.length > 0 ? (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">

                {orderItems.map(
                  (item, index) => {
                    const itemId =
                      item?.id ||
                      item?.product_id ||
                      index;

                    const itemName =
                      item?.name ||
                      item?.product_name ||
                      "Product";

                    // const itemImage =
                    //   item?.image ||
                    //   item?.image_url ||
                    //   "";
                    // const productId =
                    //   item?.product_id ||
                    //   item?.productId;
                    const productId =
                      item?.product_id ||
                      item?.productId ||
                      item?.product?.id;

                    const rawItemImage =
                      item?.image ||
                      item?.image_url ||
                      productImages[productId] ||
                      "";

                    const itemImage =
                      rawItemImage
                        ? resolveImageUrl(rawItemImage)
                        : "";

                    const itemSize =
                      item?.size ||
                      item?.variation?.size ||
                      item?.variation_size ||
                      "-";

                    const itemQuantity =
                      Number(
                        item?.quantity ||
                          0
                      );

                    const itemPrice =
                      Number(
                        item?.price ??
                          item?.unit_price ??
                          item?.subtotal ??
                          0
                      );

                    const itemTotal =
                      item?.total != null
                        ? Number(
                            item.total
                          )
                        : itemPrice *
                          itemQuantity;

                    return (
                      <div
                        key={
                          item?.key ||
                          `${itemId}-${index}`
                        }
                        className="flex items-center gap-3 p-4 sm:gap-4"
                      >

                        {/* Image */}
                        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-20">
                          {itemImage ? (
                            <img
                              src={itemImage}
                              alt={itemName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center">
                              <ShoppingBag
                                size={22}
                                className="text-slate-300"
                              />
                            </div>
                          )}
                        </div>

                        {/* Product Information */}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-black text-[#243346] sm:text-base">
                            {itemName}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 sm:text-sm">
                            <span>
                              Size:{" "}
                              <b className="text-[#243346]">
                                {itemSize}
                              </b>
                            </span>

                            <span>
                              Qty:{" "}
                              <b className="text-[#243346]">
                                {itemQuantity}
                              </b>
                            </span>
                          </div>

                          <p className="mt-2 text-sm font-black text-[#D9A537]">
                            ₹{itemTotal}
                          </p>
                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            ) : (
              <div className="rounded-2xl bg-[#f7f8fa] p-5 text-center">
                <p className="text-sm text-slate-500">
                  Order product information is not available.
                </p>
              </div>
            )}
          </div>

          {/* =================================================
              CUSTOMER INFO
              ================================================= */}
          {displayCustomer && (
            <div className="mx-5 border-t border-slate-100 py-5 sm:mx-8">

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D9A537]/15">
                  <UserRound
                    size={18}
                    className="text-[#D9A537]"
                  />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Order placed for
                  </p>

                  <p className="mt-0.5 text-sm font-black text-[#243346]">
                    {displayCustomer}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* =================================================
              BOTTOM ACTIONS
              ================================================= */}
          <div className="border-t border-slate-100 px-5 py-7 sm:px-8">

            {/* <div className="flex flex-row gap-3">

              <Link
                to="/products"
                className="btn-gold flex-1 justify-center px-3 text-center text-sm sm:px-5 sm:text-base"
              >
                <PackageCheck size={18} />
                Continue Shopping
              </Link>

              <Link
                to={`/order-tracking/${displayOrderId}`}
                className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-3 py-3 text-center text-sm font-bold text-[#243346] transition hover:border-[#D9A537] hover:text-[#D9A537] sm:px-5 sm:text-base"
              >
                Order Tracking
              </Link>

            </div> */}
            <div className="flex justify-center">
              <Link
                to="/collections"
                className="btn-gold inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-center text-sm sm:text-base"
              >
                <PackageCheck size={18} />
                Continue Shopping
              </Link>

            </div>

            <p className="mx-auto mt-5 max-w-md text-center text-xs leading-5 text-slate-400">
              Keep your Order ID for future order-related enquiries.
            </p>

          </div>

        </div>
      </section>
    </main>
  );
}


// import {
//   CheckCircle2,
//   PackageCheck,
//   ShoppingBag,
//   UserRound,
// } from "lucide-react";
// import { Link, useLocation } from "react-router-dom";

// export default function OrderSuccess() {
//   const { state } = useLocation();

//   const order =
//     state ||
//     JSON.parse(
//       sessionStorage.getItem("uniforms_last_order") || "null"
//     );

//   const orderItems = order?.items || [];

//   const totalQuantity = orderItems.reduce(
//     (sum, item) => sum + Number(item.quantity || 0),
//     0
//   );

//   return (
//     <main className="bg-[#f7f8fa]">
//       {/* =====================================================
//           BREADCRUMB
//           ===================================================== */}
// {/* =====================================================
//           SUCCESS SECTION
//           ===================================================== */}
//       <section className="px-4 py-10 sm:py-12 lg:py-16">
//         <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-sm">

//           {/* =================================================
//               SUCCESS TOP
//               ================================================= */}
//           <div className="px-5 pb-7 pt-8 text-center sm:px-10 sm:pb-9 sm:pt-10">

//             {/* Success Icon */}
//             <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-50 sm:h-24 sm:w-24">
//               <CheckCircle2
//                 size={52}
//                 className="text-green-600"
//               />
//             </div>

//             <p className="mt-6 text-xs font-extrabold uppercase tracking-[.2em] text-[#D9A537] sm:text-sm">
//               Thank You
//             </p>

//             <h1 className="mt-2 text-3xl font-black text-[#243346] sm:text-4xl">
//               Order Placed Successfully
//             </h1>

//             <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
//               Your school uniform order has been received. We will
//               process your order and update you with delivery details.
//             </p>
//           </div>

//           {/* =================================================
//               ORDER BASIC INFORMATION
//               ================================================= */}
//           <div className="border-y border-slate-100 bg-[#f7f8fa] px-5 py-5 sm:px-8">
//             <div className="grid gap-4 sm:grid-cols-3">

//               {/* Order ID */}
//               <div>
//                 <span className="text-xs font-semibold text-slate-500">
//                   Order ID
//                 </span>

//                 <p className="mt-1 break-all text-sm font-black text-[#243346] sm:text-base">
//                   {order?.id || "BL-ORDER"}
//                 </p>
//               </div>

//               {/* Items */}
//               <div>
//                 <span className="text-xs font-semibold text-slate-500">
//                   Total Items
//                 </span>

//                 <p className="mt-1 text-sm font-black text-[#243346] sm:text-base">
//                   {totalQuantity}
//                 </p>
//               </div>

//               {/* Order Total */}
//               <div>
//                 <span className="text-xs font-semibold text-slate-500">
//                   Order Total
//                 </span>

//                 <p className="mt-1 text-lg font-black text-[#D9A537]">
//                   ₹{order?.total || 0}
//                 </p>
//               </div>

//             </div>
//           </div>

//           {/* =================================================
//               ORDERED PRODUCTS
//               ================================================= */}
//           <div className="px-5 py-7 sm:px-8">

//             <div className="mb-5 flex items-center gap-3">
//               <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D9A537]/15">
//                 <ShoppingBag
//                   size={19}
//                   className="text-[#D9A537]"
//                 />
//               </div>

//               <div>
//                 <h2 className="text-lg font-black text-[#243346] sm:text-xl">
//                   Your Order
//                 </h2>

//                 <p className="mt-0.5 text-xs text-slate-500">
//                   Products included in this order
//                 </p>
//               </div>
//             </div>

//             {/* Product List */}
//             {orderItems.length > 0 ? (
//               <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">

//                 {orderItems.map((item, index) => (
//                   <div
//                     key={item.key || `${item.id}-${index}`}
//                     className="flex items-center gap-3 p-4 sm:gap-4"
//                   >

//                     {/* Image */}
//                     <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-20">
//                       <img
//                         src={item.image}
//                         alt={item.name}
//                         className="h-full w-full object-cover"
//                       />
//                     </div>

//                     {/* Product Information */}
//                     <div className="min-w-0 flex-1">
//                       <p className="line-clamp-2 text-sm font-black text-[#243346] sm:text-base">
//                         {item.name}
//                       </p>

//                       <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 sm:text-sm">
//                         <span>
//                           Size:{" "}
//                           <b className="text-[#243346]">
//                             {item.size}
//                           </b>
//                         </span>

//                         <span>
//                           Qty:{" "}
//                           <b className="text-[#243346]">
//                             {item.quantity}
//                           </b>
//                         </span>
//                       </div>

//                       <p className="mt-2 text-sm font-black text-[#D9A537]">
//                         ₹{item.price * item.quantity}
//                       </p>
//                     </div>

//                   </div>
//                 ))}

//               </div>
//             ) : (
//               <div className="rounded-2xl bg-[#f7f8fa] p-5 text-center">
//                 <p className="text-sm text-slate-500">
//                   Order product information is not available.
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* =================================================
//               CUSTOMER INFO
//               ================================================= */}
//           {order?.customer && (
//             <div className="mx-5 border-t border-slate-100 py-5 sm:mx-8">

//               <div className="flex items-center gap-3">
//                 <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D9A537]/15">
//                   <UserRound
//                     size={18}
//                     className="text-[#D9A537]"
//                   />
//                 </div>

//                 <div>
//                   <p className="text-xs text-slate-500">
//                     Order placed for
//                   </p>

//                   <p className="mt-0.5 text-sm font-black text-[#243346]">
//                     {order.customer}
//                   </p>
//                 </div>
//               </div>

//             </div>
//           )}

//           {/* =================================================
//               BOTTOM ACTIONS
//               ================================================= */}
//           <div className="border-t border-slate-100 px-5 py-7 sm:px-8">

//             <div className="flex flex-row gap-3">

//               <Link
//                 to="/products"
//                 className="btn-gold flex-1 justify-center px-3 text-center text-sm sm:px-5 sm:text-base"
//               >
//                 <PackageCheck size={18} />
//                 Continue Shopping
//               </Link>

//               <Link
//                 to={`/order-tracking/${order?.id}`}
//                 className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-3 py-3 text-center text-sm font-bold text-[#243346] transition hover:border-[#D9A537] hover:text-[#D9A537] sm:px-5 sm:text-base"
//               >
//                 Order Tracking
//               </Link>

//             </div>

//             <p className="mx-auto mt-5 max-w-md text-center text-xs leading-5 text-slate-400">
//               Keep your Order ID for future order-related enquiries.
//             </p>

//           </div>

//         </div>
//       </section>
//     </main>
//   );
// }