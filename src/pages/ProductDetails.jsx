import {
  ArrowLeft,
  FileText,
  Minus,
  Plus,
  ShoppingCart,
  Zap,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import { useCart } from "../context/CartContext";

import {
  getProductById,
  getProducts,
} from "../services/productService";

import {
  toCardProduct,
  toDetailProduct,
} from "../utils/productAdapter";

import SizeSelectModal from "../components/SizeSelectModal";
import ProductCard from "../components/ProductCard";

export default function ProductDetails({
  requireAuth,
}) {
  const { id } = useParams();

  const navigate = useNavigate();

  const [searchParams] =
  useSearchParams();

const breadcrumbCategorySlug =
  searchParams.get("category") ||
  "";

  const { addToCart } = useCart();

  const [product, setProduct] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [related, setRelated] =
    useState([]);

  const [image, setImage] =
    useState("");

  const [
    selectedSize,
    setSelectedSize,
  ] = useState("");

  const [qty, setQty] =
    useState(1);

  const [open, setOpen] =
    useState(false);

  const [action, setAction] =
    useState("cart");

  /* =========================================
     LOAD PRODUCT
  ========================================= */

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      setLoading(true);

      setError(null);

      setRelated([]);

      try {
        const detail =
          await getProductById(id);

        if (cancelled) {
          return;
        }

        const mapped =
          toDetailProduct(detail);

        setProduct(mapped);

        setImage(
          mapped.image || ""
        );

        setSelectedSize("");

        setQty(1);

        /* ==================================
           RELATED PRODUCTS
        ================================== */

        if (
          mapped.categorySlug
        ) {
          try {
            const result =
              await getProducts({
                category:
                  mapped.categorySlug,

                limit: 5,

                sort: "date",

                dir: "desc",
              });

            if (!cancelled) {
              const relatedProducts =
                result.products
                  .filter(
                    (item) =>
                      item.id !==
                      mapped.id
                  )
                  .slice(0, 4)
                  .map((item) =>
                    toCardProduct(
                      item,
                      mapped.category
                    )
                  );

              setRelated(
                relatedProducts
              );
            }
          } catch {
            if (!cancelled) {
              setRelated([]);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Product not found"
          );

          setProduct(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <main className="container-site flex min-h-[50vh] items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D9A537] border-t-transparent" />
      </main>
    );
  }

  /* =========================================
     PRODUCT NOT FOUND
  ========================================= */

  if (!product || error) {
    return (
      <main className="container-site py-24 text-center">
        <h1 className="text-3xl font-black text-[#243346]">
          Product not found
        </h1>

        <Link
          to="/"
          className="btn-gold mt-6 inline-flex"
        >
          Back to Home
        </Link>
      </main>
    );
  }

  /* =========================================
     PRODUCT IMAGES
  ========================================= */

  const productImages =
    product.images?.filter(
      Boolean
    ) || [];

  /* =========================================
     SELECTED VARIATION
  ========================================= */

  const selectedVariation =
    product.variations?.find(
      (variation) =>
        String(
          variation.size
        ) ===
        String(
          selectedSize
        )
    );

  /* =========================================
     PRICE
  ========================================= */

  const displayedPrice =
    selectedVariation?.price ??
    product.minPrice ??
    product.price;

  const displayRange =
    !selectedSize &&
    product.minPrice != null &&
    product.maxPrice != null &&
    Number(
      product.minPrice
    ) !==
      Number(
        product.maxPrice
      )
      ? `₹${product.minPrice} - ₹${product.maxPrice}`
      : displayedPrice != null
      ? `₹${displayedPrice}`
      : "";


  /* =========================================================
   BREADCRUMB CATEGORY

   Use category passed from previous page first.
   Do NOT automatically prefer Boys/Girls.
========================================================= */

const productCategories =
  Array.isArray(
    product?.categories
  )
    ? product.categories
    : [];

const breadcrumbCategory =
  productCategories.find(
    (category) =>
      String(
        category?.slug || ""
      ).toLowerCase() ===
      String(
        breadcrumbCategorySlug || ""
      ).toLowerCase()
  ) ||
  productCategories[0] ||
  null;
  /* =========================================
     ADD PRODUCT TO CART
  ========================================= */

  const addCurrentProduct =
    () => {
      if (
        product.isOutOfStock
      ) {
        return false;
      }

      if (product.hasSizes) {
        if (!selectedSize) {
          return false;
        }

        if (!selectedVariation) {
          return false;
        }

        if (
          selectedVariation.stockStatus ===
          "outofstock"
        ) {
          return false;
        }

        for (
          let i = 0;
          i < qty;
          i++
        ) {
          addToCart(
            product,
            selectedSize,
            selectedVariation.price
          );
        }

        return true;
      }

      for (
        let i = 0;
        i < qty;
        i++
      ) {
        addToCart(
          product,
          "",
          product.price ??
            product.minPrice
        );
      }

      return true;
    };

  /* =========================================
     ADD TO CART / BUY NOW
  ========================================= */

  const proceed = (type) => {
    if (
      product.isOutOfStock
    ) {
      return;
    }

    setAction(type);

    if (
      product.hasSizes &&
      !selectedSize
    ) {
      setOpen(true);

      return;
    }

    const added =
      addCurrentProduct();

    if (!added) {
      return;
    }

    if (type === "buy") {
      navigate("/cart");
    }
  };

  /* =========================================
     SIZE MODAL CONFIRM
  ========================================= */

  const confirm = () => {
    if (!selectedSize) {
      return;
    }

    const added =
      addCurrentProduct();

    if (!added) {
      return;
    }

    setOpen(false);

    if (
      action === "buy"
    ) {
      navigate("/cart");
    }
  };


  const categoryText =
  Array.isArray(
    product?.categories
  ) &&
  product.categories.length > 0
    ? product.categories
        .map(
          (item) =>
            item?.name || ""
        )
        .filter(Boolean)
        .join(", ")
    : product?.category ||
      "";

const tagText =
  Array.isArray(
    product?.tags
  )
    ? product.tags
        .map((item) => {
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
        })
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <main className="bg-white">
      <div
  className="
    mx-auto
    w-full
    max-w-[1480px]
    px-4
    pt-8

    sm:px-6
    sm:pt-10

    lg:px-8
    lg:pt-12
  "
>
  <div
    className="
      flex
      flex-wrap
      items-center
      gap-1.5
      text-sm
    "
  >
    <Link
      to="/"
      className="
        text-slate-400
        transition
        hover:text-[#D9A537]
      "
    >
      Home
    </Link>

    {breadcrumbCategory && (
      <>
        <span
          className="
            text-slate-400
          "
        >
          ›
        </span>

        <Link
          to={`/category/${breadcrumbCategory.slug}`}
          className="
            text-slate-400
            transition
            hover:text-[#D9A537]
          "
        >
          {breadcrumbCategory.name}
        </Link>
      </>
    )}

    <span
      className="
        text-slate-400
      "
    >
      ›
    </span>

    <span
      className="
        font-medium
        text-[#243346]
      "
    >
      {product.name}
    </span>
  </div>
</div>

      {/* =====================================
          PRODUCT MAIN SECTION
      ===================================== */}

      {/* <div className="container-site py-7 sm:py-10 lg:py-12"> */}
      {/* <div className="container-site pb-10 pt-6 sm:pb-12 sm:pt-7 lg:pb-14 lg:pt-8"> */}
      <div
  className="
    mx-auto
    w-full
    max-w-[1480px]
    px-4
    pb-10
    pt-6

    sm:px-6
    sm:pb-12
    sm:pt-7

    lg:px-8
    lg:pb-14
    lg:pt-8
  "
>

        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#D9A537]"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-14">

          {/* =================================
              LEFT IMAGE SECTION
          ================================= */}

          <div className="lg:sticky lg:top-24">

            <div className="relative overflow-hidden rounded-3xl bg-slate-100">

              {image && (
                <img
                  src={image}
                  alt={
                    product.name
                  }
                  className="h-[380px] w-full object-cover transition duration-500 sm:h-[500px] md:h-[560px] lg:h-[600px]"
                />
              )}

              {product.isOutOfStock && (
                <span className="absolute left-4 top-4 rounded-full bg-[#243346] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white">
                  Out of Stock
                </span>
              )}
            </div>

            {/* GALLERY */}

            {productImages.length >
              0 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">

                {productImages.map(
                  (
                    img,
                    index
                  ) => (
                    <button
                      key={`${img}-${index}`}
                      type="button"
                      onClick={() =>
                        setImage(
                          img
                        )
                      }
                      className={`shrink-0 overflow-hidden rounded-xl border-2 transition ${
                        image ===
                        img
                          ? "border-[#D9A537]"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} ${
                          index + 1
                        }`}
                        className="h-20 w-20 object-cover sm:h-24 sm:w-24"
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* =================================
              RIGHT CONTENT SECTION
          ================================= */}

          <div>

            {/* {product.category && (
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#D9A537]">
                {product.category}
              </p>
            )} */}
            {categoryText && (
              <p
                className="
                  text-xs
                  font-extrabold
                  uppercase
                  tracking-[.18em]
                  text-[#D9A537]
                "
              >
                {categoryText}
              </p>
            )}

            <h1 className="mt-2 text-3xl font-black leading-tight text-[#243346] sm:text-4xl lg:text-[40px]">
              {product.name}
            </h1>

            {/* PRICE */}

            <div className="mt-5 flex flex-wrap items-center gap-3">

              <b className="text-3xl text-[#243346]">
                {displayRange}
              </b>

            </div>

            {/* =================================
                SIZE
            ================================= */}

            {product.hasSizes && (
              <div className="mt-7">

                <div className="flex items-center justify-between">

                  <label className="text-sm font-extrabold text-[#243346]">
                    Select Size
                  </label>

                  <span className="text-xs font-semibold text-slate-400">
                    Required
                  </span>

                </div>

                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-7">

                  {/* {product.sizes.map(
                    (size) => { */}
                    {[...product.sizes]
                      .sort((a, b) => Number(a) - Number(b))
                      .map((size) => {
                      const variation =
                        product.variations?.find(
                          (
                            item
                          ) =>
                            String(
                              item.size
                            ) ===
                            String(
                              size
                            )
                        );

                      const unavailable =
                        variation?.stockStatus ===
                        "outofstock";

                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={
                            unavailable
                          }
                          onClick={() => {
                            if (
                              !unavailable
                            ) {
                              setSelectedSize(
                                size
                              );
                            }
                          }}
                          className={`rounded-xl border px-2 py-3 text-sm font-bold transition ${
                            unavailable
                              ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                              : selectedSize ===
                                size
                              ? "border-[#D9A537] bg-[#D9A537] text-[#243346]"
                              : "border-slate-200 bg-white text-[#243346] hover:border-[#D9A537]"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    }
                  )}
                </div>

                {!selectedSize && (
                  <p className="mt-2 text-xs font-semibold text-slate-400">
                    Please select a size before adding to cart.
                  </p>
                )}

              </div>
            )}

            {/* =================================
                QUANTITY
            ================================= */}

            <div className="mt-6 flex items-center gap-3">

              <span className="text-sm font-extrabold text-[#243346]">
                Quantity
              </span>

              <div className="flex items-center rounded-xl border border-slate-200">

                <button
                  type="button"
                  onClick={() =>
                    setQty(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                    )
                  }
                  className="p-3 text-[#243346] transition hover:text-[#D9A537]"
                >
                  <Minus size={16} />
                </button>

                <span className="w-10 text-center font-bold text-[#243346]">
                  {qty}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQty(
                      (current) =>
                        current + 1
                    )
                  }
                  className="p-3 text-[#243346] transition hover:text-[#D9A537]"
                >
                  <Plus size={16} />
                </button>

              </div>
            </div>

            {/* =================================
                BUTTONS
            ================================= */}

            <div className="mt-7 grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() =>
                  proceed(
                    "cart"
                  )
                }
                disabled={
                  product.isOutOfStock
                }
                className="btn-gold px-3 text-sm sm:px-5 sm:text-base disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>

              <button
                type="button"
                onClick={() =>
                  proceed(
                    "buy"
                  )
                }
                disabled={
                  product.isOutOfStock
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#243346] px-3 py-3.5 text-sm font-bold text-white transition hover:bg-[#1E2E3E] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:text-base"
              >
                <Zap size={18} />
                Buy Now
              </button>

            </div>

            {/* =================================
                PRODUCT DETAILS
                NO BORDER
                NO OPEN/CLOSE
            ================================= */}

            <div className="mt-8 py-2">

              <div className="flex items-center gap-2">

                <FileText
                  size={19}
                  className="text-[#D9A537]"
                />

                <h2 className="text-lg font-black text-[#243346]">
                  Product Details
                </h2>

              </div>

              {/* DESCRIPTION */}

              <div className="mt-4">

                <p className="text-[15px] leading-7 text-slate-600">
                  {product.description ||
                    product.shortDescription ||
                    product.short_description ||
                    `${product.name} from the school uniform collection.`}
                </p>

              </div>

              {/* CATEGORY + SKU */}

              <div className="mt-5">

                <div className="flex flex-wrap items-center gap-2 text-sm">

                  <span className="font-extrabold text-[#243346]">
                    Category:
                  </span>

                  <span className="text-slate-600">
                    {product.category ||
                      "Uncategorized"}
                  </span>

                </div>

                  {/* TAGS */}

                  {tagText && (
                    <div
                      className="
                        mt-2
                        flex
                        flex-wrap
                        items-start
                        gap-2
                        text-sm
                      "
                    >
                      <span
                        className="
                          font-extrabold
                          text-[#243346]
                        "
                      >
                        Tags:
                      </span>

                      <span
                        className="
                          text-slate-600
                        "
                      >
                        {tagText}
                      </span>
                    </div>
                  )}

                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">

                  <span className="font-extrabold text-[#243346]">
                    SKU:
                  </span>

                  <span className="text-slate-600">
                    {product.sku ||
                      "N/A"}
                  </span>

                </div>

              </div>

            </div>

            {/* SIZE GUIDE REMOVED */}

            {/* DELIVERY REMOVED */}

          </div>
        </div>
      </div>

      {/* =====================================
          ADDITIONAL INFORMATION
      ===================================== */}

      {product.sizes?.length > 0 && (
        <section className="bg-white pb-8 sm:pb-10">

          {/* <div className="container-site"> */}
          <div
  className="
    mx-auto
    w-full
    max-w-[1480px]
    px-4

    sm:px-6

    lg:px-8
  "
>

            {/* TITLE WITH LEFT + RIGHT LINES */}

            <div className="flex items-center gap-4">

              <div className="h-px flex-1 bg-slate-200" />

              <h2
                className="
                  border-b-2
                  border-[#D9A537]
                  pb-2
                  text-center
                  text-base
                  font-black
                  text-[#D9A537]
                  sm:text-lg
                "
              >
                Additional Information
              </h2>

              <div className="h-px flex-1 bg-slate-200" />

            </div>

            {/* INFORMATION TABLE */}

            <div
              className="
                mx-auto
                mt-7
                max-w-5xl
                overflow-hidden
                border
                border-slate-200
                bg-[#f3f3f3]
              "
            >

              <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[170px_1fr]">

                {/* LABEL */}

                <div
                  className="
                    border-r
                    border-slate-200
                    px-5
                    py-4
                    text-base
                    font-black
                    text-[#243346]
                  "
                >
                  size
                </div>

                {/* VALUES */}

                <div
                  className="
                    px-5
                    py-4
                    text-base
                    leading-6
                    text-slate-600
                  "
                >
                  {/* {product.sizes.join(", ")} */}
                  {[...product.sizes]
                    .sort((a, b) => Number(a) - Number(b))
                    .join(", ")}
                </div>

              </div>

            </div>

          </div>

        </section>
      )}

      {/* =====================================
          RELATED PRODUCTS
      ===================================== */}

      {related.length > 0 && (
        <section className="bg-white py-12 sm:py-16">

          {/* <div className="container-site"> */}
          <div
  className="
    mx-auto
    w-full
    max-w-[1480px]
    px-4

    sm:px-6

    lg:px-8
  "
>

            {/* CENTER HEADING */}

            <div className="mb-8 text-center">

              <h2 className="text-2xl font-black text-[#243346] sm:text-3xl">
                Related Products
              </h2>

            </div>

            {/* PRODUCTS */}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">

              {related.map(
                (item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    requireAuth={
                      requireAuth
                    }
                  />
                )
              )}

            </div>

          </div>

        </section>
      )}

      {/* RECENTLY VIEWED REMOVED */}

      {/* =====================================
          SIZE SELECT MODAL
      ===================================== */}

      <SizeSelectModal
        product={product}
        open={open}
        size={selectedSize}
        setSize={
          setSelectedSize
        }
        onConfirm={
          confirm
        }
        onClose={() =>
          setOpen(false)
        }
        action={
          action === "buy"
            ? "Continue to Cart"
            : "Select Size & Add to Cart"
        }
      />

    </main>
  );
}




// import {
//   ArrowLeft,
//   FileText,
//   Minus,
//   Plus,
//   ShoppingCart,
//   Zap,
// } from "lucide-react";

// import {
//   Link,
//   useNavigate,
//   useParams,
// } from "react-router-dom";

// import {
//   useEffect,
//   useState,
// } from "react";

// import { useCart } from "../context/CartContext";

// import {
//   getProductById,
//   getProducts,
// } from "../services/productService";

// import {
//   toCardProduct,
//   toDetailProduct,
// } from "../utils/productAdapter";

// import SizeSelectModal from "../components/SizeSelectModal";
// import ProductCard from "../components/ProductCard";

// export default function ProductDetails({
//   requireAuth,
// }) {
//   const { id } = useParams();

//   const navigate = useNavigate();

//   const { addToCart } = useCart();

//   const [product, setProduct] =
//     useState(null);

//   const [loading, setLoading] =
//     useState(true);

//   const [error, setError] =
//     useState(null);

//   const [related, setRelated] =
//     useState([]);

//   const [image, setImage] =
//     useState("");

//   const [
//     selectedSize,
//     setSelectedSize,
//   ] = useState("");

//   const [qty, setQty] =
//     useState(1);

//   const [open, setOpen] =
//     useState(false);

//   const [action, setAction] =
//     useState("cart");

//   /* =========================================
//      LOAD PRODUCT
//   ========================================= */

//   useEffect(() => {
//     let cancelled = false;

//     const loadProduct = async () => {
//       setLoading(true);

//       setError(null);

//       setRelated([]);

//       try {
//         const detail =
//           await getProductById(id);

//         if (cancelled) {
//           return;
//         }

//         const mapped =
//           toDetailProduct(detail);

//         setProduct(mapped);

//         setImage(
//           mapped.image || ""
//         );

//         setSelectedSize("");

//         setQty(1);

//         /* ==================================
//            RELATED PRODUCTS
//         ================================== */

//         if (
//           mapped.categorySlug
//         ) {
//           try {
//             const result =
//               await getProducts({
//                 category:
//                   mapped.categorySlug,

//                 limit: 5,

//                 sort: "date",

//                 dir: "desc",
//               });

//             if (!cancelled) {
//               const relatedProducts =
//                 result.products
//                   .filter(
//                     (item) =>
//                       item.id !==
//                       mapped.id
//                   )
//                   .slice(0, 4)
//                   .map((item) =>
//                     toCardProduct(
//                       item,
//                       mapped.category
//                     )
//                   );

//               setRelated(
//                 relatedProducts
//               );
//             }
//           } catch {
//             if (!cancelled) {
//               setRelated([]);
//             }
//           }
//         }
//       } catch (err) {
//         if (!cancelled) {
//           setError(
//             err.message ||
//               "Product not found"
//           );

//           setProduct(null);
//         }
//       } finally {
//         if (!cancelled) {
//           setLoading(false);
//         }
//       }
//     };

//     loadProduct();

//     return () => {
//       cancelled = true;
//     };
//   }, [id]);

//   /* =========================================
//      LOADING
//   ========================================= */

//   if (loading) {
//     return (
//       <main className="container-site flex min-h-[50vh] items-center justify-center py-24">
//         <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D9A537] border-t-transparent" />
//       </main>
//     );
//   }

//   /* =========================================
//      PRODUCT NOT FOUND
//   ========================================= */

//   if (!product || error) {
//     return (
//       <main className="container-site py-24 text-center">
//         <h1 className="text-3xl font-black text-[#243346]">
//           Product not found
//         </h1>

//         <Link
//           to="/"
//           className="btn-gold mt-6 inline-flex"
//         >
//           Back to Home
//         </Link>
//       </main>
//     );
//   }

//   /* =========================================
//      PRODUCT IMAGES
//   ========================================= */

//   const productImages =
//     product.images?.filter(
//       Boolean
//     ) || [];

//   /* =========================================
//      SELECTED VARIATION
//   ========================================= */

//   const selectedVariation =
//     product.variations?.find(
//       (variation) =>
//         String(
//           variation.size
//         ) ===
//         String(
//           selectedSize
//         )
//     );

//   /* =========================================
//      PRICE
//   ========================================= */

//   const displayedPrice =
//     selectedVariation?.price ??
//     product.minPrice ??
//     product.price;

//   const displayRange =
//     !selectedSize &&
//     product.minPrice != null &&
//     product.maxPrice != null &&
//     Number(
//       product.minPrice
//     ) !==
//       Number(
//         product.maxPrice
//       )
//       ? `₹${product.minPrice} - ₹${product.maxPrice}`
//       : displayedPrice != null
//       ? `₹${displayedPrice}`
//       : "";

//   /* =========================================
//      ADD PRODUCT TO CART
//   ========================================= */

//   const addCurrentProduct =
//     () => {
//       if (
//         product.isOutOfStock
//       ) {
//         return false;
//       }

//       if (product.hasSizes) {
//         if (!selectedSize) {
//           return false;
//         }

//         if (!selectedVariation) {
//           return false;
//         }

//         if (
//           selectedVariation.stockStatus ===
//           "outofstock"
//         ) {
//           return false;
//         }

//         for (
//           let i = 0;
//           i < qty;
//           i++
//         ) {
//           addToCart(
//             product,
//             selectedSize,
//             selectedVariation.price
//           );
//         }

//         return true;
//       }

//       for (
//         let i = 0;
//         i < qty;
//         i++
//       ) {
//         addToCart(
//           product,
//           "",
//           product.price ??
//             product.minPrice
//         );
//       }

//       return true;
//     };

//   /* =========================================
//      ADD TO CART / BUY NOW
//   ========================================= */

//   const proceed = (type) => {
//     if (
//       product.isOutOfStock
//     ) {
//       return;
//     }

//     setAction(type);

//     if (
//       product.hasSizes &&
//       !selectedSize
//     ) {
//       setOpen(true);

//       return;
//     }

//     const added =
//       addCurrentProduct();

//     if (!added) {
//       return;
//     }

//     if (type === "buy") {
//       navigate("/cart");
//     }
//   };

//   /* =========================================
//      SIZE MODAL CONFIRM
//   ========================================= */

//   const confirm = () => {
//     if (!selectedSize) {
//       return;
//     }

//     const added =
//       addCurrentProduct();

//     if (!added) {
//       return;
//     }

//     setOpen(false);

//     if (
//       action === "buy"
//     ) {
//       navigate("/cart");
//     }
//   };


//   const categoryText =
//   Array.isArray(
//     product?.categories
//   ) &&
//   product.categories.length > 0
//     ? product.categories
//         .map(
//           (item) =>
//             item?.name || ""
//         )
//         .filter(Boolean)
//         .join(", ")
//     : product?.category ||
//       "";

// const tagText =
//   Array.isArray(
//     product?.tags
//   )
//     ? product.tags
//         .map((item) => {
//           if (
//             typeof item ===
//             "string"
//           ) {
//             return item;
//           }

//           return (
//             item?.name ||
//             item?.slug ||
//             ""
//           );
//         })
//         .filter(Boolean)
//         .join(", ")
//     : "";

//   return (
//     <main className="bg-white">
// {/* <div className="container-site pt-8 sm:pt-10 lg:pt-12"> */}
// <div
//   className="
//     mx-auto
//     w-full
//     max-w-[1480px]
//     px-4
//     pt-8

//     sm:px-6
//     sm:pt-10

//     lg:px-8
//     lg:pt-12
//   "
// >

//   <div className="flex flex-wrap items-center gap-1.5 text-sm">

//     <Link
//       to="/"
//       className="text-slate-400 transition hover:text-[#D9A537]"
//     >
//       Home
//     </Link>

//     <span className="text-slate-400">
//       ›
//     </span>

//     <Link
//       to="/collections"
//       className="text-slate-400 transition hover:text-[#D9A537]"
//     >
//       Uniforms
//     </Link>

//     <span className="text-slate-400">
//       ›
//     </span>

//     <span className="font-medium text-[#243346]">
//       {product.name}
//     </span>

//   </div>

// </div>

//       {/* =====================================
//           PRODUCT MAIN SECTION
//       ===================================== */}

//       {/* <div className="container-site py-7 sm:py-10 lg:py-12"> */}
//       {/* <div className="container-site pb-10 pt-6 sm:pb-12 sm:pt-7 lg:pb-14 lg:pt-8"> */}
//       <div
//   className="
//     mx-auto
//     w-full
//     max-w-[1480px]
//     px-4
//     pb-10
//     pt-6

//     sm:px-6
//     sm:pb-12
//     sm:pt-7

//     lg:px-8
//     lg:pb-14
//     lg:pt-8
//   "
// >

//         <Link
//           to="/"
//           className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#D9A537]"
//         >
//           <ArrowLeft size={16} />
//           Back to Home
//         </Link>

//         <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-14">

//           {/* =================================
//               LEFT IMAGE SECTION
//           ================================= */}

//           <div className="lg:sticky lg:top-24">

//             <div className="relative overflow-hidden rounded-3xl bg-slate-100">

//               {image && (
//                 <img
//                   src={image}
//                   alt={
//                     product.name
//                   }
//                   className="h-[380px] w-full object-cover transition duration-500 sm:h-[500px] md:h-[560px] lg:h-[600px]"
//                 />
//               )}

//               {product.isOutOfStock && (
//                 <span className="absolute left-4 top-4 rounded-full bg-[#243346] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white">
//                   Out of Stock
//                 </span>
//               )}
//             </div>

//             {/* GALLERY */}

//             {productImages.length >
//               0 && (
//               <div className="mt-4 flex gap-3 overflow-x-auto pb-1">

//                 {productImages.map(
//                   (
//                     img,
//                     index
//                   ) => (
//                     <button
//                       key={`${img}-${index}`}
//                       type="button"
//                       onClick={() =>
//                         setImage(
//                           img
//                         )
//                       }
//                       className={`shrink-0 overflow-hidden rounded-xl border-2 transition ${
//                         image ===
//                         img
//                           ? "border-[#D9A537]"
//                           : "border-transparent"
//                       }`}
//                     >
//                       <img
//                         src={img}
//                         alt={`${product.name} ${
//                           index + 1
//                         }`}
//                         className="h-20 w-20 object-cover sm:h-24 sm:w-24"
//                       />
//                     </button>
//                   )
//                 )}
//               </div>
//             )}
//           </div>

//           {/* =================================
//               RIGHT CONTENT SECTION
//           ================================= */}

//           <div>

//             {/* {product.category && (
//               <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#D9A537]">
//                 {product.category}
//               </p>
//             )} */}
//             {categoryText && (
//               <p
//                 className="
//                   text-xs
//                   font-extrabold
//                   uppercase
//                   tracking-[.18em]
//                   text-[#D9A537]
//                 "
//               >
//                 {categoryText}
//               </p>
//             )}

//             <h1 className="mt-2 text-3xl font-black leading-tight text-[#243346] sm:text-4xl lg:text-[40px]">
//               {product.name}
//             </h1>

//             {/* PRICE */}

//             <div className="mt-5 flex flex-wrap items-center gap-3">

//               <b className="text-3xl text-[#243346]">
//                 {displayRange}
//               </b>

//             </div>

//             {/* =================================
//                 SIZE
//             ================================= */}

//             {product.hasSizes && (
//               <div className="mt-7">

//                 <div className="flex items-center justify-between">

//                   <label className="text-sm font-extrabold text-[#243346]">
//                     Select Size
//                   </label>

//                   <span className="text-xs font-semibold text-slate-400">
//                     Required
//                   </span>

//                 </div>

//                 <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-7">

//                   {/* {product.sizes.map(
//                     (size) => { */}
//                     {[...product.sizes]
//                       .sort((a, b) => Number(a) - Number(b))
//                       .map((size) => {
//                       const variation =
//                         product.variations?.find(
//                           (
//                             item
//                           ) =>
//                             String(
//                               item.size
//                             ) ===
//                             String(
//                               size
//                             )
//                         );

//                       const unavailable =
//                         variation?.stockStatus ===
//                         "outofstock";

//                       return (
//                         <button
//                           key={size}
//                           type="button"
//                           disabled={
//                             unavailable
//                           }
//                           onClick={() => {
//                             if (
//                               !unavailable
//                             ) {
//                               setSelectedSize(
//                                 size
//                               );
//                             }
//                           }}
//                           className={`rounded-xl border px-2 py-3 text-sm font-bold transition ${
//                             unavailable
//                               ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
//                               : selectedSize ===
//                                 size
//                               ? "border-[#D9A537] bg-[#D9A537] text-[#243346]"
//                               : "border-slate-200 bg-white text-[#243346] hover:border-[#D9A537]"
//                           }`}
//                         >
//                           {size}
//                         </button>
//                       );
//                     }
//                   )}
//                 </div>

//                 {!selectedSize && (
//                   <p className="mt-2 text-xs font-semibold text-slate-400">
//                     Please select a size before adding to cart.
//                   </p>
//                 )}

//               </div>
//             )}

//             {/* =================================
//                 QUANTITY
//             ================================= */}

//             <div className="mt-6 flex items-center gap-3">

//               <span className="text-sm font-extrabold text-[#243346]">
//                 Quantity
//               </span>

//               <div className="flex items-center rounded-xl border border-slate-200">

//                 <button
//                   type="button"
//                   onClick={() =>
//                     setQty(
//                       (current) =>
//                         Math.max(
//                           1,
//                           current - 1
//                         )
//                     )
//                   }
//                   className="p-3 text-[#243346] transition hover:text-[#D9A537]"
//                 >
//                   <Minus size={16} />
//                 </button>

//                 <span className="w-10 text-center font-bold text-[#243346]">
//                   {qty}
//                 </span>

//                 <button
//                   type="button"
//                   onClick={() =>
//                     setQty(
//                       (current) =>
//                         current + 1
//                     )
//                   }
//                   className="p-3 text-[#243346] transition hover:text-[#D9A537]"
//                 >
//                   <Plus size={16} />
//                 </button>

//               </div>
//             </div>

//             {/* =================================
//                 BUTTONS
//             ================================= */}

//             <div className="mt-7 grid grid-cols-2 gap-3">

//               <button
//                 type="button"
//                 onClick={() =>
//                   proceed(
//                     "cart"
//                   )
//                 }
//                 disabled={
//                   product.isOutOfStock
//                 }
//                 className="btn-gold px-3 text-sm sm:px-5 sm:text-base disabled:cursor-not-allowed disabled:opacity-50"
//               >
//                 <ShoppingCart size={18} />
//                 Add to Cart
//               </button>

//               <button
//                 type="button"
//                 onClick={() =>
//                   proceed(
//                     "buy"
//                   )
//                 }
//                 disabled={
//                   product.isOutOfStock
//                 }
//                 className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#243346] px-3 py-3.5 text-sm font-bold text-white transition hover:bg-[#1E2E3E] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:text-base"
//               >
//                 <Zap size={18} />
//                 Buy Now
//               </button>

//             </div>

//             {/* =================================
//                 PRODUCT DETAILS
//                 NO BORDER
//                 NO OPEN/CLOSE
//             ================================= */}

//             <div className="mt-8 py-2">

//               <div className="flex items-center gap-2">

//                 <FileText
//                   size={19}
//                   className="text-[#D9A537]"
//                 />

//                 <h2 className="text-lg font-black text-[#243346]">
//                   Product Details
//                 </h2>

//               </div>

//               {/* DESCRIPTION */}

//               <div className="mt-4">

//                 <p className="text-[15px] leading-7 text-slate-600">
//                   {product.description ||
//                     product.shortDescription ||
//                     product.short_description ||
//                     `${product.name} from the school uniform collection.`}
//                 </p>

//               </div>

//               {/* CATEGORY + SKU */}

//               <div className="mt-5">

//                 <div className="flex flex-wrap items-center gap-2 text-sm">

//                   <span className="font-extrabold text-[#243346]">
//                     Category:
//                   </span>

//                   <span className="text-slate-600">
//                     {product.category ||
//                       "Uncategorized"}
//                   </span>

//                 </div>

//                   {/* TAGS */}

//                   {tagText && (
//                     <div
//                       className="
//                         mt-2
//                         flex
//                         flex-wrap
//                         items-start
//                         gap-2
//                         text-sm
//                       "
//                     >
//                       <span
//                         className="
//                           font-extrabold
//                           text-[#243346]
//                         "
//                       >
//                         Tags:
//                       </span>

//                       <span
//                         className="
//                           text-slate-600
//                         "
//                       >
//                         {tagText}
//                       </span>
//                     </div>
//                   )}

//                 <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">

//                   <span className="font-extrabold text-[#243346]">
//                     SKU:
//                   </span>

//                   <span className="text-slate-600">
//                     {product.sku ||
//                       "N/A"}
//                   </span>

//                 </div>

//               </div>

//             </div>

//             {/* SIZE GUIDE REMOVED */}

//             {/* DELIVERY REMOVED */}

//           </div>
//         </div>
//       </div>

//       {/* =====================================
//           ADDITIONAL INFORMATION
//       ===================================== */}

//       {product.sizes?.length > 0 && (
//         <section className="bg-white pb-8 sm:pb-10">

//           {/* <div className="container-site"> */}
//           <div
//   className="
//     mx-auto
//     w-full
//     max-w-[1480px]
//     px-4

//     sm:px-6

//     lg:px-8
//   "
// >

//             {/* TITLE WITH LEFT + RIGHT LINES */}

//             <div className="flex items-center gap-4">

//               <div className="h-px flex-1 bg-slate-200" />

//               <h2
//                 className="
//                   border-b-2
//                   border-[#D9A537]
//                   pb-2
//                   text-center
//                   text-base
//                   font-black
//                   text-[#D9A537]
//                   sm:text-lg
//                 "
//               >
//                 Additional Information
//               </h2>

//               <div className="h-px flex-1 bg-slate-200" />

//             </div>

//             {/* INFORMATION TABLE */}

//             <div
//               className="
//                 mx-auto
//                 mt-7
//                 max-w-5xl
//                 overflow-hidden
//                 border
//                 border-slate-200
//                 bg-[#f3f3f3]
//               "
//             >

//               <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[170px_1fr]">

//                 {/* LABEL */}

//                 <div
//                   className="
//                     border-r
//                     border-slate-200
//                     px-5
//                     py-4
//                     text-base
//                     font-black
//                     text-[#243346]
//                   "
//                 >
//                   size
//                 </div>

//                 {/* VALUES */}

//                 <div
//                   className="
//                     px-5
//                     py-4
//                     text-base
//                     leading-6
//                     text-slate-600
//                   "
//                 >
//                   {/* {product.sizes.join(", ")} */}
//                   {[...product.sizes]
//                     .sort((a, b) => Number(a) - Number(b))
//                     .join(", ")}
//                 </div>

//               </div>

//             </div>

//           </div>

//         </section>
//       )}

//       {/* =====================================
//           RELATED PRODUCTS
//       ===================================== */}

//       {related.length > 0 && (
//         <section className="bg-white py-12 sm:py-16">

//           {/* <div className="container-site"> */}
//           <div
//   className="
//     mx-auto
//     w-full
//     max-w-[1480px]
//     px-4

//     sm:px-6

//     lg:px-8
//   "
// >

//             {/* CENTER HEADING */}

//             <div className="mb-8 text-center">

//               <h2 className="text-2xl font-black text-[#243346] sm:text-3xl">
//                 Related Products
//               </h2>

//             </div>

//             {/* PRODUCTS */}

//             <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">

//               {related.map(
//                 (item) => (
//                   <ProductCard
//                     key={item.id}
//                     product={item}
//                     requireAuth={
//                       requireAuth
//                     }
//                   />
//                 )
//               )}

//             </div>

//           </div>

//         </section>
//       )}

//       {/* RECENTLY VIEWED REMOVED */}

//       {/* =====================================
//           SIZE SELECT MODAL
//       ===================================== */}

//       <SizeSelectModal
//         product={product}
//         open={open}
//         size={selectedSize}
//         setSize={
//           setSelectedSize
//         }
//         onConfirm={
//           confirm
//         }
//         onClose={() =>
//           setOpen(false)
//         }
//         action={
//           action === "buy"
//             ? "Continue to Cart"
//             : "Select Size & Add to Cart"
//         }
//       />

//     </main>
//   );
// }



