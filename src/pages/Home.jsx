import { Link } from "react-router-dom";



const uniformGroups = [
  {
    title: "Nursery, PP-1 & PP-2",
    slug: "primary",
  },
  {
    title: "Grade -1 & 2 (CBSE, Cambridge)",
    slug: "grade-1-and-2",
  },
  {
    title: "Grade -3 to 5 (CBSE, Cambridge)",
    slug: "grade-3-5",
  },
  {
    title: "Grade -6 to 12 (CBSE, Cambridge)",
    slug: "grade-6-12",
  },
];

export default function Home() {
  return (
    <main className="min-h-[70vh] bg-white">

      {/* =========================================
          SCHOOL BANNER
      ========================================= */}

      <section className="relative w-full overflow-hidden bg-slate-100">
        <img
  src="/school-banner.webp"
  alt="School campus"
  className="
    h-[235px]
    w-full
    object-cover
    object-center

    sm:h-[330px]
    md:h-[390px]
    lg:h-[430px]
    xl:h-[455px]
  "
/>
      </section>

      {/* =========================================
          CLASS LINKS
      ========================================= */}

      <section className="bg-[#f7f8fa] px-4 py-10 sm:py-12 lg:py-14">
        <div className="mx-auto w-full max-w-[1180px] text-center">

          <h1
            className="
              text-xl
              font-black
              text-[#243346]

              sm:text-2xl
              lg:text-[28px]
            "
          >
            Select Your Class and Order Uniform
          </h1>

          <div
            className="
              mx-auto
              mt-7
              grid
              max-w-[1080px]
              grid-cols-1
              gap-4

              sm:grid-cols-2
              sm:gap-5

              lg:grid-cols-4
            "
          >
            {uniformGroups.map((group) => (
              <Link
                key={group.slug}
                to={`/uniforms/${group.slug}`}
                className="
                  group
                  flex
                  min-h-[76px]
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-[#D9A537]/35
                  bg-white
                  px-5
                  py-4
                  text-[15px]
                  font-extrabold
                  leading-6
                  text-[#D9A537]
                  shadow-sm
                  transition

                  hover:-translate-y-0.5
                  hover:border-[#D9A537]
                  hover:bg-[#243346]
                  hover:text-white
                  hover:shadow-md

                  sm:text-base
                "
              >
                <span className="underline decoration-1 underline-offset-4">
                  {group.title}
                </span>
              </Link>
            ))}
          </div>

        </div>
      </section>

    </main>
  );
}

// import { useEffect } from "react";
// import ProductCard from "../components/ProductCard";
// import { usePaginatedProducts } from "../hooks/useProducts";

// export default function Home() {
//   const { products, loading, error, hasMore, loadMore } = usePaginatedProducts({ sort: "date", dir: "desc" }, 24);

//   useEffect(() => {
//     if (!loading && hasMore) loadMore();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [loading, hasMore, products.length]);

//   return (
//     <main className="min-h-[70vh] bg-white py-8 sm:py-10 lg:py-12">
//       <div className="container-site">
//         {error && products.length === 0 ? (
//           <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">{error}</p>
//         ) : products.length === 0 && loading ? (
//           <div className="flex justify-center py-16"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D9A537] border-t-transparent" /></div>
//         ) : products.length === 0 ? (
//           <p className="py-12 text-center text-slate-500">No products available.</p>
//         ) : (
//           <>
//             <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
//               {products.map((product) => <ProductCard key={product.id} product={product} />)}
//             </div>
//             {loading && <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D9A537] border-t-transparent" /></div>}
//           </>
//         )}
//       </div>
//     </main>
//   );
// }
