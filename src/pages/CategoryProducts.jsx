import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import ProductCard
  from "../components/ProductCard";

import {
  useProducts,
} from "../hooks/useProducts";

import {
  getCategories,
} from "../services/categoryService";

/* =========================================================
   SORT OPTIONS
========================================================= */

const SORT_OPTIONS = [
  {
    value: "default",
    label: "Default sorting",
    sort: "name",
    dir: "asc",
  },

  {
    value: "latest",
    label: "Sort by latest",
    sort: "date",
    dir: "desc",
  },

  {
    value: "name-asc",
    label: "Sort by name: A to Z",
    sort: "name",
    dir: "asc",
  },

  {
    value: "name-desc",
    label: "Sort by name: Z to A",
    sort: "name",
    dir: "desc",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function CategoryProducts() {
  const {
    categorySlug,
  } = useParams();

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    sortValue,
    setSortValue,
  ] = useState("default");

  const [searchInput, setSearchInput] =
  useState("");

const [searchTerm, setSearchTerm] =
  useState("");
  /* =======================================================
     LOAD CATEGORY NAMES FROM YOUR BACKEND

     No hardcoded Girls / Grade1-2 names.
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const result =
          await getCategories({
            page: 1,
            limit: 100,
          });

        if (!cancelled) {
          setCategories(
            result.categories || []
          );
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     CURRENT CATEGORY
  ======================================================= */

  const currentCategory =
    useMemo(
      () =>
        categories.find(
          (category) =>
            String(
              category.slug
            ).toLowerCase() ===
            String(
              categorySlug
            ).toLowerCase()
        ),
      [
        categories,
        categorySlug,
      ]
    );

  /* =======================================================
     SORT
  ======================================================= */

  const selectedSort =
    SORT_OPTIONS.find(
      (option) =>
        option.value ===
        sortValue
    ) ||
    SORT_OPTIONS[0];

 const handleSearch = (event) => {
  event.preventDefault();

  setSearchTerm(
    searchInput.trim()
  );
};

  const {
    products,
    loading,
    error,
    total,
  } = useProducts({
    page: 1,

    limit: 100,

    category:
      categorySlug,

     search:
    searchTerm || undefined,

    sort:
      selectedSort.sort,

    dir:
      selectedSort.dir,
  });

  const categoryName =
    currentCategory?.name ||
    categorySlug;

    
  return (
    <main
      className="
        min-h-[70vh]
        bg-[#f7f8fa]
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1480px]

          px-4
          py-10

          sm:px-6
          sm:py-12

          lg:px-8
        "
      >
        {/* =============================================
            BREADCRUMB
        ============================================= */}

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
            {categoryName}
          </span>
        </div>

        {/* =============================================
            TITLE
        ============================================= */}

        {/* <h1
          className="
            mt-8

            text-3xl
            font-black

            text-[#243346]

            sm:text-4xl
          "
        >
          {categoryName}
        </h1> */}
        <h1
  className="
    mt-8
    text-3xl
    font-black
    text-[#243346]

    sm:text-4xl
  "
>
  {searchTerm
    ? `Search Results for: ${searchTerm}`
    : categoryName}
</h1>

{searchTerm && (
  <p
    className="
      mt-3
      text-sm
      text-slate-500
    "
  >
    Here are the search results
    for your search.
  </p>
)}

            {/* =============================================
    SEARCH PRODUCTS
============================================= */}

<form
  onSubmit={handleSearch}
  className="
    mt-8
    flex
    w-full
    max-w-[360px]
  "
>
  <input
    type="text"
    value={searchInput}
    onChange={(event) =>
      setSearchInput(
        event.target.value
      )
    }
    placeholder="Search products..."
    className="
      h-11
      min-w-0
      flex-1

      border
      border-slate-300

      bg-white

      px-4

      text-sm
      text-[#243346]

      outline-none

      placeholder:text-slate-400

      focus:border-[#D9A537]
    "
  />

  <button
    type="submit"
    className="
      flex
      h-11
      w-12

      items-center
      justify-center

      bg-[#243346]

      text-xl
      font-bold
      text-white

      transition

      hover:bg-[#D9A537]
      hover:text-[#243346]
    "
    aria-label="Search products"
  >
    ›
  </button>
</form>
        {/* =============================================
            RESULT COUNT + SORT
        ============================================= */}

        <div
          className="
            mt-10

            flex
            flex-col
            gap-4

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <p
            className="
              text-sm
              text-slate-600
            "
          >
            Showing all{" "}
            <span
              className="
                font-bold
                text-[#243346]
              "
            >
              {total}
            </span>{" "}
            results
          </p>

          <select
            value={
              sortValue
            }
            onChange={
              (event) =>
                setSortValue(
                  event.target.value
                )
            }
            className="
              h-11
              min-w-[230px]

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
            {SORT_OPTIONS.map(
              (option) => (
                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                >
                  {option.label}
                </option>
              )
            )}
          </select>
        </div>

        {/* =============================================
            PRODUCTS
        ============================================= */}

        <div className="mt-10">
          {loading ? (
            <div
              className="
                flex
                min-h-[250px]
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
            <p
              className="
                py-12
                text-center
                font-semibold
                text-red-600
              "
            >
              {error}
            </p>
          ) : products.length === 0 ? (
            <p
              className="
                py-12
                text-center
                text-slate-500
              "
            >
              No products available.
            </p>
          ) : (
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
              {products.map(
                (product) => (
                  <ProductCard
                    key={
                      product.id
                    }
                    product={
                      product
                    }

                    /*
                      Hide price just like
                      UniformCollection
                    */
                    showPrice={
                      false
                    }

                    /*
                      VERY IMPORTANT.

                      If user clicks product
                      from Girls page:

                      Details breadcrumb:
                      Home > Girls > Product

                      If Grade1-2:

                      Home > Grade1-2 > Product
                    */
                    categoryContext={{
                      slug:
                        categorySlug,

                      name:
                        categoryName,
                    }}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}