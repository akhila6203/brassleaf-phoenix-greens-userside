import {
  Link,
  Navigate,
  useParams,
} from "react-router-dom";

import {
  useMemo,
} from "react";

import ProductCard from "../components/ProductCard";

import {
  useProducts,
} from "../hooks/useProducts";

/* =========================================================
   CORNERSTONE HERO IMAGE

   Same image referenced by Cornerstone database.
========================================================= */

const CORNERSTONE_BANNER =
  "https://brassleaf.store/cornerstone/wp-content/uploads/2025/02/corner_stone_img.webp";

/* =========================================================
   CORNERSTONE PAGE CONFIGURATION

   IMPORTANT:

   These product IDs are NOT newly invented frontend data.

   They are the exact query_posts_ids saved inside the
   uploaded Cornerstone WordPress database for these
   four pages.

   Backend/API does NOT need to change.
========================================================= */

const COLLECTIONS = {
  "nursery-to-4th-class-boys-uniform":
    {
      title:
        "PP1 - Grade 4 (BOYS)",

      productIds: [
        11184,
        11234,
        11245,
        11266,
        11277,
        11287,
        11577,
      ],
    },

  "nursery-to-4th-class-girls-uniform":
    {
      title:
        "PP1 - Grade 4 (GIRLS)",

      productIds: [
        11219,
        11234,
        11245,
        11266,
        11277,
        11287,
        11948,
      ],
    },

  "5th-class-to-12th-class-boys-uniform":
    {
      title:
        "Grade 5 - Grade 12 (BOYS)",

      productIds: [
        11234,
        11245,
        11266,
        11277,
        11287,
        11577,
        11201,
      ],
    },

  "5th-class-to-12th-class-girls-uniform":
    {
      title:
        "Grade 5 - Grade 12 (GIRLS)",

      productIds: [
        11234,
        11245,
        11266,
        11277,
        11287,
        11660,
        11563,
      ],
    },
};

/* =========================================================
   PAGE
========================================================= */

export default function UniformCollection({
  requireAuth,
}) {
  const {
    collectionSlug,
  } = useParams();

  const collection =
    COLLECTIONS[
      collectionSlug
    ];

  /* =====================================================
     INVALID URL
  ===================================================== */

  if (!collection) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  /* =====================================================
     EXISTING PRODUCT API

     No new backend endpoint.
     No backend modification.

     Existing:
     GET /products/public
  ===================================================== */

  const {
    products,
    loading,
    error,
  } = useProducts({
    page: 1,
    limit: 100,
    sort: "date",
    dir: "desc",
  });

  /* =====================================================
     FILTER PRODUCTS USING DATABASE PAGE PRODUCT IDS
  ===================================================== */

  const collectionProducts =
    useMemo(() => {

      const productMap =
        new Map(
          products.map(
            (product) => [
              Number(
                product.id
              ),
              product,
            ]
          )
        );

      /*
      Keep exact database order.

      Example:
      11184
      11234
      11245
      ...
      */

      return collection.productIds
        .map(
          (productId) =>
            productMap.get(
              Number(
                productId
              )
            )
        )
        .filter(Boolean);

    }, [
      products,
      collection,
    ]);

  return (
    <main
      className="
        min-h-[70vh]
        bg-white
      "
    >

      {/* =====================================================
          HERO BANNER
      ===================================================== */}

      <section
        className="
          relative
          w-full
          overflow-hidden
          bg-slate-100
        "
      >
        <img
          src={CORNERSTONE_BANNER}
          alt="Cornerstone School"
          className="
            h-[250px]
            w-full
            object-cover
            object-center

            sm:h-[340px]

            md:h-[400px]

            lg:h-[435px]

            xl:h-[455px]
          "
        />
      </section>

      {/* =====================================================
          COLLECTION HEADING
      ===================================================== */}

      <section
        className="
          bg-white
          px-4
          pb-5
          pt-7

          sm:pb-7
          sm:pt-8

          lg:pb-8
        "
      >
        <div
          className="
            mx-auto
            max-w-[1200px]
            text-center
          "
        >
          <h1
            className="
              text-[22px]
              font-black
              leading-tight
              text-black

              sm:text-[26px]

              lg:text-[28px]
            "
          >
            {collection.title}
          </h1>
        </div>
      </section>

      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      <section
        className="
          bg-white
          px-4
          pb-14

          sm:pb-16

          lg:pb-20
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1200px]
          "
        >

          {/* =============================================
              LOADING
          ============================================= */}

          {loading ? (
            <div
              className="
                flex
                min-h-[260px]
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
          ) : error ? (

            /* =========================================
               ERROR
            ========================================= */

            <div
              className="
                py-16
                text-center
              "
            >
              <p
                className="
                  font-semibold
                  text-red-500
                "
              >
                {error}
              </p>
            </div>

          ) : collectionProducts.length ===
            0 ? (

            /* =========================================
               EMPTY
            ========================================= */

            <div
              className="
                py-16
                text-center
              "
            >
              <p
                className="
                  text-slate-500
                "
              >
                No products
                available.
              </p>
            </div>

          ) : (

            /* =========================================
               PRODUCT GRID

               Existing ProductCard.
               Existing Details.
               Existing Add to Cart.
               Existing Size check.
               Existing API integration.
            ========================================= */

            <div
              className="
                grid
                grid-cols-2
                gap-x-3
                gap-y-7

                sm:grid-cols-3
                sm:gap-x-5
                sm:gap-y-9

                lg:grid-cols-4
                lg:gap-x-7
                lg:gap-y-12
              "
            >
              {collectionProducts.map(
                (product) => (
                  <ProductCard
                    key={
                      product.id
                    }
                    product={
                      product
                    }
                    requireAuth={
                      requireAuth
                    }
                  />
                )
              )}
            </div>
          )}

          {/* =================================================
              BACK HOME
          ================================================= */}

          {!loading &&
            !error && (
              <div
                className="
                  mt-12
                  text-center
                "
              >
                <Link
                  to="/"
                  className="
                    inline-flex
                    text-sm
                    font-bold
                    text-[#243346]
                    transition
                    hover:text-[#D9A537]
                  "
                >
                  ← Back to Home
                </Link>
              </div>
            )}

        </div>
      </section>

    </main>
  );
}