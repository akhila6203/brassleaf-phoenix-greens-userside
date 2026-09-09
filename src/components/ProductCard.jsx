import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  useCart,
} from "../context/CartContext";

import {
  getProductById,
} from "../services/productService";

import {
  toDetailProduct,
} from "../utils/productAdapter";

import QuickViewModal
  from "./QuickViewModal";

/* =========================================================
   MONEY
========================================================= */

function money(value) {
  if (
    value == null ||
    value === "" ||
    Number.isNaN(Number(value))
  ) {
    return "";
  }

  return `₹${Number(value).toFixed(2)}`;
}

/* =========================================================
   CATEGORY

   From:
   Boys, Grade 1-2, Nursery...

   Display:
   Boys
========================================================= */

function shortCategory(value = "") {
  const parts = String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    parts.find((item) =>
      /^(boys|girls|boys\/girls)$/i.test(item)
    ) ||
    parts[0] ||
    ""
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

export default function ProductCard({
  product,
  showPrice = true,
    // Current category page context
  categoryContext = null,

}) {
  const {
    addToCart,
  } = useCart();

  const [
    detailProduct,
    setDetailProduct,
  ] = useState(null);

  const [
    checkingOptions,
    setCheckingOptions,
  ] = useState(true);

  const [
    adding,
    setAdding,
  ] = useState(false);

  const [
    quickOpen,
    setQuickOpen,
  ] = useState(false);

  /* =======================================================
     LOAD FULL PRODUCT

     Important because product list does not always contain
     variation / size information.
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadProductDetails =
      async () => {
        try {
          setCheckingOptions(true);

          const response =
            await getProductById(
              product.id
            );

          if (!cancelled) {
            const mapped =
              toDetailProduct(
                response
              );

            setDetailProduct(
              mapped
            );
          }
        } catch (error) {
          console.error(
            "Unable to load product details:",
            error
          );

          if (!cancelled) {
            setDetailProduct(
              null
            );
          }
        } finally {
          if (!cancelled) {
            setCheckingOptions(
              false
            );
          }
        }
      };

    loadProductDetails();

    return () => {
      cancelled = true;
    };
  }, [product.id]);

  /* =======================================================
     SIZE CHECK

     More reliable check.

     Product with actual size variation:
     SELECT OPTIONS

     Product without size:
     ADD TO CART
  ======================================================= */

 const hasSizes =
  String(
    product?.productType || ""
  ).toLowerCase() === "variable" ||
  String(
    detailProduct?.productType || ""
  ).toLowerCase() === "variable" ||
  Boolean(
    detailProduct?.hasSizes
  ) ||
  (
    Array.isArray(
      detailProduct?.sizes
    ) &&
    detailProduct.sizes.length > 0
  ) ||
  (
    Array.isArray(
      detailProduct?.variations
    ) &&
    detailProduct.variations.some(
      (variation) =>
        String(
          variation?.size || ""
        ).trim() !== ""
    )
  );

  /* =======================================================
     PRICE

     First use detailed product price.

     If detail API has not loaded yet,
     use list API price.

     This fixes prices disappearing from cards.
  ======================================================= */

  const minPrice =
    detailProduct?.minPrice ??
    detailProduct?.price ??
    product.minPrice ??
    product.price ??
    null;

  const maxPrice =
    detailProduct?.maxPrice ??
    product.maxPrice ??
    minPrice;

  const priceText =
    minPrice == null
      ? ""
      : maxPrice != null &&
        Number(maxPrice) !==
          Number(minPrice)
      ? `${money(minPrice)} – ${money(maxPrice)}`
      : money(minPrice);

  /* =======================================================
     CATEGORY
  ======================================================= */
const categoryLabel =
  useMemo(() => {
    const productName = String(
      product?.name ||
        detailProduct?.name ||
        ""
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

    /* =========================================
       BELT CARD ONLY
    ========================================= */
    if (
      productName ===
      "pg belt boys / girls"
    ) {
      return "Boys";
    }

    /* =========================================
       SPORTS HOUSE T-SHIRTS - CARD ONLY
    ========================================= */
    const sportsOneToFiveProducts = [
      "pg light red kakathiya",
      "pg blue maurya",
      "pg green pandiya",
      "pg yellow chalukya",
    ];

    if (
      sportsOneToFiveProducts.includes(
        productName
      )
    ) {
      return "Sports-1-5";
    }

    /* =========================================
       ALL OTHER PRODUCTS - EXISTING LOGIC
    ========================================= */
    return shortCategory(
      detailProduct?.category ||
        product.category ||
        ""
    );
  }, [
    product?.name,
    detailProduct?.name,
    detailProduct?.category,
    product.category,
  ]);
  // const categoryLabel =
  //   useMemo(
  //     () =>
  //       shortCategory(
  //         detailProduct?.category ||
  //           product.category ||
  //           ""
  //       ),
  //     [
  //       detailProduct?.category,
  //       product.category,
  //     ]
  //   );

  /* =======================================================
     STOCK
  ======================================================= */

  const isOutOfStock =
    Boolean(
      detailProduct
        ?.isOutOfStock
    ) ||
    Boolean(
      product
        ?.isOutOfStock
    ) ||
    product
      ?.stockStatus ===
      "outofstock";

  /* =======================================================
     IMAGE
  ======================================================= */

  const productImage =
    detailProduct?.image ||
    product.image ||
    "";

  /* =======================================================
     DIRECT ADD TO CART

     ONLY SIMPLE PRODUCT
  ======================================================= */

  const directAdd =
    async () => {
      if (
        adding ||
        isOutOfStock
      ) {
        return;
      }

      setAdding(true);

      try {
        let current =
          detailProduct;

        /*
         * Safety fallback.
         */
        if (!current) {
          const response =
            await getProductById(
              product.id
            );

          current =
            toDetailProduct(
              response
            );

          setDetailProduct(
            current
          );
        }

        /*
         * Double-check sizes before
         * directly adding.
         */
       const currentHasSizes =
  String(
    current?.productType || ""
  ).toLowerCase() === "variable" ||
  String(
    product?.productType || ""
  ).toLowerCase() === "variable" ||
  Boolean(
    current?.hasSizes
  ) ||
  (
    Array.isArray(
      current?.sizes
    ) &&
    current.sizes.length > 0
  ) ||
  (
    Array.isArray(
      current?.variations
    ) &&
    current.variations.some(
      (variation) =>
        String(
          variation?.size || ""
        ).trim() !== ""
    )
  );

        /*
         * If size exists,
         * don't directly add.
         *
         * Open Quick View so
         * customer can select size.
         */
        if (
          currentHasSizes
        ) {
          setQuickOpen(
            true
          );

          return;
        }

        const cartPrice =
          current?.price ??
          current?.minPrice ??
          product.price ??
          product.minPrice;

        /*
         * Keep your existing
         * CartContext flow.
         */
        await addToCart(
          current,
          "",
          cartPrice
        );
      } catch (error) {
        console.error(
          "Add to cart failed:",
          error
        );
      } finally {
        setAdding(
          false
        );
      }
    };


const productCategories =
  Array.isArray(
    detailProduct?.categories
  )
    ? detailProduct.categories
    : [];

/* =========================================================
   PRODUCT DETAILS URL

   IMPORTANT:
   Use the page/category from which the product was opened.

   Example:
   Grade 1 & 2 collection
   -> category = grade1-2

   Girls category page
   -> category = girls
========================================================= */

const productDetailsUrl =
  categoryContext?.slug
    ? `/products/${product.id}?category=${encodeURIComponent(
        categoryContext.slug
      )}`
    : `/products/${product.id}`;


  return (
    <>
      {/* =================================================
          PRODUCT

          No white card background.
          No card border.
          No card shadow.
      ================================================= */}

      <article
        className="
          group/product
          flex
          h-full
          min-w-0
          flex-col
        "
      >
        {/* =================================================
            PRODUCT IMAGE
        ================================================= */}

        <Link
          to={`/products/${product.id}`}
          aria-label={`View ${product.name}`}
          className="
            block
            w-full
          "
        >
          <div
            className="
              relative

              flex
              aspect-square
              w-full

              items-center
              justify-center

              overflow-hidden

              bg-white
            "
          >
            {productImage ? (
              <img
                src={productImage}
                alt={product.name}
                className="
                  h-full
                  w-full

                  object-contain

                  transition
                  duration-300

                  group-hover/product:scale-[1.02]
                "
              />
            ) : (
              <div
                className="
                  flex
                  h-full
                  w-full

                  items-center
                  justify-center

                  text-sm
                  text-slate-400
                "
              >
                No image
              </div>
            )}

            {isOutOfStock && (
              <span
                className="
                  absolute
                  left-3
                  top-3

                  bg-[#243346]

                  px-3
                  py-1.5

                  text-[10px]
                  font-bold
                  uppercase

                  text-white
                "
              >
                Out of Stock
              </span>
            )}
          </div>
        </Link>

        {/* =================================================
            PRODUCT DETAILS
        ================================================= */}

        <div
          className="
            flex
            flex-1
            flex-col

            px-1
            pt-4

            text-center
          "
        >
          {/* PRODUCT NAME */}

         <Link
  to={`/products/${product.id}`}
  className="
    line-clamp-2
    text-[14px]
    font-extrabold
    leading-[21px]
    text-[#243346]
    transition
    hover:text-[#D9A537]
    sm:text-[15px]
  "
>
  {product.name}
</Link>

          {/* CATEGORY */}
{categoryLabel && (
  <p
    className="
      mt-1
      text-[16px]
      font-normal
      text-slate-500
    "
  >
    {categoryLabel}
  </p>
)}

          {/* =================================================
              PRICE
          ================================================= */}
          {showPrice && priceText && (
  <p
    className="
      mt-1.5
      text-[14px]
      font-extrabold
      text-[#D9A537]
    "
  >
    {priceText}
  </p>
)}

          {/* =================================================
              BUTTONS

              SIDE BY SIDE
          ================================================= */}

          <div
            className="
              mt-auto

              grid
              grid-cols-2
              gap-2

              pt-4
            "
          >
            {/* ===============================================
                FIRST BUTTON
            =============================================== */}

            {checkingOptions ? (
              <button
                type="button"
                disabled
                className="
                  flex
                  min-h-[46px]
                  w-full

                  items-center
                  justify-center

                  bg-[#D9A537]

                  px-2
                  py-2

                  text-center
                  text-[10px]
                  font-bold
                  uppercase
                  leading-4

                  text-[#243346]

                  opacity-60

                  sm:text-[11px]
                "
              >
                Loading...
              </button>
            ) : isOutOfStock ? (
              <button
                type="button"
                disabled
                className="
                  flex
                  min-h-[46px]
                  w-full

                  items-center
                  justify-center

                  bg-slate-300

                  px-2
                  py-2

                  text-center
                  text-[10px]
                  font-bold
                  uppercase

                  text-slate-500

                  sm:text-[11px]
                "
              >
                Out of Stock
              </button>
            // ) : hasSizes ? (

            //   <button
            //     type="button"
            //     onClick={() =>
            //       setQuickOpen(
            //         true
            //       )
            //     }
            //     className="
            //       flex
            //       min-h-[46px]
            //       w-full

            //       items-center
            //       justify-center

            //       bg-[#D9A537]

            //       px-2
            //       py-2

            //       text-center
            //       text-[10px]
            //       font-bold
            //       uppercase
            //       leading-4

            //       text-[#243346]

            //       transition

            //       hover:bg-[#c6972f]

            //       sm:text-[11px]
            //     "
            //   >
            //     Select Options
            //   </button>
            // ) : (
            ) : hasSizes ? (
  /* =============================================
     PRODUCT HAS SIZE

     SELECT OPTIONS -> PRODUCT DETAILS PAGE
  ============================================= */

  <Link
    to={`/products/${product.id}`}
    className="
      flex
      min-h-[46px]
      w-full

      items-center
      justify-center

      bg-[#D9A537]

      px-2
      py-2

      text-center
      text-[14px]
      font-bold
      uppercase
      leading-4

      text-[#243346]

      transition

      hover:bg-[#c6972f]

      sm:text-[14px]
    "
  >
    Select Options
  </Link>
) : (
              /* =============================================
                 PRODUCT DOES NOT HAVE SIZE

                 ADD TO CART
              ============================================= */

              <button
                type="button"
                onClick={
                  directAdd
                }
                disabled={
                  adding
                }
                className="
                  flex
                  min-h-[46px]
                  w-full

                  items-center
                  justify-center

                  bg-[#D9A537]

                  px-2
                  py-2

                  text-center
                  text-[10px]
                  font-bold
                  uppercase
                  leading-4

                  text-[#243346]

                  transition

                  hover:bg-[#c6972f]

                  disabled:cursor-not-allowed
                  disabled:opacity-60

                  sm:text-[11px]
                "
              >
                {adding
                  ? "Adding..."
                  : "Add to Cart"}
              </button>
            )}

            {/* ===============================================
                QUICK VIEW
            =============================================== */}

            <button
              type="button"
              onClick={() =>
                setQuickOpen(
                  true
                )
              }
              className="
                flex
                min-h-[46px]
                w-full

                items-center
                justify-center

                border
                border-[#243346]

                bg-[#243346]

                px-2
                py-2

                text-center
                text-[10px]
                font-bold
                uppercase
                leading-4

                text-white

                transition

                hover:border-[#D9A537]
                hover:bg-[#D9A537]
                hover:text-[#243346]

                sm:text-[11px]
              "
            >
              Quick View
            </button>
          </div>
        </div>
      </article>

      {/* =================================================
          QUICK VIEW
      ================================================= */}

      <QuickViewModal
        product={product}
        open={quickOpen}
        onClose={() =>
          setQuickOpen(false)
        }
      />
    </>
  );
}





// import {
//   useEffect,
//   useMemo,
//   useState,
// } from "react";

// import {
//   Link,
// } from "react-router-dom";

// import {
//   useCart,
// } from "../context/CartContext";

// import {
//   getProductById,
// } from "../services/productService";

// import {
//   toDetailProduct,
// } from "../utils/productAdapter";

// import QuickViewModal
//   from "./QuickViewModal";

// /* =========================================================
//    MONEY
// ========================================================= */

// function money(value) {
//   if (
//     value == null ||
//     value === "" ||
//     Number.isNaN(Number(value))
//   ) {
//     return "";
//   }

//   return `₹${Number(value).toFixed(2)}`;
// }

// /* =========================================================
//    CATEGORY

//    From:
//    Boys, Grade 1-2, Nursery...

//    Display:
//    Boys
// ========================================================= */

// function shortCategory(value = "") {
//   const parts = String(value)
//     .split(",")
//     .map((item) => item.trim())
//     .filter(Boolean);

//   return (
//     parts.find((item) =>
//       /^(boys|girls|boys\/girls)$/i.test(item)
//     ) ||
//     parts[0] ||
//     ""
//   );
// }

// /* =========================================================
//    PRODUCT CARD
// ========================================================= */

// export default function ProductCard({
//   product,showPrice = true,
// }) {
//   const {
//     addToCart,
//   } = useCart();

//   const [
//     detailProduct,
//     setDetailProduct,
//   ] = useState(null);

//   const [
//     checkingOptions,
//     setCheckingOptions,
//   ] = useState(true);

//   const [
//     adding,
//     setAdding,
//   ] = useState(false);

//   const [
//     quickOpen,
//     setQuickOpen,
//   ] = useState(false);

//   /* =======================================================
//      LOAD FULL PRODUCT

//      Important because product list does not always contain
//      variation / size information.
//   ======================================================= */

//   useEffect(() => {
//     let cancelled = false;

//     const loadProductDetails =
//       async () => {
//         try {
//           setCheckingOptions(true);

//           const response =
//             await getProductById(
//               product.id
//             );

//           if (!cancelled) {
//             const mapped =
//               toDetailProduct(
//                 response
//               );

//             setDetailProduct(
//               mapped
//             );
//           }
//         } catch (error) {
//           console.error(
//             "Unable to load product details:",
//             error
//           );

//           if (!cancelled) {
//             setDetailProduct(
//               null
//             );
//           }
//         } finally {
//           if (!cancelled) {
//             setCheckingOptions(
//               false
//             );
//           }
//         }
//       };

//     loadProductDetails();

//     return () => {
//       cancelled = true;
//     };
//   }, [product.id]);

//   /* =======================================================
//      SIZE CHECK

//      More reliable check.

//      Product with actual size variation:
//      SELECT OPTIONS

//      Product without size:
//      ADD TO CART
//   ======================================================= */

//  const hasSizes =
//   String(
//     product?.productType || ""
//   ).toLowerCase() === "variable" ||
//   String(
//     detailProduct?.productType || ""
//   ).toLowerCase() === "variable" ||
//   Boolean(
//     detailProduct?.hasSizes
//   ) ||
//   (
//     Array.isArray(
//       detailProduct?.sizes
//     ) &&
//     detailProduct.sizes.length > 0
//   ) ||
//   (
//     Array.isArray(
//       detailProduct?.variations
//     ) &&
//     detailProduct.variations.some(
//       (variation) =>
//         String(
//           variation?.size || ""
//         ).trim() !== ""
//     )
//   );

//   /* =======================================================
//      PRICE

//      First use detailed product price.

//      If detail API has not loaded yet,
//      use list API price.

//      This fixes prices disappearing from cards.
//   ======================================================= */

//   const minPrice =
//     detailProduct?.minPrice ??
//     detailProduct?.price ??
//     product.minPrice ??
//     product.price ??
//     null;

//   const maxPrice =
//     detailProduct?.maxPrice ??
//     product.maxPrice ??
//     minPrice;

//   const priceText =
//     minPrice == null
//       ? ""
//       : maxPrice != null &&
//         Number(maxPrice) !==
//           Number(minPrice)
//       ? `${money(minPrice)} – ${money(maxPrice)}`
//       : money(minPrice);

//   /* =======================================================
//      CATEGORY
//   ======================================================= */

//   const categoryLabel =
//     useMemo(
//       () =>
//         shortCategory(
//           detailProduct?.category ||
//             product.category ||
//             ""
//         ),
//       [
//         detailProduct?.category,
//         product.category,
//       ]
//     );

//   /* =======================================================
//      STOCK
//   ======================================================= */

//   const isOutOfStock =
//     Boolean(
//       detailProduct
//         ?.isOutOfStock
//     ) ||
//     Boolean(
//       product
//         ?.isOutOfStock
//     ) ||
//     product
//       ?.stockStatus ===
//       "outofstock";

//   /* =======================================================
//      IMAGE
//   ======================================================= */

//   const productImage =
//     detailProduct?.image ||
//     product.image ||
//     "";

//   /* =======================================================
//      DIRECT ADD TO CART

//      ONLY SIMPLE PRODUCT
//   ======================================================= */

//   const directAdd =
//     async () => {
//       if (
//         adding ||
//         isOutOfStock
//       ) {
//         return;
//       }

//       setAdding(true);

//       try {
//         let current =
//           detailProduct;

//         /*
//          * Safety fallback.
//          */
//         if (!current) {
//           const response =
//             await getProductById(
//               product.id
//             );

//           current =
//             toDetailProduct(
//               response
//             );

//           setDetailProduct(
//             current
//           );
//         }

//         /*
//          * Double-check sizes before
//          * directly adding.
//          */
//        const currentHasSizes =
//   String(
//     current?.productType || ""
//   ).toLowerCase() === "variable" ||
//   String(
//     product?.productType || ""
//   ).toLowerCase() === "variable" ||
//   Boolean(
//     current?.hasSizes
//   ) ||
//   (
//     Array.isArray(
//       current?.sizes
//     ) &&
//     current.sizes.length > 0
//   ) ||
//   (
//     Array.isArray(
//       current?.variations
//     ) &&
//     current.variations.some(
//       (variation) =>
//         String(
//           variation?.size || ""
//         ).trim() !== ""
//     )
//   );

//         /*
//          * If size exists,
//          * don't directly add.
//          *
//          * Open Quick View so
//          * customer can select size.
//          */
//         if (
//           currentHasSizes
//         ) {
//           setQuickOpen(
//             true
//           );

//           return;
//         }

//         const cartPrice =
//           current?.price ??
//           current?.minPrice ??
//           product.price ??
//           product.minPrice;

//         /*
//          * Keep your existing
//          * CartContext flow.
//          */
//         await addToCart(
//           current,
//           "",
//           cartPrice
//         );
//       } catch (error) {
//         console.error(
//           "Add to cart failed:",
//           error
//         );
//       } finally {
//         setAdding(
//           false
//         );
//       }
//     };

//   return (
//     <>
//       {/* =================================================
//           PRODUCT

//           No white card background.
//           No card border.
//           No card shadow.
//       ================================================= */}

//       <article
//         className="
//           group/product
//           flex
//           h-full
//           min-w-0
//           flex-col
//         "
//       >
//         {/* =================================================
//             PRODUCT IMAGE
//         ================================================= */}

//         <Link
//           to={`/products/${product.id}`}
//           aria-label={`View ${product.name}`}
//           className="
//             block
//             w-full
//           "
//         >
//           <div
//             className="
//               relative

//               flex
//               aspect-square
//               w-full

//               items-center
//               justify-center

//               overflow-hidden

//               bg-white
//             "
//           >
//             {productImage ? (
//               <img
//                 src={productImage}
//                 alt={product.name}
//                 className="
//                   h-full
//                   w-full

//                   object-contain

//                   transition
//                   duration-300

//                   group-hover/product:scale-[1.02]
//                 "
//               />
//             ) : (
//               <div
//                 className="
//                   flex
//                   h-full
//                   w-full

//                   items-center
//                   justify-center

//                   text-sm
//                   text-slate-400
//                 "
//               >
//                 No image
//               </div>
//             )}

//             {isOutOfStock && (
//               <span
//                 className="
//                   absolute
//                   left-3
//                   top-3

//                   bg-[#243346]

//                   px-3
//                   py-1.5

//                   text-[10px]
//                   font-bold
//                   uppercase

//                   text-white
//                 "
//               >
//                 Out of Stock
//               </span>
//             )}
//           </div>
//         </Link>

//         {/* =================================================
//             PRODUCT DETAILS
//         ================================================= */}

//         <div
//           className="
//             flex
//             flex-1
//             flex-col

//             px-1
//             pt-4

//             text-center
//           "
//         >
//           {/* PRODUCT NAME */}

//          <Link
//   to={`/products/${product.id}`}
//   className="
//     line-clamp-2
//     text-[14px]
//     font-extrabold
//     leading-[21px]
//     text-[#243346]
//     transition
//     hover:text-[#D9A537]
//     sm:text-[15px]
//   "
// >
//   {product.name}
// </Link>

//           {/* CATEGORY */}
// {categoryLabel && (
//   <p
//     className="
//       mt-1
//       text-[16px]
//       font-normal
//       text-slate-500
//     "
//   >
//     {categoryLabel}
//   </p>
// )}

//           {/* =================================================
//               PRICE
//           ================================================= */}
//           {showPrice && priceText && (
//   <p
//     className="
//       mt-1.5
//       text-[14px]
//       font-extrabold
//       text-[#D9A537]
//     "
//   >
//     {priceText}
//   </p>
// )}

//           {/* =================================================
//               BUTTONS

//               SIDE BY SIDE
//           ================================================= */}

//           <div
//             className="
//               mt-auto

//               grid
//               grid-cols-2
//               gap-2

//               pt-4
//             "
//           >
//             {/* ===============================================
//                 FIRST BUTTON
//             =============================================== */}

//             {checkingOptions ? (
//               <button
//                 type="button"
//                 disabled
//                 className="
//                   flex
//                   min-h-[46px]
//                   w-full

//                   items-center
//                   justify-center

//                   bg-[#D9A537]

//                   px-2
//                   py-2

//                   text-center
//                   text-[10px]
//                   font-bold
//                   uppercase
//                   leading-4

//                   text-[#243346]

//                   opacity-60

//                   sm:text-[11px]
//                 "
//               >
//                 Loading...
//               </button>
//             ) : isOutOfStock ? (
//               <button
//                 type="button"
//                 disabled
//                 className="
//                   flex
//                   min-h-[46px]
//                   w-full

//                   items-center
//                   justify-center

//                   bg-slate-300

//                   px-2
//                   py-2

//                   text-center
//                   text-[10px]
//                   font-bold
//                   uppercase

//                   text-slate-500

//                   sm:text-[11px]
//                 "
//               >
//                 Out of Stock
//               </button>
//             // ) : hasSizes ? (

//             //   <button
//             //     type="button"
//             //     onClick={() =>
//             //       setQuickOpen(
//             //         true
//             //       )
//             //     }
//             //     className="
//             //       flex
//             //       min-h-[46px]
//             //       w-full

//             //       items-center
//             //       justify-center

//             //       bg-[#D9A537]

//             //       px-2
//             //       py-2

//             //       text-center
//             //       text-[10px]
//             //       font-bold
//             //       uppercase
//             //       leading-4

//             //       text-[#243346]

//             //       transition

//             //       hover:bg-[#c6972f]

//             //       sm:text-[11px]
//             //     "
//             //   >
//             //     Select Options
//             //   </button>
//             // ) : (
//             ) : hasSizes ? (
//   /* =============================================
//      PRODUCT HAS SIZE

//      SELECT OPTIONS -> PRODUCT DETAILS PAGE
//   ============================================= */

//   <Link
//     to={`/products/${product.id}`}
//     className="
//       flex
//       min-h-[46px]
//       w-full

//       items-center
//       justify-center

//       bg-[#D9A537]

//       px-2
//       py-2

//       text-center
//       text-[14px]
//       font-bold
//       uppercase
//       leading-4

//       text-[#243346]

//       transition

//       hover:bg-[#c6972f]

//       sm:text-[14px]
//     "
//   >
//     Select Options
//   </Link>
// ) : (
//               /* =============================================
//                  PRODUCT DOES NOT HAVE SIZE

//                  ADD TO CART
//               ============================================= */

//               <button
//                 type="button"
//                 onClick={
//                   directAdd
//                 }
//                 disabled={
//                   adding
//                 }
//                 className="
//                   flex
//                   min-h-[46px]
//                   w-full

//                   items-center
//                   justify-center

//                   bg-[#D9A537]

//                   px-2
//                   py-2

//                   text-center
//                   text-[10px]
//                   font-bold
//                   uppercase
//                   leading-4

//                   text-[#243346]

//                   transition

//                   hover:bg-[#c6972f]

//                   disabled:cursor-not-allowed
//                   disabled:opacity-60

//                   sm:text-[11px]
//                 "
//               >
//                 {adding
//                   ? "Adding..."
//                   : "Add to Cart"}
//               </button>
//             )}

//             {/* ===============================================
//                 QUICK VIEW
//             =============================================== */}

//             <button
//               type="button"
//               onClick={() =>
//                 setQuickOpen(
//                   true
//                 )
//               }
//               className="
//                 flex
//                 min-h-[46px]
//                 w-full

//                 items-center
//                 justify-center

//                 border
//                 border-[#243346]

//                 bg-[#243346]

//                 px-2
//                 py-2

//                 text-center
//                 text-[10px]
//                 font-bold
//                 uppercase
//                 leading-4

//                 text-white

//                 transition

//                 hover:border-[#D9A537]
//                 hover:bg-[#D9A537]
//                 hover:text-[#243346]

//                 sm:text-[11px]
//               "
//             >
//               Quick View
//             </button>
//           </div>
//         </div>
//       </article>

//       {/* =================================================
//           QUICK VIEW
//       ================================================= */}

//       <QuickViewModal
//         product={product}
//         open={quickOpen}
//         onClose={() =>
//           setQuickOpen(false)
//         }
//       />
//     </>
//   );
// }



