import {
  X,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import {
  useCart,
} from "../context/CartContext";

/* =========================================================
   MONEY
========================================================= */

function money(value) {
  const amount =
    Number(value || 0);

  return `₹${amount.toFixed(2)}`;
}

/* =========================================================
   CART DRAWER
========================================================= */

export default function CartDrawer({
  open,
  onClose,
}) {
  const {
    cart,
    subtotal,
    removeFromCart,
  } = useCart();

  return (
    <>
      {/* =====================================================
          BACKDROP
      ===================================================== */}

      <div
        onClick={onClose}
        className={`
          fixed
          inset-0
          z-[150]

          bg-black/55

          transition-opacity
          duration-300

          ${
            open
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      />

      {/* =====================================================
          RIGHT DRAWER
      ===================================================== */}

      <aside
        className={`
          fixed
          right-0
          top-0
          z-[160]

          flex
          h-screen
          w-full
          max-w-[660px]
          flex-col

          bg-white

          shadow-[-10px_0_40px_rgba(0,0,0,0.18)]

          transition-transform
          duration-300
          ease-out

          ${
            open
              ? "translate-x-0"
              : "translate-x-full"
          }

          sm:max-w-[520px]
          lg:max-w-[660px]
        `}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex
            min-h-[58px]
            items-center
            justify-between

            border-b
            border-slate-200

            px-5

            sm:px-6
          "
        >
          <h2
            className="
              text-[15px]
              font-semibold
              text-[#243346]
            "
          >
            Shopping Cart
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center

              text-slate-600

              transition

              hover:text-[#D9A537]
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* =================================================
            ITEMS
        ================================================= */}

        <div
          className="
            flex-1
            overflow-y-auto
          "
        >
          {cart.length === 0 ? (
            <div
              className="
                flex
                h-full
                min-h-[300px]
                flex-col
                items-center
                justify-center

                px-6
                text-center
              "
            >
              <p
                className="
                  text-base
                  font-bold
                  text-[#243346]
                "
              >
                Your cart is empty.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="
                  mt-3
                  text-sm
                  font-semibold
                  text-[#D9A537]
                "
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const quantity =
                Number(
                  item.quantity ||
                  item.qty ||
                  1
                );

              return (
                <div
                  key={item.key}
                  className="
                    flex
                    gap-4

                    border-b
                    border-slate-200

                    px-5
                    py-5

                    sm:px-6
                  "
                >
                  {/* IMAGE */}

                  <div
                    className="
                      flex
                      h-[72px]
                      w-[72px]
                      shrink-0
                      items-center
                      justify-center

                      bg-white
                    "
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="
                          h-full
                          w-full
                          object-contain
                        "
                      />
                    ) : (
                      <div
                        className="
                          text-xs
                          text-slate-400
                        "
                      >
                        No image
                      </div>
                    )}
                  </div>

                  {/* DETAILS */}

                  <div
                    className="
                      min-w-0
                      flex-1
                    "
                  >
                    <p
                      className="
                        pr-4
                        text-sm
                        font-medium
                        leading-5
                        text-[#243346]
                      "
                    >
                      {item.name}

                      {item.size
                        ? ` - ${item.size}`
                        : ""}
                    </p>

                    <p
                      className="
                        mt-2
                        text-sm
                        text-slate-600
                      "
                    >
                      {quantity} ×{" "}
                      {money(
                        item.price
                      )}
                    </p>
                  </div>

                  {/* REMOVE */}

                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() =>
                      removeFromCart(
                        item.key
                      )
                    }
                    className="
                      mt-1
                      flex
                      h-6
                      w-6
                      shrink-0
                      items-center
                      justify-center

                      rounded-full

                      border
                      border-slate-300

                      text-slate-400

                      transition

                      hover:border-red-400
                      hover:text-red-500
                    "
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* =================================================
            BOTTOM

            Screenshot type:
            Subtotal
            VIEW CART
            CHECKOUT
        ================================================= */}

        {cart.length > 0 && (
          <div
            className="
              border-t
              border-slate-200

              bg-white
            "
          >
            {/* SUBTOTAL */}

            <div
              className="
                flex
                items-center
                justify-between

                border-b
                border-slate-200

                px-5
                py-4

                sm:px-6
              "
            >
              <span
                className="
                  text-sm
                  font-medium
                  text-[#243346]
                "
              >
                Subtotal:
              </span>

              <span
                className="
                  text-sm
                  font-semibold
                  text-[#243346]
                "
              >
                {money(subtotal)}
              </span>
            </div>

            {/* BUTTONS */}

            <div
              className="
                space-y-3
                px-5
                py-5

                sm:px-6
              "
            >
              {/* KEEP EXISTING VIEW CART FLOW */}

              <Link
                to="/cart"
                onClick={onClose}
                className="
                  flex
                  min-h-[46px]
                  w-full
                  items-center
                  justify-center

                  bg-[#243346]

                  px-5

                  text-xs
                  font-black
                  uppercase
                  tracking-wide
                  text-white

                  transition

                  hover:bg-[#D9A537]
                  hover:text-[#243346]
                "
              >
                View Cart
              </Link>

              {/* KEEP EXISTING CHECKOUT FLOW */}

              <Link
                to="/checkout"
                onClick={onClose}
                className="
                  flex
                  min-h-[46px]
                  w-full
                  items-center
                  justify-center

                  bg-[#243346]

                  px-5

                  text-xs
                  font-black
                  uppercase
                  tracking-wide
                  text-white

                  transition

                  hover:bg-[#D9A537]
                  hover:text-[#243346]
                "
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}