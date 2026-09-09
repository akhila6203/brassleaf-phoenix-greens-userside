import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";

import {
  getDefaultAddress,
  saveSharedAddress,
} from "../utils/addressStorage";

const EMPTY_SHIPPING = {
  country: "India",
  state: "Telangana",
  city: "",
  pincode: "",
};

export default function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const {
    cart,
    updateQuantity,
    removeFromCart,
    subtotal,
    shipping,
    total,
  } = useCart();

  const [addressOpen, setAddressOpen] =
    useState(false);

  const [shipTo, setShipTo] =
    useState(EMPTY_SHIPPING);

  const [
    draftAddress,
    setDraftAddress,
  ] = useState(EMPTY_SHIPPING);

  /* =========================================
     LOAD SAVED ADDRESS
  ========================================= */

  useEffect(() => {
    const saved =
      getDefaultAddress();

    if (saved) {
      const shippingAddress = {
        country:
          saved.country ||
          "India",

        state:
          saved.state ||
          "Telangana",

        city:
          saved.city || "",

        pincode:
          saved.pincode || "",
      };

      setShipTo(
        shippingAddress
      );

      setDraftAddress(
        shippingAddress
      );
    }
  }, []);

  /* =========================================
     TAX
  ========================================= */

  // const cgst =
  //   (Number(subtotal) * 2.5) /
  //   105;

  // const sgst =
  //   (Number(subtotal) * 2.5) /
  //   105;

  const cgst =
  (Number(subtotal) * 9) /
  118;

const sgst =
  (Number(subtotal) * 9) /
  118;
  /* =========================================
     SAVE SHIPPING ADDRESS
  ========================================= */

  const saveAddress = async () => {
    const existing =
      getDefaultAddress() ||
      {};

    const saved =
      saveSharedAddress({
        ...existing,
        ...draftAddress,

        country:
          draftAddress.country ||
          "India",

        state:
          draftAddress.state ||
          "Telangana",
      });

    setShipTo({
      country:
        saved.country,

      state:
        saved.state,

      city:
        saved.city,

      pincode:
        saved.pincode,
    });

    if (isAuthenticated) {
      try {
        const billing =
          user?.billingAddress || {};

        await axiosClient.put("/auth/customer/me", {
          firstName:
            billing.firstName ||
            user?.firstName ||
            existing.firstName ||
            "",

          lastName:
            billing.lastName ||
            user?.lastName ||
            existing.lastName ||
            "",

          email:
            billing.email ||
            user?.email ||
            existing.email ||
            "",

          billingAddress: {
            ...billing,
            firstName:
              billing.firstName ||
              user?.firstName ||
              existing.firstName ||
              "",
            lastName:
              billing.lastName ||
              user?.lastName ||
              existing.lastName ||
              "",
            email:
              billing.email ||
              user?.email ||
              existing.email ||
              "",
            phone: billing.phone || existing.phone || "",
            address1: billing.address1 || existing.address || "",
            address2: billing.address2 || existing.address2 || "",
            city: saved.city || billing.city || "",
            state: saved.state || billing.state || "Telangana",
            postcode: saved.pincode || billing.postcode || "",
            country: "IN",
            studentClass:
              billing.studentClass ||
              existing.studentClass ||
              "Nursery",
            admissionNo:
              billing.admissionNo ||
              existing.admissionNo ||
              "",
            parentName:
              billing.parentName ||
              existing.parentName ||
              "",
          },
        });
      } catch (error) {
        console.error("Unable to sync cart address to profile:", error);
      }
    }

    setAddressOpen(false);
  };

  /* =========================================
     EMPTY CART
  ========================================= */

  if (!cart.length) {
    return (
      <main className="grid min-h-[58vh] place-items-center px-5">

        <div className="text-center">

          <ShoppingBag
            className="mx-auto text-[#D9A537]"
            size={48}
          />

          <h1 className="mt-4 text-3xl font-black text-[#243346]">
            Your Cart Is Empty
          </h1>

          <p className="mt-2 text-slate-500">
            Your cart is currently empty.
          </p>

          <Link
            to="/"
            className="btn-gold mt-6"
          >
            Return to Shop
          </Link>

        </div>

      </main>
    );
  }

  return (
    <main className="bg-white">

      {/* =========================================
          CART PAGE HEADER
      ========================================= */}

      <section className="container-site pt-8 sm:pt-12 lg:pt-14">

        <h1 className="text-3xl font-black text-[#243346] sm:text-4xl">
          Cart
        </h1>

        <div className="mt-3 flex items-center gap-1 text-sm">

          <Link
            to="/"
            className="text-slate-400 transition hover:text-[#D9A537]"
          >
            Home
          </Link>

          <ChevronRight
            size={14}
            className="text-slate-400"
          />

          <span className="font-semibold text-[#243346]">
            Cart
          </span>

        </div>

      </section>

      {/* =========================================
          CART CONTENT
      ========================================= */}

      <div className="container-site pb-12 pt-10 sm:pb-16 sm:pt-16 lg:pt-20">

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_410px]">

          {/* =====================================
              CART PRODUCTS
          ===================================== */}

          <section>

            {/* =================================
                MOBILE VIEW
                ONE PRODUCT PER ROW
            ================================= */}

            <div className="space-y-5 md:hidden">

              {cart.map((item) => (
                <div
                  key={item.key}
                  className="relative border-b border-slate-200 pb-6"
                >

                  {/* REMOVE */}

                  <button
                    type="button"
                    onClick={() =>
                      removeFromCart(
                        item.key
                      )
                    }
                    className="
                      absolute
                      right-0
                      top-0
                      grid
                      h-6
                      w-6
                      place-items-center
                      rounded-full
                      border
                      border-slate-300
                      text-slate-400
                      transition
                      hover:border-red-500
                      hover:text-red-500
                    "
                    aria-label={`Remove ${item.name}`}
                  >
                    <X size={13} />
                  </button>

                  <div className="flex gap-4 pr-8">

                    {/* PRODUCT IMAGE */}

                    <Link
                      to={`/products/${item.id}`}
                      className="shrink-0"
                    >
                      <img
                        src={
                          item.image
                        }
                        alt={
                          item.name
                        }
                        className="
                          h-32
                          w-24
                          object-contain
                          sm:h-36
                          sm:w-28
                        "
                      />
                    </Link>

                    {/* PRODUCT INFO */}

                    <div className="min-w-0 flex-1">

                      {/* NAME */}

                      <Link
                        to={`/products/${item.id}`}
                        className="
                          block
                          pr-2
                          text-sm
                          font-black
                          text-[#243346]
                          transition
                          hover:text-[#D9A537]
                          sm:text-base
                        "
                      >
                        {item.name}
                      </Link>

                      {/* SIZE */}

                      {item.size && (
                        <p className="mt-1 text-xs text-slate-500">
                          Size:{" "}
                          {item.size}
                        </p>
                      )}

                      {/* PRICE */}

                      <div className="mt-4 flex items-center justify-between gap-3">

                        <span className="text-xs font-semibold text-slate-500">
                          Price
                        </span>

                        <b className="text-sm text-[#243346]">
                          ₹
                          {Number(
                            item.price
                          ).toFixed(
                            2
                          )}
                        </b>

                      </div>

                      {/* QUANTITY */}

                      <div className="mt-3 flex items-center justify-between gap-3">

                        <span className="text-xs font-semibold text-slate-500">
                          Quantity
                        </span>

                        <div className="inline-flex items-center border border-slate-200">

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.key,
                                item.quantity -
                                  1
                              )
                            }
                            className="
                              grid
                              h-8
                              w-8
                              place-items-center
                              text-[#243346]
                              transition
                              hover:bg-slate-50
                            "
                          >
                            <Minus
                              size={
                                13
                              }
                            />
                          </button>

                          <span className="min-w-8 text-center text-sm font-bold text-[#243346]">
                            {
                              item.quantity
                            }
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.key,
                                item.quantity +
                                  1
                              )
                            }
                            className="
                              grid
                              h-8
                              w-8
                              place-items-center
                              text-[#243346]
                              transition
                              hover:bg-slate-50
                            "
                          >
                            <Plus
                              size={
                                13
                              }
                            />
                          </button>

                        </div>

                      </div>

                      {/* SUBTOTAL */}

                      <div className="mt-3 flex items-center justify-between gap-3">

                        <span className="text-xs font-semibold text-slate-500">
                          Subtotal
                        </span>

                        <b className="text-base text-[#D9A537]">
                          ₹
                          {(
                            Number(
                              item.price
                            ) *
                            item.quantity
                          ).toFixed(
                            2
                          )}
                        </b>

                      </div>

                    </div>

                  </div>

                </div>
              ))}

            </div>

            {/* =================================
                TABLET / LAPTOP / DESKTOP
                EXISTING TABLE DESIGN
            ================================= */}

            <div className="hidden overflow-x-auto md:block">

              <div className="min-w-[680px]">

                {/* TABLE HEADER */}

                <div
                  className="
                    grid
                    grid-cols-[55px_110px_1.5fr_.7fr_.65fr_.8fr]
                    items-center
                    border-b
                    border-slate-200
                    pb-5
                    text-xs
                    font-black
                    uppercase
                    text-[#243346]
                  "
                >
                  <span />
                  <span />
                  <span>
                    Product
                  </span>
                  <span>
                    Price
                  </span>
                  <span>
                    Quantity
                  </span>
                  <span>
                    Subtotal
                  </span>
                </div>

                {/* PRODUCTS */}

                {cart.map((item) => (
                  <div
                    key={item.key}
                    className="
                      grid
                      grid-cols-[55px_110px_1.5fr_.7fr_.65fr_.8fr]
                      items-center
                      border-b
                      border-slate-200
                      py-7
                      text-sm
                    "
                  >

                    {/* REMOVE */}

                    <button
                      type="button"
                      onClick={() =>
                        removeFromCart(
                          item.key
                        )
                      }
                      className="
                        grid
                        h-5
                        w-5
                        place-items-center
                        rounded-full
                        border
                        border-slate-300
                        text-slate-400
                        transition
                        hover:border-red-500
                        hover:text-red-500
                      "
                    >
                      <X size={12} />
                    </button>

                    {/* IMAGE */}

                    <Link
                      to={`/products/${item.id}`}
                    >
                      <img
                        src={
                          item.image
                        }
                        alt={
                          item.name
                        }
                        className="h-24 w-20 object-contain"
                      />
                    </Link>

                    {/* PRODUCT */}

                    <div>

                      <Link
                        to={`/products/${item.id}`}
                        className="
                          font-black
                          text-[#243346]
                          transition
                          hover:text-[#D9A537]
                        "
                      >
                        {item.name}
                      </Link>

                      {item.size && (
                        <p className="mt-1 text-xs text-slate-500">
                          Size:{" "}
                          {item.size}
                        </p>
                      )}

                    </div>

                    {/* PRICE */}

                    <b>
                      ₹
                      {Number(
                        item.price
                      ).toFixed(
                        2
                      )}
                    </b>

                    {/* QUANTITY */}

                    <div className="inline-flex w-fit items-center border border-slate-200">

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.key,
                            item.quantity -
                              1
                          )
                        }
                        className="p-2"
                      >
                        <Minus
                          size={13}
                        />
                      </button>

                      <span className="w-8 text-center font-bold">
                        {
                          item.quantity
                        }
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.key,
                            item.quantity +
                              1
                          )
                        }
                        className="p-2"
                      >
                        <Plus
                          size={13}
                        />
                      </button>

                    </div>

                    {/* SUBTOTAL */}

                    <b>
                      ₹
                      {(
                        Number(
                          item.price
                        ) *
                        item.quantity
                      ).toFixed(
                        2
                      )}
                    </b>

                  </div>
                ))}

              </div>

            </div>

          </section>

          {/* =====================================
              CART TOTALS
          ===================================== */}

          <aside className="border-[5px] border-[#eeeeee] bg-white p-5 sm:p-6">

            <h2 className="text-xl font-black uppercase text-[#243346]">
              Cart Totals
            </h2>

            <div className="mt-3 border-t border-slate-200">

              {/* SUBTOTAL */}

              <div className="flex justify-between border-b border-slate-200 py-5 text-sm">

                <b>
                  Subtotal
                </b>

                <b className="text-lg text-[#243346]">
                  ₹
                  {subtotal.toFixed(
                    2
                  )}
                </b>

              </div>

              {/* SHIPPING */}

              <div className="border-b border-slate-200 py-5 text-sm">

                <div className="flex justify-between gap-5">

                  <b>
                    Shipping
                  </b>

                  <div className="text-right">

                    <span>
                      Flat rate:{" "}
                      <b>
                        ₹
                        {shipping.toFixed(
                          2
                        )}
                      </b>
                    </span>

                    <p className="mt-2">
                      Shipping to{" "}
                      <b>
                        {shipTo.state ||
                          "Telangana"}
                      </b>
                      .
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setAddressOpen(
                          (open) =>
                            !open
                        )
                      }
                      className="mt-2 font-semibold text-[#D9A537]"
                    >
                      Change address
                    </button>

                  </div>

                </div>

                {/* ADDRESS FORM */}

                {addressOpen && (
                  <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">

                    {/* COUNTRY */}

                    <label className="block">

                      <span className="mb-2 block text-sm font-semibold text-[#243346]">
                        Country /
                        region
                      </span>

                      <select
                        value={
                          draftAddress.country
                        }
                        onChange={(
                          e
                        ) =>
                          setDraftAddress(
                            {
                              ...draftAddress,
                              country:
                                e
                                  .target
                                  .value,
                            }
                          )
                        }
                        className="input-field h-11 rounded-sm"
                      >
                        <option value="India">
                          India
                        </option>
                      </select>

                    </label>

                    {/* STATE */}

                    <label className="block">

                      <span className="mb-2 block text-sm font-semibold text-[#243346]">
                        State /
                        County{" "}
                        <span className="text-red-500">
                          *
                        </span>
                      </span>

                      <input
                        value={
                          draftAddress.state
                        }
                        onChange={(
                          e
                        ) =>
                          setDraftAddress(
                            {
                              ...draftAddress,
                              state:
                                e
                                  .target
                                  .value,
                            }
                          )
                        }
                        className="input-field h-11 rounded-sm"
                      />

                    </label>

                    {/* CITY */}

                    <label className="block">

                      <span className="mb-2 block text-sm font-semibold text-[#243346]">
                        City{" "}
                        <span className="text-red-500">
                          *
                        </span>
                      </span>

                      <input
                        value={
                          draftAddress.city
                        }
                        onChange={(
                          e
                        ) =>
                          setDraftAddress(
                            {
                              ...draftAddress,
                              city:
                                e
                                  .target
                                  .value,
                            }
                          )
                        }
                        className="input-field h-11 rounded-sm"
                      />

                    </label>

                    {/* PINCODE */}

                    <label className="block">

                      <span className="mb-2 block text-sm font-semibold text-[#243346]">
                        Postcode /
                        ZIP{" "}
                        <span className="text-red-500">
                          *
                        </span>
                      </span>

                      <input
                        value={
                          draftAddress.pincode
                        }
                        onChange={(
                          e
                        ) =>
                          setDraftAddress(
                            {
                              ...draftAddress,
                              pincode:
                                e
                                  .target
                                  .value,
                            }
                          )
                        }
                        className="input-field h-11 rounded-sm"
                      />

                    </label>

                    {/* UPDATE */}

                    <div className="flex justify-end">

                      <button
                        type="button"
                        onClick={
                          saveAddress
                        }
                        className="btn-gold rounded-sm px-7"
                      >
                        Update
                      </button>

                    </div>

                  </div>
                )}

              </div>

              {/* TOTAL */}

              <div className="py-6">

                <div className="flex items-start justify-between gap-4">

                  <b className="pt-2 text-sm">
                    Total
                  </b>

                  <div className="text-right">

                    <p className="text-[28px] font-black text-[#D9A537]">
                      ₹
                      {total.toFixed(
                        2
                      )}
                    </p>

                    <p className="mt-2 text-xs font-semibold leading-6 text-[#243346]">

                      (includes{" "}

                      <strong className="text-[#D9A537]">
                        ₹
                        {cgst.toFixed(
                          2
                        )}
                      </strong>{" "}

                      9% CGST,

                      <br />

                      <strong className="text-[#D9A537]">
                        ₹
                        {sgst.toFixed(
                          2
                        )}
                      </strong>{" "}

                      9% CGST,

                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* CHECKOUT */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/checkout"
                )
              }
              className="btn-gold w-full rounded-sm"
            >
              Proceed to checkout
            </button>

          </aside>

        </div>

      </div>

    </main>
  );
}

// import { ChevronRight, Minus, Plus, ShoppingBag, X } from "lucide-react";
// import { Link, useNavigate } from "react-router-dom";
// import { useEffect, useState } from "react";
// import { useCart } from "../context/CartContext";
// import { getDefaultAddress, saveSharedAddress } from "../utils/addressStorage";

// const EMPTY_SHIPPING = { country: "India", state: "Telangana", city: "", pincode: "" };

// export default function Cart() {
//   const navigate = useNavigate();
//   const { cart, updateQuantity, removeFromCart, subtotal, shipping, total } = useCart();
//   const [addressOpen, setAddressOpen] = useState(false);
//   const [shipTo, setShipTo] = useState(EMPTY_SHIPPING);
//   const [draftAddress, setDraftAddress] = useState(EMPTY_SHIPPING);

//   useEffect(() => {
//     const saved = getDefaultAddress();
//     if (saved) {
//       const shippingAddress = { country: saved.country || "India", state: saved.state || "Telangana", city: saved.city || "", pincode: saved.pincode || "" };
//       setShipTo(shippingAddress);
//       setDraftAddress(shippingAddress);
//     }
//   }, []);

//   const cgst = (Number(subtotal) * 2.5) / 105;
//   const sgst = (Number(subtotal) * 2.5) / 105;

//   const saveAddress = () => {
//     const existing = getDefaultAddress() || {};
//     const saved = saveSharedAddress({ ...existing, ...draftAddress, country: draftAddress.country || "India", state: draftAddress.state || "Telangana" });
//     setShipTo({ country: saved.country, state: saved.state, city: saved.city, pincode: saved.pincode });
//     setAddressOpen(false);
//   };

//   if (!cart.length) {
//     return (
//       <main className="grid min-h-[58vh] place-items-center px-5">
//         <div className="text-center">
//           <ShoppingBag className="mx-auto text-[#D9A537]" size={48} />
//           <h1 className="mt-4 text-3xl font-black text-[#243346]">Your Cart Is Empty</h1>
//           <p className="mt-2 text-slate-500">Your cart is currently empty.</p>
//           <Link to="/" className="btn-gold mt-6">Return to Shop</Link>
//         </div>
//       </main>
//     );
//   }

//   return (
//     // <main className="bg-white">
//     //   <div className="container-site py-10 sm:py-14">
//     //     <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_410px]">
//   <main className="bg-white">

//     {/* =========================
//         CART PAGE HEADER
//     ========================== */}
//     <section className="container-site pt-8 sm:pt-12 lg:pt-14">

//       <h1 className="text-3xl font-black text-[#243346] sm:text-4xl">
//         Cart
//       </h1>

//       <div className="mt-3 flex items-center gap-1 text-sm">

//         <Link
//           to="/"
//           className="text-slate-400 transition hover:text-[#D9A537]"
//         >
//           Home
//         </Link>

//         <ChevronRight
//           size={14}
//           className="text-slate-400"
//         />

//         <span className="font-semibold text-[#243346]">
//           Cart
//         </span>

//       </div>

//     </section>

//     {/* =========================
//         CART CONTENT
//     ========================== */}

//     <div className="container-site pb-12 pt-20 sm:pb-16 sm:pt-24">

//       <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_410px]">
//           <section className="overflow-x-auto">
//             <div className="min-w-[680px]">
//               <div className="grid grid-cols-[55px_110px_1.5fr_.7fr_.65fr_.8fr] items-center border-b border-slate-200 pb-5 text-xs font-black uppercase text-[#243346]"><span /><span /><span>Product</span><span>Price</span><span>Quantity</span><span>Subtotal</span></div>
//               {cart.map((item) => (
//                 <div key={item.key} className="grid grid-cols-[55px_110px_1.5fr_.7fr_.65fr_.8fr] items-center border-b border-slate-200 py-7 text-sm">
//                   <button type="button" onClick={() => removeFromCart(item.key)} className="grid h-5 w-5 place-items-center rounded-full border border-slate-300 text-slate-400 transition hover:border-red-500 hover:text-red-500"><X size={12} /></button>
//                   <Link to={`/products/${item.id}`}><img src={item.image} alt={item.name} className="h-24 w-20 object-contain" /></Link>
//                   <div><Link to={`/products/${item.id}`} className="font-black text-[#243346] transition hover:text-[#D9A537]">{item.name}</Link>{item.size && <p className="mt-1 text-xs text-slate-500">Size: {item.size}</p>}</div>
//                   <b>₹{Number(item.price).toFixed(2)}</b>
//                   <div className="inline-flex w-fit items-center border border-slate-200"><button type="button" onClick={() => updateQuantity(item.key, item.quantity - 1)} className="p-2"><Minus size={13} /></button><span className="w-8 text-center font-bold">{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.key, item.quantity + 1)} className="p-2"><Plus size={13} /></button></div>
//                   <b>₹{(Number(item.price) * item.quantity).toFixed(2)}</b>
//                 </div>
//               ))}
//             </div>
//           </section>

//           <aside className="border-[5px] border-[#eeeeee] bg-white p-6">
//             <h2 className="text-xl font-black uppercase text-[#243346]">Cart Totals</h2>
//             <div className="mt-3 border-t border-slate-200">
//               <div className="flex justify-between border-b border-slate-200 py-5 text-sm"><b>Subtotal</b><b className="text-lg text-[#243346]">₹{subtotal.toFixed(2)}</b></div>
//               <div className="border-b border-slate-200 py-5 text-sm">
//                 <div className="flex justify-between gap-5"><b>Shipping</b><div className="text-right"><span>Flat rate: <b>₹{shipping.toFixed(2)}</b></span><p className="mt-2">Shipping to <b>{shipTo.state || "Telangana"}</b>.</p><button type="button" onClick={() => setAddressOpen((open) => !open)} className="mt-2 font-semibold text-[#D9A537]">Change address</button></div></div>
//                 {addressOpen && (
//                   <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
//                     <label className="block"><span className="mb-2 block text-sm font-semibold text-[#243346]">Country / region</span><select value={draftAddress.country} onChange={(e) => setDraftAddress({ ...draftAddress, country: e.target.value })} className="input-field h-11 rounded-sm"><option value="India">India</option></select></label>
//                     <label className="block"><span className="mb-2 block text-sm font-semibold text-[#243346]">State / County <span className="text-red-500">*</span></span><input value={draftAddress.state} onChange={(e) => setDraftAddress({ ...draftAddress, state: e.target.value })} className="input-field h-11 rounded-sm" /></label>
//                     <label className="block"><span className="mb-2 block text-sm font-semibold text-[#243346]">City <span className="text-red-500">*</span></span><input value={draftAddress.city} onChange={(e) => setDraftAddress({ ...draftAddress, city: e.target.value })} className="input-field h-11 rounded-sm" /></label>
//                     <label className="block"><span className="mb-2 block text-sm font-semibold text-[#243346]">Postcode / ZIP <span className="text-red-500">*</span></span><input value={draftAddress.pincode} onChange={(e) => setDraftAddress({ ...draftAddress, pincode: e.target.value })} className="input-field h-11 rounded-sm" /></label>
//                     <div className="flex justify-end"><button type="button" onClick={saveAddress} className="btn-gold rounded-sm px-7">Update</button></div>
//                   </div>
//                 )}
//               </div>

//               <div className="py-6">
//                 <div className="flex items-start justify-between gap-4">
//                   <b className="pt-2 text-sm">Total</b>
//                   <div className="text-right"><p className="text-[28px] font-black text-[#D9A537]">₹{total.toFixed(2)}</p><p className="mt-2 text-xs font-semibold leading-6 text-[#243346]">(includes <strong className="text-[#D9A537]">₹{cgst.toFixed(2)}</strong> 2.5% CGST,<br /><strong className="text-[#D9A537]">₹{sgst.toFixed(2)}</strong> 2.5% SGST)</p></div>
//                 </div>
//               </div>
//             </div>
//             <button type="button" onClick={() => navigate("/checkout")} className="btn-gold w-full rounded-sm">Proceed to checkout</button>
//           </aside>
//         </div>
//       </div>
//     </main>
//   );
// }
