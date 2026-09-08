import axiosClient
  from "../api/axiosClient";

import API_ENDPOINTS
  from "../api/endpoints";

/* =========================================================
   PRODUCT LIST MAPPER
========================================================= */

const mapProductListItem =
  (item) => ({
    id:
      item.ID ??
      item.id,

    name:
      item.name,

    slug:
      item.slug,

    // status:
    //   item.status,

    // createdAt:
    //   item.created_at,
    status: 
  item.status, 

/* =====================================================
   PRODUCT TYPE

   Backend sends:
   simple / variable
===================================================== */

productType:
  item.product_type ||
  item.productType ||
  item.type ||
  "",

createdAt: 
  item.created_at,

    sku:
      item.sku,

    /* =====================================================
       BACKEND MIN/MAX PRICE ONLY
    ===================================================== */

    minPrice:
      item.min_price != null
        ? Number(
            item.min_price
          )
        : null,

    maxPrice:
      item.max_price != null
        ? Number(
            item.max_price
          )
        : null,

    /* =====================================================
       STOCK
    ===================================================== */

    stockStatus:
      item.stock_status,

    stockQuantity:
      item.stock_quantity != null &&
      item.stock_quantity !== ""
        ? Number(
            item.stock_quantity
          )
        : null,

    onSale:
      Boolean(
        Number(item.onsale)
      ),

    totalSales:
      item.total_sales != null
        ? Number(
            item.total_sales
          )
        : null,

    averageRating:
      item.average_rating != null
        ? Number(
            item.average_rating
          )
        : null,

    ratingCount:
      item.rating_count != null
        ? Number(
            item.rating_count
          )
        : null,

    /* =====================================================
       BACKEND IMAGE ONLY
    ===================================================== */

    image:
      item.image_url ||
      item.image ||
      null,

    imageFile:
      item.image_file ||
      null,

    /* =====================================================
       CATEGORY

       Backend list returns categories_text
    ===================================================== */

    category:
      item.categories_text ||
      item.category_name ||
      item.category ||
      item.categories?.[0]?.name ||
      "",

    categoryName:
      item.categories_text ||
      item.category_name ||
      item.category ||
      item.categories?.[0]?.name ||
      "",

    categories:
      item.categories ||
      [],
  });

/* =========================================================
   PRODUCT DETAILS MAPPER
========================================================= */

const mapProductDetails =
  (item) => {

    /* =====================================================
       VARIATIONS / SIZES
    ===================================================== */

    const variations =
      (
        item.variations ||
        []
      ).map(
        (variation) => ({
          id:
            variation.ID ??
            variation.id,

          name:
            variation.name,

          status:
            variation.status,

          price:
            variation.price != null &&
            variation.price !== ""
              ? Number(
                  variation.price
                )
              : null,

          regularPrice:
            variation.regular_price != null &&
            variation.regular_price !== ""
              ? Number(
                  variation.regular_price
                )
              : null,

          salePrice:
            variation.sale_price != null &&
            variation.sale_price !== ""
              ? Number(
                  variation.sale_price
                )
              : null,

          sku:
            variation.sku,

          stockQuantity:
            variation.stock_quantity != null &&
            variation.stock_quantity !== ""
              ? Number(
                  variation.stock_quantity
                )
              : null,

          stockStatus:
            variation.stock_status,

          size:
            variation.size,
        })
      );

    /* =====================================================
       SIZES

       ONLY BACKEND SIZES.
       NO DEFAULT SIZE.
    ===================================================== */

    const sizes = [
      ...new Set(
        variations
          .filter(
            (variation) =>
              variation.size
          )
          .map(
            (variation) =>
              variation.size
          )
      ),
    ];

    /* =====================================================
       BACKEND IMAGES
    ===================================================== */

    const images =
      (
        item.images ||
        []
      ).map(
        (img) => ({
          id:
            img.ID ??
            img.id,

          title:
            img.title,

          url:
            img.guid,

          guid:
            img.guid,

          file:
            img.file,
        })
      );

    return {
      id:
        item.ID ??
        item.id,

      name:
        item.name,

      slug:
        item.slug,

      description:
        item.description ||
        item.post_content ||
        "",

      shortDescription:
        item.short_description ||
        "",

      // status:
      //   item.status,

      // createdAt:
      //   item.created_at,
      status: 
  item.status, 

/* =====================================================
   PRODUCT TYPE
===================================================== */

productType:
  item.product_type ||
  item.productType ||
  item.type ||
  "",

createdAt: 
  item.created_at,

      updatedAt:
        item.updated_at,

      sku:
        item.sku,

      minPrice:
        item.min_price != null
          ? Number(
              item.min_price
            )
          : null,

      maxPrice:
        item.max_price != null
          ? Number(
              item.max_price
            )
          : null,

      stockStatus:
        item.stock_status,

      stockQuantity:
        item.stock_quantity != null &&
        item.stock_quantity !== ""
          ? Number(
              item.stock_quantity
            )
          : null,

      onSale:
        Boolean(
          Number(item.onsale)
        ),

      totalSales:
        item.total_sales != null
          ? Number(
              item.total_sales
            )
          : null,

      averageRating:
        item.average_rating != null
          ? Number(
              item.average_rating
            )
          : null,

      ratingCount:
        item.rating_count != null
          ? Number(
              item.rating_count
            )
          : null,

      virtual:
        Boolean(
          Number(item.virtual)
        ),

      downloadable:
        Boolean(
          Number(
            item.downloadable
          )
        ),

      variations,

      sizes,

      categories:
        item.categories ||
        [],
      
      tags:
       item.tags ||
      [],

      images,

      thumbnailId:
        item.thumbnail_id,

      galleryIds:
        item.galleryIds ||
        [],

      meta:
        item.meta ||
        [],
    };
  };

/* =========================================================
   GET PRODUCTS
========================================================= */

export const getProducts =
  async (
    params = {},
    config = {}
  ) => {

    const response =
      await axiosClient.get(
        API_ENDPOINTS.PRODUCTS,
        {
          params,
          ...config,
        }
      );

    const result =
      response.data;

    return {
      total:
        result.total,

      page:
        result.page,

      limit:
        result.limit,

      pages:
        result.pages,

      products:
        (
          result.data ||
          []
        ).map(
          mapProductListItem
        ),
    };
  };

/* =========================================================
   GET PRODUCT DETAILS
========================================================= */

export const getProductById =
  async (
    id,
    config = {}
  ) => {

    const response =
      await axiosClient.get(
        API_ENDPOINTS
          .PRODUCT_BY_ID(id),
        config
      );

    return mapProductDetails(
      response.data
    );
  };
  
  
  



  // import axiosClient
//   from "../api/axiosClient";

// import API_ENDPOINTS
//   from "../api/endpoints";

// /* =========================================================
//    PRODUCT LIST MAPPER
// ========================================================= */

// const mapProductListItem =
//   (item) => ({
//     id:
//       item.ID ??
//       item.id,

//     name:
//       item.name,

//     slug:
//       item.slug,

//     status:
//       item.status,

//     createdAt:
//       item.created_at,

//     sku:
//       item.sku,

//     /* =====================================================
//        BACKEND MIN/MAX PRICE ONLY
//     ===================================================== */

//     minPrice:
//       item.min_price != null
//         ? Number(
//             item.min_price
//           )
//         : null,

//     maxPrice:
//       item.max_price != null
//         ? Number(
//             item.max_price
//           )
//         : null,

//     /* =====================================================
//        STOCK
//     ===================================================== */

//     stockStatus:
//       item.stock_status,

//     stockQuantity:
//       item.stock_quantity != null &&
//       item.stock_quantity !== ""
//         ? Number(
//             item.stock_quantity
//           )
//         : null,

//     onSale:
//       Boolean(
//         Number(item.onsale)
//       ),

//     totalSales:
//       item.total_sales != null
//         ? Number(
//             item.total_sales
//           )
//         : null,

//     averageRating:
//       item.average_rating != null
//         ? Number(
//             item.average_rating
//           )
//         : null,

//     ratingCount:
//       item.rating_count != null
//         ? Number(
//             item.rating_count
//           )
//         : null,

//     /* =====================================================
//        BACKEND IMAGE ONLY
//     ===================================================== */

//     image:
//       item.image_url ||
//       item.image ||
//       null,

//     imageFile:
//       item.image_file ||
//       null,

//     /* =====================================================
//        CATEGORY

//        Backend list returns categories_text
//     ===================================================== */

//     category:
//       item.categories_text ||
//       item.category_name ||
//       item.category ||
//       item.categories?.[0]?.name ||
//       "",

//     categoryName:
//       item.categories_text ||
//       item.category_name ||
//       item.category ||
//       item.categories?.[0]?.name ||
//       "",

//     categories:
//       item.categories ||
//       [],
//   });

// /* =========================================================
//    PRODUCT DETAILS MAPPER
// ========================================================= */

// const mapProductDetails =
//   (item) => {

//     /* =====================================================
//        VARIATIONS / SIZES
//     ===================================================== */

//     const variations =
//       (
//         item.variations ||
//         []
//       ).map(
//         (variation) => ({
//           id:
//             variation.ID ??
//             variation.id,

//           name:
//             variation.name,

//           status:
//             variation.status,

//           price:
//             variation.price != null &&
//             variation.price !== ""
//               ? Number(
//                   variation.price
//                 )
//               : null,

//           regularPrice:
//             variation.regular_price != null &&
//             variation.regular_price !== ""
//               ? Number(
//                   variation.regular_price
//                 )
//               : null,

//           salePrice:
//             variation.sale_price != null &&
//             variation.sale_price !== ""
//               ? Number(
//                   variation.sale_price
//                 )
//               : null,

//           sku:
//             variation.sku,

//           stockQuantity:
//             variation.stock_quantity != null &&
//             variation.stock_quantity !== ""
//               ? Number(
//                   variation.stock_quantity
//                 )
//               : null,

//           stockStatus:
//             variation.stock_status,

//           size:
//             variation.size,
//         })
//       );

//     /* =====================================================
//        SIZES

//        ONLY BACKEND SIZES.
//        NO DEFAULT SIZE.
//     ===================================================== */

//     const sizes = [
//       ...new Set(
//         variations
//           .filter(
//             (variation) =>
//               variation.size
//           )
//           .map(
//             (variation) =>
//               variation.size
//           )
//       ),
//     ];

//     /* =====================================================
//        BACKEND IMAGES
//     ===================================================== */

//     const images =
//       (
//         item.images ||
//         []
//       ).map(
//         (img) => ({
//           id:
//             img.ID ??
//             img.id,

//           title:
//             img.title,

//           url:
//             img.guid,

//           guid:
//             img.guid,

//           file:
//             img.file,
//         })
//       );

//     return {
//       id:
//         item.ID ??
//         item.id,

//       name:
//         item.name,

//       slug:
//         item.slug,

//       description:
//         item.description ||
//         item.post_content ||
//         "",

//       shortDescription:
//         item.short_description ||
//         "",

//       status:
//         item.status,

//       createdAt:
//         item.created_at,

//       updatedAt:
//         item.updated_at,

//       sku:
//         item.sku,

//       minPrice:
//         item.min_price != null
//           ? Number(
//               item.min_price
//             )
//           : null,

//       maxPrice:
//         item.max_price != null
//           ? Number(
//               item.max_price
//             )
//           : null,

//       stockStatus:
//         item.stock_status,

//       stockQuantity:
//         item.stock_quantity != null &&
//         item.stock_quantity !== ""
//           ? Number(
//               item.stock_quantity
//             )
//           : null,

//       onSale:
//         Boolean(
//           Number(item.onsale)
//         ),

//       totalSales:
//         item.total_sales != null
//           ? Number(
//               item.total_sales
//             )
//           : null,

//       averageRating:
//         item.average_rating != null
//           ? Number(
//               item.average_rating
//             )
//           : null,

//       ratingCount:
//         item.rating_count != null
//           ? Number(
//               item.rating_count
//             )
//           : null,

//       virtual:
//         Boolean(
//           Number(item.virtual)
//         ),

//       downloadable:
//         Boolean(
//           Number(
//             item.downloadable
//           )
//         ),

//       variations,

//       sizes,

//       categories:
//         item.categories ||
//         [],

//       images,

//       thumbnailId:
//         item.thumbnail_id,

//       galleryIds:
//         item.galleryIds ||
//         [],

//       meta:
//         item.meta ||
//         [],
//     };
//   };

// /* =========================================================
//    GET PRODUCTS
// ========================================================= */

// export const getProducts =
//   async (
//     params = {},
//     config = {}
//   ) => {

//     const response =
//       await axiosClient.get(
//         API_ENDPOINTS.PRODUCTS,
//         {
//           params,
//           ...config,
//         }
//       );

//     const result =
//       response.data;

//     return {
//       total:
//         result.total,

//       page:
//         result.page,

//       limit:
//         result.limit,

//       pages:
//         result.pages,

//       products:
//         (
//           result.data ||
//           []
//         ).map(
//           mapProductListItem
//         ),
//     };
//   };

// /* =========================================================
//    GET PRODUCT DETAILS
// ========================================================= */

// export const getProductById =
//   async (
//     id,
//     config = {}
//   ) => {

//     const response =
//       await axiosClient.get(
//         API_ENDPOINTS
//           .PRODUCT_BY_ID(id),
//         config
//       );

//     return mapProductDetails(
//       response.data
//     );
//   };
  
  
  

