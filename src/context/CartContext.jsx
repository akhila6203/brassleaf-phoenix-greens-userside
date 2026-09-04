import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import axiosClient
  from "../api/axiosClient";

import {
  useAuth,
} from "./AuthContext";

const CartContext =
  createContext(null);

export function CartProvider({
  children,
}) {
  const {
    isAuthenticated,
    bootstrapping,
    user,
  } = useAuth();

  const [
    cart,
    setCart,
  ] =
    useState([]);

  const [
    cartLoading,
    setCartLoading,
  ] =
    useState(true);

  /*
   * Guest cart stays in React memory.
   *
   * NO localStorage
   * NO sessionStorage
   */
  const guestCartRef =
    useRef([]);

  /*
   * Prevent loading/merging the same
   * logged-in customer repeatedly.
   */
  const loadedUserRef =
    useRef(null);

  const cartClearVersionRef =
  useRef(0);
  /* =========================================================
     MERGE CARTS
  ========================================================= */

  const mergeCarts = (
    databaseCart,
    guestCart
  ) => {
    const merged =
      Array.isArray(
        databaseCart
      )
        ? [...databaseCart]
        : [];

    for (
      const guestItem
      of Array.isArray(
        guestCart
      )
        ? guestCart
        : []
    ) {
      const foundIndex =
        merged.findIndex(
          (item) =>
            item.key ===
              guestItem.key ||
            (
              String(
                item.id
              ) ===
                String(
                  guestItem.id
                ) &&
              String(
                item.size || ""
              ) ===
                String(
                  guestItem.size ||
                    ""
                )
            )
        );

      if (
        foundIndex >= 0
      ) {
        merged[
          foundIndex
        ] = {
          ...merged[
            foundIndex
          ],

          /*
           * Add guest quantity
           * to existing DB quantity.
           */
          quantity:
            Number(
              merged[
                foundIndex
              ]
                .quantity ||
                0
            ) +
            Number(
              guestItem
                .quantity ||
                0
            ),

          /*
           * Keep latest price/details.
           */
          price:
            Number(
              guestItem.price ??
                merged[
                  foundIndex
                ].price ??
                0
            ),
        };
      } else {
        merged.push(
          guestItem
        );
      }
    }

    return merged;
  };

  /* =========================================================
     LOAD / MERGE CUSTOMER CART AFTER LOGIN
  ========================================================= */

  useEffect(() => {
    let active = true;

    
    async function loadCart() {
      /*
       * Wait until AuthContext finishes
       * checking HttpOnly cookie.
       */
      if (bootstrapping) {
        return;
      }

      /* =====================================================
         GUEST
      ===================================================== */

      if (
        !isAuthenticated
      ) {
        loadedUserRef.current =
          null;

        if (active) {
          /*
           * DO NOT clear guest cart.
           */
          setCart(
            guestCartRef
              .current
          );

          setCartLoading(
            false
          );
        }

        return;
      }

      /* =====================================================
         LOGGED-IN CUSTOMER
      ===================================================== */

      const userId =
        user?.id;

      if (!userId) {
        if (active) {
          setCartLoading(
            false
          );
        }

        return;
      }

      /*
       * Same user already loaded.
       */
      if (
        loadedUserRef
          .current ===
        String(userId)
      ) {
        if (active) {
          setCartLoading(
            false
          );
        }

        return;
      }

      const loadVersion =
  cartClearVersionRef.current;
      try {
        setCartLoading(
          true
        );

        const {
          data,
        } =
          await axiosClient.get(
            "/auth/customer/cart"
          );

          if (
            loadVersion !==
            cartClearVersionRef.current
          ) {
            return;
          }
        const databaseCart =
          Array.isArray(
            data?.items
          )
            ? data.items
            : [];

        /*
         * Guest added items before login.
         */
        const guestCart =
          guestCartRef
            .current;

       const mergedCart =
  mergeCarts(
    databaseCart,
    guestCart
  );

if (!active) {
  return;
}

/*
 * clearCart() happened while
 * loadCart was running.
 *
 * Do NOT restore old cart.
 */
if (
  loadVersion !==
  cartClearVersionRef.current
) {
  return;
}

setCart(
  mergedCart
);

guestCartRef.current =
  [];

loadedUserRef.current =
  String(
    userId
  );

/*
 * clearCart() may happen after setCart()
 * but before this DB PUT.
 *
 * So check again.
 */
if (
  loadVersion !==
  cartClearVersionRef.current
) {
  return;
}

await axiosClient.put(
  "/auth/customer/cart",
  {
    items:
      mergedCart,
  }
);
      } catch (error) {
        console.error(
          "Load customer cart error:",
          error
        );

        if (active) {
          /*
           * Do not destroy guest cart
           * just because DB request failed.
           */
          setCart(
            guestCartRef
              .current
          );
        }
      } finally {
        if (active) {
          setCartLoading(
            false
          );
        }
      }
    }

    loadCart();

    return () => {
      active = false;
    };
  }, [
    isAuthenticated,
    bootstrapping,
    user?.id,
  ]);

  /* =========================================================
     SAVE CURRENT CART
  ========================================================= */

  const saveCart =
    async (items) => {
      /*
       * Guest:
       * keep only in React memory.
       */
      if (
        !isAuthenticated
      ) {
        guestCartRef.current =
          items;

        return;
      }

      /*
       * Logged-in:
       * save against current user ID
       * through protected backend endpoint.
       */
      try {
        await axiosClient.put(
          "/auth/customer/cart",
          {
            items,
          }
        );
      } catch (error) {
        console.error(
          "Save cart error:",
          error
        );
      }
    };

  /* =========================================================
     ADD TO CART

     WORKS FOR:
     - guest
     - logged-in customer
  ========================================================= */

  const addToCart =
    async (
      product,
      size = "",
      selectedPrice = null
    ) => {
      const price =
        selectedPrice != null
          ? Number(
              selectedPrice
            )
          : Number(
              product.price ??
                product
                  .minPrice ??
                product
                  .min_price ??
                0
            );

      const sizeKey =
        size || "free";

      const key =
        `${product.id}-${sizeKey}`;

      const currentCart =
        Array.isArray(
          cart
        )
          ? cart
          : [];

      const found =
        currentCart.find(
          (item) =>
            item.key ===
            key
        );

      let nextCart;

      if (found) {
        nextCart =
          currentCart.map(
            (item) =>
              item.key ===
              key
                ? {
                    ...item,

                    quantity:
                      Number(
                        item.quantity ||
                          0
                      ) +
                      1,

                    price,
                  }
                : item
          );
      } else {
        nextCart = [
          ...currentCart,

          {
            ...product,

            key,

            size,

            price,

            quantity: 1,
          },
        ];
      }

      /*
       * UI immediate update.
       */
      setCart(
        nextCart
      );

      /*
       * Guest -> memory
       * Logged in -> database
       */
      await saveCart(
        nextCart
      );

      return {
        ok: true,
      };
    };

  /* =========================================================
     UPDATE QUANTITY
  ========================================================= */

  const updateQuantity =
    async (
      key,
      quantity
    ) => {
      const safeQuantity =
        Math.max(
          1,
          Number(
            quantity
          ) || 1
        );

      const nextCart =
        cart.map(
          (item) =>
            item.key ===
            key
              ? {
                  ...item,

                  quantity:
                    safeQuantity,
                }
              : item
        );

      setCart(
        nextCart
      );

      await saveCart(
        nextCart
      );
    };

  /* =========================================================
     REMOVE
  ========================================================= */

  const removeFromCart =
    async (key) => {
      const nextCart =
        cart.filter(
          (item) =>
            item.key !==
            key
        );

      setCart(
        nextCart
      );

      await saveCart(
        nextCart
      );
    };

  /* =========================================================
     CLEAR
  ========================================================= */
  const clearCart =
  async () => {
    /*
     * Stop any old cart load
     * from restoring cart again.
     */
    cartClearVersionRef.current += 1;

    /*
     * Clear frontend cart.
     */
    setCart([]);
    guestCartRef.current = [];

    /*
     * Mark current user as already handled.
     */
    if (user?.id) {
      loadedUserRef.current =
        String(user.id);
    }

    try {
      /*
       * Clear customer's DB cart.
       */
      await axiosClient.delete(
        "/auth/customer/cart"
      );

      /*
       * Extra safety:
       * DB cart must remain empty.
       */
      await axiosClient.put(
        "/auth/customer/cart",
        {
          items: [],
        }
      );

      /*
       * Keep UI empty.
       */
      guestCartRef.current = [];
      setCart([]);
    } catch (error) {
      if (
        error?.response?.status !== 401
      ) {
        console.error(
          "Clear cart error:",
          error
        );
      }

      guestCartRef.current = [];
      setCart([]);
    }
  };
// const clearCart =
//   async () => {
//     /*
//      * Always clear UI + guest memory first.
//      */
//     setCart([]);
//     guestCartRef.current = [];

//     try {
//       await axiosClient.delete(
//         "/auth/customer/cart"
//       );
//     } catch (error) {
     
//       if (
//         error?.response?.status !== 401
//       ) {
//         console.error(
//           "Clear cart error:",
//           error
//         );
//       }
//     }
//   };


  /* =========================================================
     LOGOUT HANDLING

     User A logs out:
     do not expose User A DB cart
     to guest/User B.
  ========================================================= */

  useEffect(() => {
    if (
      bootstrapping
    ) {
      return;
    }

    if (
      !isAuthenticated
    ) {
      loadedUserRef.current =
        null;
    }
  }, [
    isAuthenticated,
    bootstrapping,
  ]);

  /* =========================================================
     TOTALS
  ========================================================= */

  const cartCount =
    useMemo(
      () =>
        cart.reduce(
          (
            sum,
            item
          ) =>
            sum +
            Number(
              item.quantity ||
                0
            ),
          0
        ),
      [cart]
    );

  const subtotal =
    useMemo(
      () =>
        cart.reduce(
          (
            sum,
            item
          ) =>
            sum +
            (
              Number(
                item.price
              ) || 0
            ) *
              Number(
                item.quantity ||
                  0
              ),
          0
        ),
      [cart]
    );

  /*
   * Keep your existing shipping rule.
   */
  const shipping =
    subtotal > 0 
    // && subtotal < 2000
      ? 150
      : 0;

  const total =
    subtotal +
    shipping;

  return (
    <CartContext.Provider
      value={{
        cart,

        cartLoading,

        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,

        cartCount,
        subtotal,
        shipping,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart =
  () =>
    useContext(
      CartContext
    );
    
    
    
    // import {
//   createContext,
//   useContext,
//   useEffect,
//   useMemo,
//   useState,
// } from "react";

// import axiosClient
//   from "../api/axiosClient";

// import { useAuth }
//   from "./AuthContext";

// const CartContext =
//   createContext(null);

// export function CartProvider({
//   children,
// }) {
//   const {
//     isAuthenticated,
//     bootstrapping,
//     user,
//   } = useAuth();

//   const [cart, setCart] =
//     useState([]);

//   const [cartLoading, setCartLoading] =
//     useState(true);

//   /*
//    * ========================================
//    * LOAD CUSTOMER CART FROM DATABASE
//    * ========================================
//    */
//   useEffect(() => {
//     let active = true;

//     async function loadCart() {
//       if (bootstrapping) {
//         return;
//       }

//       /*
//        * Guest has no DB cart.
//        */
//       if (!isAuthenticated) {
//         if (active) {
//           setCart([]);
//           setCartLoading(false);
//         }

//         return;
//       }

//       try {
//         setCartLoading(true);

//         const { data } =
//           await axiosClient.get(
//             "/auth/customer/cart"
//           );

//         if (active) {
//           setCart(
//             Array.isArray(
//               data?.items
//             )
//               ? data.items
//               : []
//           );
//         }
//       } catch (error) {
//         console.error(
//           "Load cart error:",
//           error
//         );

//         if (active) {
//           setCart([]);
//         }
//       } finally {
//         if (active) {
//           setCartLoading(false);
//         }
//       }
//     }

//     loadCart();

//     return () => {
//       active = false;
//     };
//   }, [
//     isAuthenticated,
//     bootstrapping,
//     user?.id,
//   ]);

//   /*
//    * ========================================
//    * SAVE DATABASE CART
//    * ========================================
//    */
//   const saveCart =
//     async (items) => {
//       if (!isAuthenticated) {
//         return;
//       }

//       try {
//         await axiosClient.put(
//           "/auth/customer/cart",
//           {
//             items,
//           }
//         );
//       } catch (error) {
//         console.error(
//           "Save cart error:",
//           error
//         );
//       }
//     };

//   /*
//    * ========================================
//    * ADD
//    * ========================================
//    */
//   const addToCart =
//   async (
//     product,
//     size = "",
//     selectedPrice = null
//   ) => {
//     if (!isAuthenticated) {
//       return {
//         ok: false,
//         authRequired: true,
//       };
//     }

//     const price =
//       selectedPrice != null
//         ? Number(selectedPrice)
//         : Number(
//             product.price ??
//               product.minPrice ??
//               0
//           );

//     const sizeKey =
//       size || "free";

//     const key =
//       `${product.id}-${sizeKey}`;

//     const found =
//       cart.find(
//         (item) =>
//           item.key === key
//       );

//     let nextCart;

//     if (found) {
//       nextCart =
//         cart.map((item) =>
//           item.key === key
//             ? {
//                 ...item,
//                 quantity:
//                   Number(
//                     item.quantity || 0
//                   ) + 1,
//                 price,
//               }
//             : item
//         );
//     } else {
//       nextCart = [
//         ...cart,
//         {
//           ...product,
//           key,
//           size,
//           price,
//           quantity: 1,
//         },
//       ];
//     }

//     /*
//      * Update UI immediately.
//      */
//     setCart(nextCart);

//     /*
//      * Save same cart to database.
//      */
//     await saveCart(nextCart);

//     return {
//       ok: true,
//     };
//   };
//   /*
//    * ========================================
//    * UPDATE QUANTITY
//    * ========================================
//    */
//   const updateQuantity =
//     async (
//       key,
//       quantity
//     ) => {
//       const nextCart =
//         cart.map(
//           (item) =>
//             item.key === key
//               ? {
//                   ...item,

//                   quantity:
//                     Math.max(
//                       1,
//                       Number(
//                         quantity
//                       ) || 1
//                     ),
//                 }
//               : item
//         );

//       setCart(nextCart);

//       await saveCart(
//         nextCart
//       );
//     };

//   /*
//    * ========================================
//    * REMOVE
//    * ========================================
//    */
//   const removeFromCart =
//     async (key) => {
//       const nextCart =
//         cart.filter(
//           (item) =>
//             item.key !== key
//         );

//       setCart(nextCart);

//       await saveCart(
//         nextCart
//       );
//     };

//   /*
//    * ========================================
//    * CLEAR
//    * ========================================
//    */
//   const clearCart =
//     async () => {
//       setCart([]);

//       if (
//         !isAuthenticated
//       ) {
//         return;
//       }

//       try {
//         await axiosClient.delete(
//           "/auth/customer/cart"
//         );
//       } catch (error) {
//         console.error(
//           "Clear cart error:",
//           error
//         );
//       }
//     };

//   const cartCount =
//     useMemo(
//       () =>
//         cart.reduce(
//           (sum, item) =>
//             sum +
//             Number(
//               item.quantity ||
//                 0
//             ),
//           0
//         ),
//       [cart]
//     );

//   const subtotal =
//     useMemo(
//       () =>
//         cart.reduce(
//           (sum, item) =>
//             sum +
//             (Number(
//               item.price
//             ) || 0) *
//               Number(
//                 item.quantity ||
//                   0
//               ),
//           0
//         ),
//       [cart]
//     );

//   const shipping =
//     subtotal > 0 &&
//     subtotal < 2000
//       ? 99
//       : 0;

//   const total =
//     subtotal +
//     shipping;

//   return (
//     <CartContext.Provider
//       value={{
//         cart,

//         cartLoading,

//         addToCart,
//         updateQuantity,
//         removeFromCart,
//         clearCart,

//         cartCount,
//         subtotal,
//         shipping,
//         total,
//       }}
//     >
//       {children}
//     </CartContext.Provider>
//   );
// }

// export const useCart =
//   () =>
//     useContext(CartContext);
  
  

