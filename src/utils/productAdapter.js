function cleanText(value = "") {
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function toCardProduct(item, categoryName = "") {
  const minPrice = item.minPrice != null ? Number(item.minPrice) : null;
  const maxPrice = item.maxPrice != null ? Number(item.maxPrice) : minPrice;

  return {
    ...item,
    minPrice,
    maxPrice,
    price: minPrice,
    category:
      categoryName ||
      item.category ||
      item.categoryName ||
      item.categories?.[0]?.name ||
      "",
    image: item.image || null,
    isOutOfStock: item.stockStatus === "outofstock",
  };
}

export function toDetailProduct(item) {

  const imageUrls = (item.images || [])
    .map(
      (img) =>
        img.guid ||
        img.url ||
        img.image
    )
    .filter(Boolean);

  /* =========================================================
     ALL CATEGORIES
  ========================================================= */

  const categories =
    Array.isArray(item.categories)
      ? item.categories
      : [];

  const firstCategory =
    categories[0] || null;

  const categoryText =
    categories.length > 0
      ? categories
          .map(
            (category) =>
              category?.name || ""
          )
          .filter(Boolean)
          .join(", ")
      : (
          item.category ||
          item.categoryName ||
          ""
        );

  /* =========================================================
     TAGS
  ========================================================= */

  const tags =
    Array.isArray(item.tags)
      ? item.tags
      : [];

  /* =========================================================
     VARIATIONS / SIZES
  ========================================================= */

  const variations =
    Array.isArray(item.variations)
      ? item.variations
      : [];

  const sizedVariations =
    variations.filter(
      (variation) =>
        String(
          variation?.size || ""
        ).trim() !== ""
    );

  const sizes = [
    ...new Set(
      sizedVariations.map(
        (variation) =>
          variation.size
      )
    ),
  ];

  /* =========================================================
     PRICE
  ========================================================= */

  const minPrice =
    item.minPrice != null
      ? Number(item.minPrice)
      : null;

  const maxPrice =
    item.maxPrice != null
      ? Number(item.maxPrice)
      : minPrice;

  /* =========================================================
     DESCRIPTION
  ========================================================= */

  const description =
    cleanText(
      item.description
    ) ||
    cleanText(
      item.shortDescription
    );

  /* =========================================================
     RESULT
  ========================================================= */

  return {

    ...item,

    minPrice,

    maxPrice,

    price:
      minPrice,

    /* =====================================================
       CATEGORY

       category:
       Girls, Grade1-2

       categorySlug:
       first category slug only for related-product API
    ===================================================== */

    category:
      categoryText,

    categoryName:
      categoryText,

    categories,

    categoryId:
      firstCategory?.term_id ||
      firstCategory?.id ||
      "",

    categorySlug:
      firstCategory?.slug ||
      "",

    /* =====================================================
       TAGS
    ===================================================== */

    tags,

    /* =====================================================
       IMAGE
    ===================================================== */

    image:
      imageUrls[0] ||
      item.image ||
      null,

    images:
      imageUrls,

    /* =====================================================
       VARIATIONS / SIZES
    ===================================================== */

    variations,

    sizes,

    hasSizes:
      String(
        item?.productType ||
        item?.product_type ||
        item?.type ||
        ""
      ).toLowerCase() ===
        "variable" ||
      sizes.length > 0,

    description,

    /* =====================================================
       STOCK
    ===================================================== */

    isOutOfStock:
      item.stockStatus ===
        "outofstock" ||
      (
        variations.length > 0 &&
        variations.every(
          (variation) =>
            variation.stockStatus ===
            "outofstock"
        )
      ),
  };
}



// function cleanText(value = "") {
//   return String(value)
//     .replace(/<[^>]+>/g, " ")
//     .replace(/\s+/g, " ")
//     .trim();
// }

// export function toCardProduct(item, categoryName = "") {
//   const minPrice = item.minPrice != null ? Number(item.minPrice) : null;
//   const maxPrice = item.maxPrice != null ? Number(item.maxPrice) : minPrice;

//   return {
//     ...item,
//     minPrice,
//     maxPrice,
//     price: minPrice,
//     category:
//       categoryName ||
//       item.category ||
//       item.categoryName ||
//       item.categories?.[0]?.name ||
//       "",
//     image: item.image || null,
//     isOutOfStock: item.stockStatus === "outofstock",
//   };
// }

// export function toDetailProduct(item) {
//   const imageUrls = (item.images || [])
//     .map((img) => img.guid || img.url || img.image)
//     .filter(Boolean);

//   const category = item.categories?.[0];
//   const variations = Array.isArray(item.variations) ? item.variations : [];
//   const sizedVariations = variations.filter((variation) =>
//     String(variation.size || "").trim()
//   );

//   const minPrice = item.minPrice != null ? Number(item.minPrice) : null;
//   const maxPrice = item.maxPrice != null ? Number(item.maxPrice) : minPrice;
//   const description = cleanText(item.description) || cleanText(item.shortDescription);

//   return {
//     ...item,
//     minPrice,
//     maxPrice,
//     price: minPrice,
//     category: category?.name || item.category || item.categoryName || "",
//     categoryId: category?.slug || "",
//     categorySlug: category?.slug || "",
//     image: imageUrls[0] || item.image || null,
//     images: imageUrls,
//     variations,
//     sizes: [...new Set(sizedVariations.map((variation) => variation.size))],
//     hasSizes: sizedVariations.length > 0,
//     description,
//     isOutOfStock:
//       item.stockStatus === "outofstock" ||
//       (variations.length > 0 && variations.every((v) => v.stockStatus === "outofstock")),
//   };
// }
