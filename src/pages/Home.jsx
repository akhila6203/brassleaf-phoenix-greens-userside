import {
  Link,
} from "react-router-dom";

/* =========================================================
   CORNERSTONE BANNER

   This is the same banner image referenced by the
   Cornerstone database / old Cornerstone website.
========================================================= */

const CORNERSTONE_BANNER =
  "https://brassleaf.store/cornerstone/wp-content/uploads/2025/02/corner_stone_img.webp";

/* =========================================================
   CORNERSTONE UNIFORM GROUPS

   These routes are frontend routes only.

   Product mapping is handled in UniformCollection.jsx
   using the exact product IDs stored in the old
   Cornerstone page configuration.
========================================================= */

const uniformGroups = [
  {
    title:
      "PP1 - Grade 4 (BOYS)",

    slug:
      "nursery-to-4th-class-boys-uniform",
  },

  {
    title:
      "PP1 - Grade 4 (GIRLS)",

    slug:
      "nursery-to-4th-class-girls-uniform",
  },

  {
    title:
      "Grade 5 - Grade 12 (BOYS)",

    slug:
      "5th-class-to-12th-class-boys-uniform",
  },

  {
    title:
      "Grade 5 - Grade 12 (GIRLS)",

    slug:
      "5th-class-to-12th-class-girls-uniform",
  },
];

export default function Home() {
  return (
    <main className="min-h-[70vh] bg-white">

      {/* =====================================================
          CORNERSTONE HERO BANNER
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
          UNIFORM GROUP LINKS
      ===================================================== */}

      <section
  className="
    bg-white
    px-4

    pt-16
    pb-10

    sm:pt-20
    sm:pb-12

    lg:pt-24
    lg:pb-12
  "
>
        <div
          className="
            mx-auto
            grid
            w-full
            max-w-[1050px]
            grid-cols-1
            gap-5
            text-center

            sm:grid-cols-2
            sm:gap-x-8
            sm:gap-y-6

            lg:grid-cols-4
            lg:items-start
            lg:gap-8
          "
        >
          {uniformGroups.map(
            (group) => (
              <Link
                key={
                  group.slug
                }
                to={`/uniforms/${group.slug}`}
                className="
                  text-[16px]
                  font-extrabold
                  italic
                  leading-6
                  text-[#D9A537]
                  underline
                  decoration-[1.5px]
                  underline-offset-2
                  transition

                  hover:text-[#243346]

                  sm:text-[17px]

                  lg:text-[18px]
                "
              >
                {group.title}
              </Link>
            )
          )}
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
