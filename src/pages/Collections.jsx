import { Grid2X2, List, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useProducts";

const SORT_OPTIONS = [
  { value: "default", label: "Default sorting", sort: "date", dir: "desc" },
  { value: "popularity", label: "Sort by popularity", sort: "sales", dir: "desc" },
  { value: "rating", label: "Sort by average rating", sort: "date", dir: "desc" },
  { value: "latest", label: "Sort by latest", sort: "date", dir: "desc" },
  { value: "price-asc", label: "Sort by price: low to high", sort: "price", dir: "asc" },
  { value: "price-desc", label: "Sort by price: high to low", sort: "price", dir: "desc" },
];

export default function Collections({ requireAuth }) {
  const [sortValue, setSortValue] = useState("default");
  const [view, setView] = useState("grid");

  const selectedSort = SORT_OPTIONS.find((option) => option.value === sortValue) || SORT_OPTIONS[0];

  const { products, loading, error, total } = useProducts({
    page: 1,
    limit: 100,
    sort: selectedSort.sort,
    dir: selectedSort.dir,
  });

  const visibleProducts = useMemo(() => {
    if (sortValue !== "rating") return products;
    return [...products].sort(
      (a, b) => Number(b.averageRating || 0) - Number(a.averageRating || 0)
    );
  }, [products, sortValue]);

  return (
    <main className="min-h-[70vh] bg-white">
      {/* PAGE TITLE */}
      <section className="container-site pt-10 sm:pt-14 lg:pt-16">
        <h1 className="text-3xl font-black text-[#243346] sm:text-4xl">Shop</h1>

        <div className="mt-3 flex items-center gap-1 text-sm">
          <Link to="/" className="text-slate-400 transition hover:text-[#D9A537]">
            Home
          </Link>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="font-medium text-[#243346]">Shop</span>
        </div>
      </section>

      <section className="container-site pb-12 pt-16 sm:pb-16 sm:pt-20 lg:pt-24">
        {/* RESULT + VIEW + SORT */}
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[#243346]">
            Showing all {total || visibleProducts.length} results
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`grid h-9 w-9 place-items-center rounded-md border transition ${
                  view === "grid"
                    ? "border-[#D9A537] text-[#D9A537]"
                    : "border-transparent text-slate-400 hover:text-[#243346]"
                }`}
                aria-label="Grid view"
              >
                <Grid2X2 size={16} />
              </button>

              <button
                type="button"
                onClick={() => setView("list")}
                className={`grid h-9 w-9 place-items-center rounded-md border transition ${
                  view === "list"
                    ? "border-[#D9A537] text-[#D9A537]"
                    : "border-transparent text-slate-400 hover:text-[#243346]"
                }`}
                aria-label="List view"
              >
                <List size={17} />
              </button>
            </div>

            <select
              value={sortValue}
              onChange={(event) => setSortValue(event.target.value)}
              className="h-11 min-w-[220px] rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-[#243346] outline-none transition focus:border-[#D9A537]"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PRODUCTS */}
        {loading && visibleProducts.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D9A537] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="font-semibold text-red-500">{error}</p>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No products found.</div>
        ) : view === "grid" ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} requireAuth={requireAuth} />
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {visibleProducts.map((product) => (
              <div
                key={product.id}
                className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-4 sm:grid-cols-[170px_1fr] sm:items-center"
              >
                <Link to={`/products/${product.id}`} className="block overflow-hidden rounded-xl bg-slate-50">
                  <img
                    src={product.image || "/placeholder.png"}
                    alt={product.name}
                    className="h-44 w-full object-contain"
                  />
                </Link>
                <div>
                  <Link
                    to={`/products/${product.id}`}
                    className="text-lg font-black text-[#243346] hover:text-[#D9A537]"
                  >
                    {product.name}
                  </Link>
                  {product.category && (
                    <p className="mt-1 text-sm text-slate-500">{product.category}</p>
                  )}
                  <p className="mt-3 text-lg font-black text-[#D9A537]">
                    {product.minPrice != null &&
                    product.maxPrice != null &&
                    Number(product.minPrice) !== Number(product.maxPrice)
                      ? `₹${product.minPrice.toFixed(2)} - ₹${product.maxPrice.toFixed(2)}`
                      : `₹${Number(product.price ?? product.minPrice ?? 0).toFixed(2)}`}
                  </p>
                  <Link
                    to={`/products/${product.id}`}
                    className="mt-4 inline-flex text-sm font-black uppercase text-[#243346] hover:text-[#D9A537]"
                  >
                    Select options »
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
