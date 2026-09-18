import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Download,
  Gauge,
  LogOut,
  MapPin,
  ShoppingBag,
  ShoppingCart,
  User,
} from "lucide-react";

import { useState } from "react";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

import AuthModal from "./AuthModal";
import MiniCart from "./MiniCart";
import CartDrawer
  from "./CartDrawer";

export default function Header({
  authOpen,
  onAuthClose,
  onAuthSuccess,
}) {
  const {
    cartCount,
    subtotal,
  } = useCart();

  const {
    isAuthenticated,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const isCartPage =
    location.pathname ===
    "/cart";

  const [
    cartOpen,
    setCartOpen,
  ] = useState(false);

  const [
    profileHover,
    setProfileHover,
  ] = useState(false);

  const [
  cartDrawerOpen,
  setCartDrawerOpen,
] = useState(false);

  /*
  =========================================
  PROFILE NAVIGATION
  =========================================
  */

  const goProfile = (
    tab
  ) => {
    setProfileHover(false);

    navigate(
      tab
        ? `/profile?tab=${tab}`
        : "/profile"
    );
  };

  /*
  =========================================
  LOGOUT
  =========================================
  */

  const handleLogout = () => {
    setProfileHover(false);

    logout();

    navigate("/");
  };

  return (
    <>
      <header
        className="
          fixed
          left-0
          top-0
          z-[100]
          w-full
          border-b
          border-slate-100
          bg-white
        "
      >
        <div
          className="
            container-site
            flex
            h-[82px]
            items-center
            justify-between
            gap-2

            sm:gap-4
          "
        >

          {/* =================================
              LEFT SIDE
              LOGO + HOME
          ================================= */}

          <div
            className="
              flex
              min-w-0
              items-center
              gap-3

              sm:gap-5
              md:gap-7
              lg:gap-9
            "
          >

            {/* LOGO */}

            <Link
              to="/"
              className="
                shrink-0
              "
              aria-label="Home"
            >
              <img
                // src={`${import.meta.env.BASE_URL}logo.jpg`}
                src="/logo.jpg"
                alt="School Uniforms"
                className="
                  h-12
                  w-auto
                  max-w-[240px]
                  object-contain

                  sm:h-14
                  sm:max-w-[255px]

                  md:h-16
                  md:max-w-[280px]

                  lg:max-w-none
                "
              />
            </Link>

            {/* HOME */}

            <NavLink
  to="/"
  className={({ isActive }) =>
    `
      shrink-0
      whitespace-nowrap

      text-[13px]
      sm:text-[15px]
      md:text-base

      font-bold
      transition

      ${
        isActive
          ? "text-[#D9A537]"
          : "text-[#243346] hover:text-[#D9A537]"
      }
    `
  }
>
  Home
</NavLink>

          </div>

          {/* =================================
              RIGHT SIDE
              PROFILE + CART
          ================================= */}

          <nav
            className="
              flex
              shrink-0
              items-center
              gap-1.5

              sm:gap-3
              md:gap-4
            "
          >

            {/* =================================
                PROFILE
            ================================= */}

            <div
              className="
                relative
                shrink-0
              "
              onMouseEnter={() =>
                setProfileHover(
                  true
                )
              }
              onMouseLeave={() =>
                setProfileHover(
                  false
                )
              }
            >
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/profile"
                  )
                }
                className="
                  flex
                  h-10
                  items-center
                  justify-center
                  text-[#243346]
                  transition
                  hover:text-[#D9A537]

                  sm:h-11
                "
                aria-label="Profile"
              >
                <span
                  className="
                    grid
                    h-9
                    w-9
                    place-items-center
                    rounded-full
                    bg-[#edf8f7]

                    sm:h-11
                    sm:w-11
                  "
                >
                  <User
                    size={19}
                  />
                </span>
              </button>

              {/* =================================
                  GUEST LOGIN POPUP
              ================================= */}

              {!isAuthenticated &&
                (authOpen ||
                  profileHover) && (
                  <AuthModal
                    embedded
                    onClose={() => {
                      setProfileHover(
                        false
                      );

                      onAuthClose?.();
                    }}
                    onSuccess={
                      onAuthSuccess
                    }
                  />
                )}

              {/* =================================
                  LOGGED-IN PROFILE DROPDOWN
              ================================= */}

              {isAuthenticated &&
                profileHover && (
                  <div
                    className="
                      fixed
                      left-3
                      right-3
                      top-[82px]
                      z-[250]
                      pt-2

                      sm:absolute
                      sm:left-auto
                      sm:right-0
                      sm:top-full
                      sm:w-[220px]
                      sm:pt-3
                    "
                  >
                    <div
                      className="
                        border
                        border-slate-200
                        border-t-2
                        border-t-[#D9A537]
                        bg-white
                        py-3
                        shadow-2xl
                      "
                    >

                      {/* DASHBOARD */}

                      <button
                        type="button"
                        onClick={() =>
                          goProfile(
                            "dashboard"
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-3
                          px-5
                          py-3
                          text-left
                          text-sm
                          text-[#243346]
                          transition
                          hover:bg-slate-50
                          hover:text-[#D9A537]
                        "
                      >
                        <Gauge
                          size={16}
                        />

                        Dashboard
                      </button>

                      {/* ORDERS */}

                      <button
                        type="button"
                        onClick={() =>
                          goProfile(
                            "orders"
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-3
                          px-5
                          py-3
                          text-left
                          text-sm
                          text-[#243346]
                          transition
                          hover:bg-slate-50
                          hover:text-[#D9A537]
                        "
                      >
                        <ShoppingBag
                          size={16}
                        />

                        Orders
                      </button>

                      {/* DOWNLOADS */}

                      <button
                        type="button"
                        onClick={() =>
                          goProfile(
                            "downloads"
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-3
                          px-5
                          py-3
                          text-left
                          text-sm
                          text-[#243346]
                          transition
                          hover:bg-slate-50
                          hover:text-[#D9A537]
                        "
                      >
                        <Download
                          size={16}
                        />

                        Downloads
                      </button>

                      {/* EDIT ADDRESS */}

                      <button
                        type="button"
                        onClick={() =>
                          goProfile(
                            "addresses"
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-3
                          px-5
                          py-3
                          text-left
                          text-sm
                          text-[#243346]
                          transition
                          hover:bg-slate-50
                          hover:text-[#D9A537]
                        "
                      >
                        <MapPin
                          size={16}
                        />

                        Edit Address
                      </button>

                      {/* ACCOUNT DETAILS */}

                      <button
                        type="button"
                        onClick={() =>
                          goProfile(
                            "account"
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-3
                          px-5
                          py-3
                          text-left
                          text-sm
                          text-[#243346]
                          transition
                          hover:bg-slate-50
                          hover:text-[#D9A537]
                        "
                      >
                        <User
                          size={16}
                        />

                        Account Details
                      </button>

                      {/* LOGOUT */}

                      <button
                        type="button"
                        onClick={
                          handleLogout
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-3
                          px-5
                          py-3
                          text-left
                          text-sm
                          text-[#243346]
                          transition
                          hover:bg-slate-50
                          hover:text-[#D9A537]
                        "
                      >
                        <LogOut
                          size={16}
                        />

                        Logout
                      </button>

                    </div>
                  </div>
                )}
            </div>

            {/* =================================
                CART
            ================================= */}

            <div
  className="
    relative
  "
  onMouseEnter={() =>
    setCartDrawerOpen(true)
  }
>
  <button
    type="button"
    onClick={() =>
      setCartDrawerOpen(true)
    }
    className="
      relative

      flex
      items-center
      justify-center

      text-[#243346]

      transition

      hover:text-[#D9A537]
    "
    aria-label="Open cart"
  >
    {/* KEEP YOUR EXISTING CART ICON HERE */}

    <ShoppingCart
      size={22}
    />

    {/* KEEP YOUR EXISTING CART COUNT */}

    {cartCount > 0 && (
      <span
        className="
          absolute
          -right-2
          -top-2

          flex
          h-5
          min-w-5
          items-center
          justify-center

          rounded-full

          bg-[#D9A537]

          px-1

          text-[10px]
          font-black
          text-[#243346]
        "
      >
        {cartCount}
      </span>
    )}
  </button>
</div>

          </nav>
        </div>
      </header>

      {/* =================================
          FIXED HEADER SPACE
      ================================= */}
 <div
        className="
          h-[82px]
          w-full
        "
      />

      {/* =================================
          RIGHT SIDE CART DRAWER
      ================================= */}

      <CartDrawer
        open={cartDrawerOpen}
        onClose={() =>
          setCartDrawerOpen(false)
        }
      />
    </>
  );
}



// import {
//   Link,
//   NavLink,
//   useLocation,
//   useNavigate,
// } from "react-router-dom";

// import {
//   Download,
//   Gauge,
//   LogOut,
//   MapPin,
//   ShoppingBag,
//   ShoppingCart,
//   User,
// } from "lucide-react";

// import { useState } from "react";

// import { useCart } from "../context/CartContext";
// import { useAuth } from "../context/AuthContext";

// import AuthModal from "./AuthModal";
// import MiniCart from "./MiniCart";

// export default function Header({
//   authOpen,
//   onAuthClose,
//   onAuthSuccess,
// }) {
//   const {
//     cartCount,
//     subtotal,
//   } = useCart();

//   const {
//     isAuthenticated,
//     logout,
//   } = useAuth();

//   const navigate =
//     useNavigate();

//   const location =
//     useLocation();

//   const isCartPage =
//     location.pathname ===
//     "/cart";

//   const [
//     cartOpen,
//     setCartOpen,
//   ] = useState(false);

//   const [
//     profileHover,
//     setProfileHover,
//   ] = useState(false);

//   /*
//   =========================================
//   PROFILE NAVIGATION
//   =========================================
//   */

//   const goProfile = (
//     tab
//   ) => {
//     setProfileHover(false);

//     navigate(
//       tab
//         ? `/profile?tab=${tab}`
//         : "/profile"
//     );
//   };

//   /*
//   =========================================
//   LOGOUT
//   =========================================
//   */

//   const handleLogout = () => {
//     setProfileHover(false);

//     logout();

//     navigate("/");
//   };

//   return (
//     <>
//       <header
//         className="
//           fixed
//           left-0
//           top-0
//           z-[100]
//           w-full
//           border-b
//           border-slate-100
//           bg-white
//         "
//       >
//         <div
//           className="
//             container-site
//             flex
//             h-[82px]
//             items-center
//             justify-between
//             gap-2

//             sm:gap-4
//           "
//         >

//           {/* =================================
//               LEFT SIDE
//               LOGO + HOME
//           ================================= */}

//           <div
//             className="
//               flex
//               min-w-0
//               items-center
//               gap-3

//               sm:gap-5
//               md:gap-7
//               lg:gap-9
//             "
//           >

//             {/* LOGO */}

//             <Link
//               to="/"
//               className="
//                 shrink-0
//               "
//               aria-label="Home"
//             >
//               <img
//                 src="/logo.jpg"
//                 alt="School Uniforms"
//                 className="
//                   h-12
//                   w-auto
//                   max-w-[240px]
//                   object-contain

//                   sm:h-14
//                   sm:max-w-[255px]

//                   md:h-16
//                   md:max-w-[280px]

//                   lg:max-w-none
//                 "
//               />
//             </Link>

//             {/* HOME */}

//             <NavLink
//   to="/"
//   className={({ isActive }) =>
//     `
//       shrink-0
//       whitespace-nowrap

//       text-[13px]
//       sm:text-[15px]
//       md:text-base

//       font-bold
//       transition

//       ${
//         isActive
//           ? "text-[#D9A537]"
//           : "text-[#243346] hover:text-[#D9A537]"
//       }
//     `
//   }
// >
//   Home
// </NavLink>

//           </div>

//           {/* =================================
//               RIGHT SIDE
//               PROFILE + CART
//           ================================= */}

//           <nav
//             className="
//               flex
//               shrink-0
//               items-center
//               gap-1.5

//               sm:gap-3
//               md:gap-4
//             "
//           >

//             {/* =================================
//                 PROFILE
//             ================================= */}

//             <div
//               className="
//                 relative
//                 shrink-0
//               "
//               onMouseEnter={() =>
//                 setProfileHover(
//                   true
//                 )
//               }
//               onMouseLeave={() =>
//                 setProfileHover(
//                   false
//                 )
//               }
//             >
//               <button
//                 type="button"
//                 onClick={() =>
//                   navigate(
//                     "/profile"
//                   )
//                 }
//                 className="
//                   flex
//                   h-10
//                   items-center
//                   justify-center
//                   text-[#243346]
//                   transition
//                   hover:text-[#D9A537]

//                   sm:h-11
//                 "
//                 aria-label="Profile"
//               >
//                 <span
//                   className="
//                     grid
//                     h-9
//                     w-9
//                     place-items-center
//                     rounded-full
//                     bg-[#edf8f7]

//                     sm:h-11
//                     sm:w-11
//                   "
//                 >
//                   <User
//                     size={19}
//                   />
//                 </span>
//               </button>

//               {/* =================================
//                   GUEST LOGIN POPUP
//               ================================= */}

//               {!isAuthenticated &&
//                 (authOpen ||
//                   profileHover) && (
//                   <AuthModal
//                     embedded
//                     onClose={() => {
//                       setProfileHover(
//                         false
//                       );

//                       onAuthClose?.();
//                     }}
//                     onSuccess={
//                       onAuthSuccess
//                     }
//                   />
//                 )}

//               {/* =================================
//                   LOGGED-IN PROFILE DROPDOWN
//               ================================= */}

//               {isAuthenticated &&
//                 profileHover && (
//                   <div
//                     className="
//                       fixed
//                       left-3
//                       right-3
//                       top-[82px]
//                       z-[250]
//                       pt-2

//                       sm:absolute
//                       sm:left-auto
//                       sm:right-0
//                       sm:top-full
//                       sm:w-[220px]
//                       sm:pt-3
//                     "
//                   >
//                     <div
//                       className="
//                         border
//                         border-slate-200
//                         border-t-2
//                         border-t-[#D9A537]
//                         bg-white
//                         py-3
//                         shadow-2xl
//                       "
//                     >

//                       {/* DASHBOARD */}

//                       <button
//                         type="button"
//                         onClick={() =>
//                           goProfile(
//                             "dashboard"
//                           )
//                         }
//                         className="
//                           flex
//                           w-full
//                           items-center
//                           gap-3
//                           px-5
//                           py-3
//                           text-left
//                           text-sm
//                           text-[#243346]
//                           transition
//                           hover:bg-slate-50
//                           hover:text-[#D9A537]
//                         "
//                       >
//                         <Gauge
//                           size={16}
//                         />

//                         Dashboard
//                       </button>

//                       {/* ORDERS */}

//                       <button
//                         type="button"
//                         onClick={() =>
//                           goProfile(
//                             "orders"
//                           )
//                         }
//                         className="
//                           flex
//                           w-full
//                           items-center
//                           gap-3
//                           px-5
//                           py-3
//                           text-left
//                           text-sm
//                           text-[#243346]
//                           transition
//                           hover:bg-slate-50
//                           hover:text-[#D9A537]
//                         "
//                       >
//                         <ShoppingBag
//                           size={16}
//                         />

//                         Orders
//                       </button>

//                       {/* DOWNLOADS */}

//                       <button
//                         type="button"
//                         onClick={() =>
//                           goProfile(
//                             "downloads"
//                           )
//                         }
//                         className="
//                           flex
//                           w-full
//                           items-center
//                           gap-3
//                           px-5
//                           py-3
//                           text-left
//                           text-sm
//                           text-[#243346]
//                           transition
//                           hover:bg-slate-50
//                           hover:text-[#D9A537]
//                         "
//                       >
//                         <Download
//                           size={16}
//                         />

//                         Downloads
//                       </button>

//                       {/* EDIT ADDRESS */}

//                       <button
//                         type="button"
//                         onClick={() =>
//                           goProfile(
//                             "addresses"
//                           )
//                         }
//                         className="
//                           flex
//                           w-full
//                           items-center
//                           gap-3
//                           px-5
//                           py-3
//                           text-left
//                           text-sm
//                           text-[#243346]
//                           transition
//                           hover:bg-slate-50
//                           hover:text-[#D9A537]
//                         "
//                       >
//                         <MapPin
//                           size={16}
//                         />

//                         Edit Address
//                       </button>

//                       {/* ACCOUNT DETAILS */}

//                       <button
//                         type="button"
//                         onClick={() =>
//                           goProfile(
//                             "account"
//                           )
//                         }
//                         className="
//                           flex
//                           w-full
//                           items-center
//                           gap-3
//                           px-5
//                           py-3
//                           text-left
//                           text-sm
//                           text-[#243346]
//                           transition
//                           hover:bg-slate-50
//                           hover:text-[#D9A537]
//                         "
//                       >
//                         <User
//                           size={16}
//                         />

//                         Account Details
//                       </button>

//                       {/* LOGOUT */}

//                       <button
//                         type="button"
//                         onClick={
//                           handleLogout
//                         }
//                         className="
//                           flex
//                           w-full
//                           items-center
//                           gap-3
//                           px-5
//                           py-3
//                           text-left
//                           text-sm
//                           text-[#243346]
//                           transition
//                           hover:bg-slate-50
//                           hover:text-[#D9A537]
//                         "
//                       >
//                         <LogOut
//                           size={16}
//                         />

//                         Logout
//                       </button>

//                     </div>
//                   </div>
//                 )}
//             </div>

//             {/* =================================
//                 CART
//             ================================= */}

//             <div
//               className="
//                 relative
//                 shrink-0
//               "
//               onMouseEnter={() => {
//                 if (
//                   !isCartPage
//                 ) {
//                   setCartOpen(
//                     true
//                   );
//                 }
//               }}
//               onMouseLeave={() =>
//                 setCartOpen(
//                   false
//                 )
//               }
//             >
//               <Link
//                 to="/cart"
//                 onClick={() =>
//                   setCartOpen(
//                     false
//                   )
//                 }
//                 className="
//                   flex
//                   h-10
//                   items-center
//                   gap-1
//                   text-[#243346]
//                   transition
//                   hover:text-[#D9A537]

//                   sm:h-11
//                   sm:gap-2
//                 "
//                 aria-label="Cart"
//               >

//                 {/* CART ICON */}

//                 <span
//                   className="
//                     relative
//                     grid
//                     h-9
//                     w-9
//                     shrink-0
//                     place-items-center
//                     rounded-full
//                     bg-[#f7eee7]

//                     sm:h-11
//                     sm:w-11
//                   "
//                 >
//                   <ShoppingCart
//                     size={19}
//                   />

//                   {/* CART COUNT */}

//                   {cartCount >
//                     0 && (
//                     <span
//                       className="
//                         absolute
//                         -right-1
//                         -top-1
//                         flex
//                         h-5
//                         min-w-5
//                         items-center
//                         justify-center
//                         rounded-full
//                         bg-[#D9A537]
//                         px-1
//                         text-[10px]
//                         font-black
//                         text-white
//                       "
//                     >
//                       {cartCount}
//                     </span>
//                   )}
//                 </span>

//                 {/* =================================
//                     CART AMOUNT
//                     HIDDEN ON SMALL MOBILE
//                 ================================= */}

//                 <span
//                   className="
//                     hidden
//                     min-w-[78px]
//                     whitespace-nowrap
//                     text-sm
//                     font-black

//                     sm:inline
//                   "
//                 >
//                   ₹
//                   {Number(
//                     subtotal || 0
//                   ).toFixed(2)}
//                 </span>

//               </Link>

//               {/* =================================
//                   MINI CART
//               ================================= */}

//               {cartOpen &&
//                 !isCartPage && (
//                   <MiniCart
//                     onClose={() =>
//                       setCartOpen(
//                         false
//                       )
//                     }
//                   />
//                 )}

//             </div>

//           </nav>
//         </div>
//       </header>

//       {/* =================================
//           FIXED HEADER SPACE
//       ================================= */}

//       <div
//         className="
//           h-[82px]
//           w-full
//         "
//       />
//     </>
//   );
// }

