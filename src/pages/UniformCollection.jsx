import {
  Link,
  Navigate,
  useParams,
} from "react-router-dom";

import ProductCard from "../components/ProductCard";

import {
  useProducts,
} from "../hooks/useProducts";



function normalizeProductName(
  value = ""
) {
  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function sortProductsByOrder(
  products = [],
  order = []
) {
  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {
    return [];
  }

  if (
    !Array.isArray(order) ||
    order.length === 0
  ) {
    return products;
  }

  const normalizedOrder =
    order.map(
      normalizeProductName
    );

  return [...products].sort(
    (a, b) => {
      const aName =
        normalizeProductName(
          a?.name || ""
        );

      const bName =
        normalizeProductName(
          b?.name || ""
        );

      const aIndex =
        normalizedOrder.indexOf(
          aName
        );

      const bIndex =
        normalizedOrder.indexOf(
          bName
        );

      if (
        aIndex !== -1 &&
        bIndex !== -1
      ) {
        return aIndex - bIndex;
      }

      if (
        aIndex !== -1
      ) {
        return -1;
      }

      if (
        bIndex !== -1
      ) {
        return 1;
      }

      return aName.localeCompare(
        bName
      );
    }
  );
}

const COLLECTIONS = {
    primary: {
  title:
    "Nursery, PP-1 & PP-2",

  regularCategory:
    "nursery-1-2,jacket",

  sportsCategory:
    "sports-nur-1-2",

  regularBreadcrumb: {
    name:
      "Nursery-1-2",

    slug:
      "nursery-1-2",
  },

  sportsBreadcrumb: {
    name:
      "Sports Nur-1-2",

    slug:
      "sports-nur-1-2",
  },

  /* EXACT REGULAR ORDER FROM YOUR SCREENSHOT */

  regularOrder: [
    "PG Belt Boys / Girls",
    "PG Navy Blue T-Shirt",
    "PG Boys Khaki Shorts",
    "PG Girls Yellow T-Shirt",
    "PG Girls Green Skirt",
    "PG Jacket",
  ],

  /* EXACT SPORTS ORDER FROM YOUR SCREENSHOT */

  sportsOrder: [
    "PG Black Sports Track",
    "PG Grey T-Shirt",
  ],
},
"grade-1-and-2": {
  title:
    "Class -1 & 2 (CBSE, Cambridge)",

  regularCategory:
    "grade1-2,jacket",

  sportsCategory:
    "sports-1-5,sr-sports-uniform",

  regularBreadcrumb: {
    name:
      "Grade1-2",

    slug:
      "grade1-2",
  },

  sportsBreadcrumb: {
    name:
      "Sports-1-5",

    slug:
      "sports-1-5",
  },

  regularOrder: [
    "PG Belt Boys / Girls",
    "PG Girls Yellow T-Shirt 1 & 2",
    "PG Girls Green Skirt 1-2",
    "PG Navy Blue T-Shirt 1-2",
    "PG Boys Khaki Shorts",
    "PG Jacket",
  ],
  sportsOrder: [
    "PG Light Red Kakathiya",
    "PG Blue Maurya",
    "PG Green Pandiya",
    "PG Yellow Chalukya",
    "PG Black Sports Track",
  ],
},

"grade-3-5": {
  title:
    "Class -3 to 5 (CBSE, Cambridge)",

  regularCategory:
    "grade-3-5,jacket,white-shirt",

  sportsCategory:
    "sports-1-5,sr-sports-uniform",

  regularBreadcrumb: {
    name:
      "Grade 3-5",

    slug:
      "grade-3-5",
  },

  sportsBreadcrumb: {
    name:
      "Sports-1-5",

    slug:
      "sports-1-5",
  },

  regularOrder: [
    "PG Girls Ties",
    "PG Boys Ties",
    "PG Belt Boys / Girls",
    "PG Girls Straight Skirt - Grey Girls Skirt",
    "PG White Shirt Boys / Girls",
    "PG Boys Necker",
    "PG Jacket",
  ],

  sportsOrder: [
    "PG Light Red Kakathiya",
    "PG Blue Maurya",
    "PG Green Pandiya",
    "PG Yellow Chalukya",
    "PG Black Sports Track",
  ],
},

"grade-6-12": {
  title:
    "Class -6 to 12 (CBSE, Cambridge)",

  regularCategory:
    "grade-6-12,jacket,white-shirt",

  sportsCategory:
    "sr-sports-uniform",

  regularBreadcrumb: {
    name:
      "Grade 6-12",

    slug:
      "grade-6-12",
  },

  sportsBreadcrumb: {
    name:
      "Sr. Sports Uniform",

    slug:
      "sr-sports-uniform",
  },

  /* =====================================================
     REGULAR UNIFORM ORDER
     Same order as your screenshot
  ===================================================== */

  regularOrder: [
    "PG Girls Ties",
    "PG Boys Ties",
    "PG Belt Boys / Girls",
    "PG Girls Straight Skirt - Grey Girls Skirt",
    "PG White Shirt Boys / Girls",
    "PG Grey Boys Trousers",
    "PG Jacket",
  ],

  /* =====================================================
     SPORTS UNIFORM ORDER
     Same order as your screenshot
  ===================================================== */

  sportsOrder: [
    "PG Light Red Kakathiya",
    "PG Blue Maurya",
    "PG Green Pandiya",
    "PG Yellow Chalukya",
    "PG Black Sports Track",
  ],
},
};

/* =========================================================
   PRODUCT SECTION
========================================================= */

function ProductSection({
  title,
  products,
  loading,
  error,
  order = [],

  categoryContext,

}) {

  const orderedProducts =
  sortProductsByOrder(
    products,
    order
  );
  return (
    <section className="pb-10 sm:pb-14">

      <h2
        className="
          mb-6
          text-center
          text-xl
          font-black
          text-[#243346]

          sm:text-2xl
        "
      >
        {title}
      </h2>

      {/* LOADING */}

      {loading ? (
        <div
          className="
            flex
            min-h-[220px]
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

        /* ERROR */

        <p
          className="
            py-10
            text-center
            text-sm
            font-semibold
            text-red-600
          "
        >
          {error}
        </p>

      ) : products.length === 0 ? (

        /* EMPTY */

        <p
          className="
            py-10
            text-center
            text-sm
            text-slate-500
          "
        >
          No products available.
        </p>

      ) : (

        /* PRODUCT GRID */

        <div
          className="
            grid
            grid-cols-2
            gap-x-3
            gap-y-8

            sm:grid-cols-3
            sm:gap-x-5

            lg:grid-cols-4
            lg:gap-x-7
            lg:gap-y-11
          "
        >
{/* 
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showPrice={false}
              categoryContext={
                categoryContext
              }
            />
          ))} */}
          {orderedProducts.map(
  (product) => (
    <ProductCard
      key={product.id}

      product={product}

      showPrice={false}

      categoryContext={
        categoryContext
      }
    />
  )
)}
        </div>
      )}

    </section>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function UniformCollection() {

  const {
    collectionSlug,
  } = useParams();

  const collection =
    COLLECTIONS[
      collectionSlug
    ];

  /*
  Keep hooks unconditional.

  When URL is invalid,
  requests are disabled.
  */

  const enabled =
    Boolean(collection);

  /* =====================================================
     REGULAR UNIFORM PRODUCTS
  ===================================================== */

  const regular =
    useProducts(
      {
        page: 1,

        limit: 100,

        sort:
          "name",

        dir:
          "asc",

        category:
          collection
            ?.regularCategory ||
          "",
      },
      {
        enabled,
      }
    );

  /* =====================================================
     SPORTS UNIFORM PRODUCTS
  ===================================================== */

  const sports =
    useProducts(
      {
        page: 1,

        limit: 100,

        sort:
          "name",

        dir:
          "asc",

        category:
          collection
            ?.sportsCategory ||
          "",
      },
      {
        enabled,
      }
    );

  /* =====================================================
     INVALID PAGE
  ===================================================== */

  if (!collection) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return (
    <main
      className="
        min-h-[70vh]
        bg-[#f7f8fa]
      "
    >

      {/* =============================================
          SCHOOL BANNER
      ============================================= */}

      <section
        className="
          relative
          w-full
          overflow-hidden
          bg-slate-100
        "
      >
        <img
  src="/school-banner.webp"
  alt="School campus"
  className="
    h-[220px]
    w-full
    object-cover
    object-center

    sm:h-[315px]
    md:h-[360px]
    lg:h-[390px]
  "
/>
      </section>

      {/* =============================================
          CLASS HEADING
      ============================================= */}

      <section
        className="
          px-4
          pb-5
          pt-6

          sm:pt-7
        "
      >
        <div
          className="
            mx-auto
            max-w-[1180px]
            text-center
          "
        >
          <h1
            className="
              text-[21px]
              font-black
              leading-tight
              text-[#243346]

              sm:text-[25px]
              lg:text-[28px]
            "
          >
            {collection.title}
          </h1>
        </div>
      </section>

      {/* =============================================
          PRODUCTS
      ============================================= */}

      <div
        className="
          mx-auto
          w-full
          max-w-[1480px]
          px-4
          pb-14

          sm:px-6

          lg:px-8
        "
      >

        {/* REGULAR */}
        <ProductSection
  title="Regular Uniform"
  products={
    regular.products
  }
  loading={
    regular.loading
  }
  error={
    regular.error
  }
   order={
    collection.regularOrder
  }
  categoryContext={
    collection.regularBreadcrumb
  }
/>


        {/* SPORTS */}
          <ProductSection
  title="Sports Uniform"
  products={
    sports.products
  }
  loading={
    sports.loading
  }
  error={
    sports.error
  }
  order={
    collection.sportsOrder
  }
  categoryContext={
    collection.sportsBreadcrumb
  }
/>


        <div className="pt-1 text-center">
          <Link
            to="/"
            className="
              inline-flex
              items-center
              font-bold
              text-[#243346]
              transition

              hover:text-[#D9A537]
            "
          >
            ← Back to Home
          </Link>
        </div>

      </div>

    </main>
  );
}