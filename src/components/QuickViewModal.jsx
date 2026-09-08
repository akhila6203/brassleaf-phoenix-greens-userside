import {
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useCart,
} from "../context/CartContext";

import {
  getProductById,
} from "../services/productService";

import {
  toDetailProduct,
} from "../utils/productAdapter";

/* =========================================================
   PRICE
========================================================= */

function money(value) {
  if (
    value == null ||
    value === "" ||
    Number.isNaN(
      Number(value)
    )
  ) {
    return "";
  }

  return `₹${Number(
    value
  ).toFixed(2)}`;
}

/* =========================================================
   TAG TEXT
========================================================= */

function tagsText(
  tags
) {
  if (
    !Array.isArray(
      tags
    )
  ) {
    return "";
  }

  return tags
    .map(
      (item) => {
        if (
          typeof item ===
          "string"
        ) {
          return item;
        }

        return (
          item?.name ||
          item?.slug ||
          ""
        );
      }
    )
    .filter(Boolean)
    .join(", ");
}

/* =========================================================
   QUICK VIEW
========================================================= */

export default function QuickViewModal({
  product,
  open,
  onClose,
}) {
  const {
    addToCart,
  } = useCart();

  const [
    detail,
    setDetail,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    size,
    setSize,
  ] = useState("");

  const [
    qty,
    setQty,
  ] = useState(1);

  const [
    adding,
    setAdding,
  ] = useState(false);

  /* =======================================================
     LOAD PRODUCT
  ======================================================= */

  useEffect(() => {
    if (
      !open ||
      !product?.id
    ) {
      return;
    }

    let cancelled =
      false;

    setLoading(
      true
    );

    setError(
      ""
    );

    setDetail(
      null
    );

    setSize(
      ""
    );

    setQty(
      1
    );

    getProductById(
      product.id
    )
      .then(
        (result) => {
          if (
            !cancelled
          ) {
            setDetail(
              toDetailProduct(
                result
              )
            );
          }
        }
      )
      .catch(
        (err) => {
          if (
            !cancelled
          ) {
            setError(
              err?.message ||
                "Unable to load product details."
            );
          }
        }
      )
      .finally(
        () => {
          if (
            !cancelled
          ) {
            setLoading(
              false
            );
          }
        }
      );

    return () => {
      cancelled =
        true;
    };
  }, [
    open,
    product?.id,
  ]);

  /* =======================================================
     ESCAPE + BODY SCROLL
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow =
      "hidden";

    const onKeyDown =
      (event) => {
        if (
          event.key ===
          "Escape"
        ) {
          onClose?.();
        }
      };

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      document.body.style
        .overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [
    open,
    onClose,
  ]);

  /* =======================================================
     SELECTED SIZE VARIATION
  ======================================================= */

  const selectedVariation =
    useMemo(
      () =>
        detail
          ?.variations
          ?.find(
            (
              variation
            ) =>
              String(
                variation.size
              ) ===
              String(
                size
              )
          ),
      [
        detail,
        size,
      ]
    );

  if (
    !open ||
    !product
  ) {
    return null;
  }

  /* =======================================================
     VALUES
  ======================================================= */

  const displayProduct =
    detail ||
    product;

  const image =
    displayProduct.image ||
    product.image;

  // const hasSizes =
  //   detail?.hasSizes ===
  //   true;
  const hasSizes =
  String(
    detail?.productType ||
      product?.productType ||
      ""
  ).toLowerCase() ===
    "variable" ||
  Boolean(
    detail?.hasSizes
  ) ||
  (
    Array.isArray(
      detail?.sizes
    ) &&
    detail.sizes.length > 0
  ) ||
  (
    Array.isArray(
      detail?.variations
    ) &&
    detail.variations.some(
      (variation) =>
        String(
          variation?.size ||
            ""
        ).trim() !== ""
    )
  );

  const outOfStock =
    detail
      ?.isOutOfStock ||
    product.stockStatus ===
      "outofstock";

  const selectedPrice =
    selectedVariation
      ?.price ??
    detail?.minPrice ??
    product.minPrice;

  const min =
    detail?.minPrice ??
    product.minPrice ??
    product.price;

  const max =
    detail?.maxPrice ??
    product.maxPrice ??
    min;

  const priceText =
    min != null &&
    max != null &&
    Number(min) !==
      Number(max) &&
    !size
      ? `${money(
          min
        )} – ${money(
          max
        )}`
      : money(
          selectedPrice ??
            min
        );

  /* =======================================================
     CATEGORY
  ======================================================= */

  const categoryText =
    Array.isArray(
      detail?.categories
    )
      ? detail.categories
          .map(
            (item) =>
              item?.name
          )
          .filter(Boolean)
          .join(", ")
      : product.category ||
        "";

  const productTags =
    tagsText(
      detail?.tags
    );

  /* =======================================================
     QUANTITY
  ======================================================= */

  const handleQuantityChange =
    (event) => {
      const next =
        Number.parseInt(
          event.target
            .value,
          10
        );

      setQty(
        Number.isFinite(
          next
        ) &&
          next >
            0
          ? next
          : 1
      );
    };

  /* =======================================================
     ADD TO CART
  ======================================================= */

  const handleAdd =
    async () => {
      if (
        !detail ||
        outOfStock ||
        adding
      ) {
        return;
      }

      /*
       * Product has size:
       * size must be selected.
       */
      if (
        hasSizes &&
        !size
      ) {
        return;
      }

      /*
       * Selected size should
       * exist and be in stock.
       */
      if (
        hasSizes &&
        (
          !selectedVariation ||
          selectedVariation
            .stockStatus ===
            "outofstock"
        )
      ) {
        return;
      }

      setAdding(
        true
      );

      try {
        const itemPrice =
          hasSizes
            ? selectedVariation
                ?.price
            : detail.price ??
              detail.minPrice;

        /*
         * IMPORTANT:
         *
         * Existing cart flow
         * remains unchanged.
         */
        for (
          let i = 0;
          i < qty;
          i += 1
        ) {
          await addToCart(
            detail,
            hasSizes
              ? size
              : "",
            itemPrice
          );
        }

        onClose?.();
      } finally {
        setAdding(
          false
        );
      }
    };

  return (
    <div
      className="
        fixed
        inset-0
        z-[120]

        flex
        items-center
        justify-center

        overflow-y-auto

        bg-[#0f172a]/80

        px-3
        py-5

        sm:px-5
      "
      onMouseDown={
        (event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            onClose?.();
          }
        }
      }
    >
      {/* =================================================
          POPUP
      ================================================= */}

      <div
        className="
          relative

          w-full
          max-w-[980px]

          overflow-hidden

          bg-white

          shadow-[0_24px_70px_rgba(0,0,0,0.35)]
        "
      >
        {/* =================================================
            CLOSE
        ================================================= */}

        <button
          type="button"
          onClick={
            onClose
          }
          aria-label="Close quick view"
          className="
            absolute
            right-2
            top-2
            z-20

            grid
            h-9
            w-9
            place-items-center

            text-slate-500

            transition

            hover:bg-slate-100
            hover:text-[#243346]
          "
        >
          <X
            size={
              24
            }
          />
        </button>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div
            className="
              flex
              min-h-[430px]
              items-center
              justify-center
            "
          >
            <div
              className="
                h-10
                w-10

                animate-spin

                rounded-full

                border-4
                border-[#D9A537]
                border-t-transparent
              "
            />
          </div>
        ) : error ||
          !detail ? (
          /* ===============================================
             ERROR
          =============================================== */

          <div
            className="
              min-h-[300px]

              px-8
              py-16

              text-center
              text-sm
              font-semibold

              text-red-600
            "
          >
            {error ||
              "Unable to load product details."}
          </div>
        ) : (
          /* =================================================
             PRODUCT
          ================================================= */

          <div
            className="
              grid

              md:grid-cols-[1.08fr_.92fr]
            "
          >
            {/* ===============================================
                LEFT IMAGE
            =============================================== */}

            <div
              className="
                flex
                min-h-[330px]
                items-center
                justify-center

                bg-white

                p-5

                sm:min-h-[390px]
                sm:p-7

                md:min-h-[460px]
                md:p-8
              "
            >
              {image ? (
                <img
                  src={
                    image
                  }
                  alt={
                    detail.name
                  }
                  className="
                    max-h-[430px]
                    w-full
                    object-contain
                  "
                />
              ) : (
                <div
                  className="
                    text-sm
                    text-slate-400
                  "
                >
                  No image available
                </div>
              )}
            </div>

            {/* ===============================================
                RIGHT DETAILS
            =============================================== */}

            <div
              className="
                p-5
                pt-11

                sm:p-7
                sm:pt-11

                md:flex
                md:flex-col
                md:justify-center
                md:p-8
              "
            >
              {/* TITLE */}

              <h2
                className="
                  pr-7

                  text-2xl
                  font-black
                  leading-tight

                  text-[#243346]

                  sm:text-[28px]
                "
              >
                {detail.name}
              </h2>

              {/* PRICE */}

              <p
                className="
                  mt-4

                  text-xl
                  font-extrabold

                  text-[#D9A537]

                  sm:text-2xl
                "
              >
                {priceText}
              </p>

              {/* =============================================
                  SIZE

                  ONLY show when product has sizes.
              ============================================= */}

              {hasSizes && (
                <div
                  className="
                    mt-5
                  "
                >
                  <label
                    htmlFor={`quick-size-${detail.id}`}
                    className="
                      mb-2
                      block

                      text-sm
                      font-bold

                      text-[#243346]
                    "
                  >
                    Size
                  </label>

                  <select
                    id={`quick-size-${detail.id}`}
                    value={
                      size
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setSize(
                          event
                            .target
                            .value
                        )
                    }
                    className="
                      h-11
                      w-full
                      max-w-[260px]

                      border
                      border-slate-300

                      bg-white

                      px-3

                      text-sm
                      text-[#243346]

                      outline-none

                      focus:border-[#D9A537]
                    "
                  >
                    <option
                      value=""
                    >
                      Choose an option
                    </option>

                    {[
                      ...detail
                        .sizes,
                    ]
                      .sort(
                        (
                          a,
                          b
                        ) => {
                          const aNumber =
                            Number(
                              a
                            );

                          const bNumber =
                            Number(
                              b
                            );

                          if (
                            Number.isFinite(
                              aNumber
                            ) &&
                            Number.isFinite(
                              bNumber
                            )
                          ) {
                            return (
                              aNumber -
                              bNumber
                            );
                          }

                          return String(
                            a
                          ).localeCompare(
                            String(
                              b
                            )
                          );
                        }
                      )
                      .map(
                        (
                          item
                        ) => {
                          const variation =
                            detail
                              .variations
                              .find(
                                (
                                  entry
                                ) =>
                                  String(
                                    entry
                                      .size
                                  ) ===
                                  String(
                                    item
                                  )
                              );

                          const unavailable =
                            variation
                              ?.stockStatus ===
                            "outofstock";

                          return (
                            <option
                              key={
                                item
                              }
                              value={
                                item
                              }
                              disabled={
                                unavailable
                              }
                            >
                              {item}

                              {unavailable
                                ? " - Out of stock"
                                : ""}
                            </option>
                          );
                        }
                      )}
                  </select>
                </div>
              )}

              {/* =============================================
                  QUANTITY + ADD TO CART
              ============================================= */}

              <div
                className="
                  mt-5

                  flex
                  items-center
                  gap-3

                  border-y
                  border-slate-200

                  py-4
                "
              >
                {/* QUANTITY */}

                <input
                  type="number"
                  min="1"
                  value={
                    qty
                  }
                  onChange={
                    handleQuantityChange
                  }
                  className="
                    h-11
                    w-[66px]

                    border
                    border-slate-300

                    bg-white

                    px-3

                    text-center
                    text-sm
                    font-semibold

                    text-[#243346]

                    outline-none

                    focus:border-[#D9A537]
                  "
                  aria-label="Quantity"
                />

                {/* ADD */}

                <button
                  type="button"
                  onClick={
                    handleAdd
                  }
                  disabled={
                    outOfStock ||
                    adding ||
                    (
                      hasSizes &&
                      !size
                    ) ||
                    selectedVariation
                      ?.stockStatus ===
                      "outofstock"
                  }
                  className="
                    min-h-11
                    flex-1

                    bg-[#243346]

                    px-5
                    py-2.5

                    text-sm
                    font-black
                    uppercase
                    tracking-wide

                    text-white

                    transition

                    hover:bg-[#D9A537]
                    hover:text-[#243346]

                    disabled:cursor-not-allowed
                    disabled:bg-slate-300
                    disabled:text-slate-500
                  "
                >
                  {outOfStock
                    ? "Out of Stock"
                    : adding
                    ? "Adding..."
                    : "Add to Cart"}
                </button>
              </div>

              {/* =============================================
                  SKU / CATEGORY / TAGS
              ============================================= */}

              <div
                className="
                  mt-3

                  text-[13px]
                  leading-6

                  text-slate-600
                "
              >
                <p>
                  <span
                    className="
                      font-bold
                      text-[#243346]
                    "
                  >
                    SKU:
                  </span>{" "}
                  {detail.sku ||
                    "N/A"}
                </p>

                {categoryText && (
                  <p>
                    <span
                      className="
                        font-bold
                        text-[#243346]
                      "
                    >
                      Categories:
                    </span>{" "}
                    {categoryText}
                  </p>
                )}

                {productTags && (
                  <p>
                    <span
                      className="
                        font-bold
                        text-[#243346]
                      "
                    >
                      Tags:
                    </span>{" "}
                    {productTags}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}