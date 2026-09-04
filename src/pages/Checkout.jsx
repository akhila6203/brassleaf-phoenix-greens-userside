import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

import AddressForm from "../components/AddressForm";

import {
  EMPTY_ADDRESS,
  getDefaultAddress,
} from "../utils/addressStorage";

import {
  loadCheckoutDraft,
  saveCheckoutDraft,
} from "../utils/checkoutDraft";

import axiosClient from "../api/axiosClient";

import {
  payOrderWithPaytm,
} from "../services/paymentService";

/* =========================================================
   REQUIRED FIELD LABELS
========================================================= */

const labels = {
  firstName:
    "Billing Student First Name",

  lastName:
    "Billing Student Last Name",

  address:
    "Billing Street address",

  city:
    "Billing Town / City",

  pincode:
    "Billing PIN Code",

  phone:
    "Billing Phone",

  email:
    "Billing Email address",

  admissionNo:
    "Billing Student Admission No.",

  parentName:
    "Billing Parent name",
};

/* =========================================================
   CHECKOUT
========================================================= */

export default function Checkout() {
  const navigate =
    useNavigate();

  /* =======================================================
     AUTH
  ======================================================= */

  const {
    isAuthenticated,

    login,

    /*
     * These 2 functions must be added
     * in AuthContext.jsx as given before.
     */
    checkCustomerEmail,
    checkoutRegister,
  } = useAuth();

  /* =======================================================
     CART
  ======================================================= */

  const {
    cart,
    subtotal,
    shipping,
    total,

    /*
     * IMPORTANT:
     * Do not clear cart immediately
     * when pending order is created.
     *
     * Clear after successful Paytm payment.
     */
    clearCart,
  } = useCart();

  /* =======================================================
     BILLING FORM
  ======================================================= */

  const [
    form,
    setForm,
  ] = useState({
    ...EMPTY_ADDRESS,

    studentClass:
      EMPTY_ADDRESS
        ?.studentClass ||
      "Nursery",

    country:
      EMPTY_ADDRESS
        ?.country ||
      "India",

    state:
      EMPTY_ADDRESS
        ?.state ||
      "Telangana",
  });

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    errors,
    setErrors,
  ] = useState({});

  /* =======================================================
     RETURNING CUSTOMER LOGIN
  ======================================================= */

  const [
    showCheckoutLogin,
    setShowCheckoutLogin,
  ] = useState(false);

  const [
    checkoutLogin,
    setCheckoutLogin,
  ] = useState({
    email: "",
    password: "",
  });

  const [
    loginError,
    setLoginError,
  ] = useState("");

  const [
    loginLoading,
    setLoginLoading,
  ] = useState(false);

  /* =======================================================
     GUEST CHECKOUT ACCOUNT PASSWORD
  ======================================================= */

  const [
    accountPassword,
    setAccountPassword,
  ] = useState("");

  const [
    showAccountPassword,
    setShowAccountPassword,
  ] = useState(false);

  /* =======================================================
     CHECKOUT MESSAGE
  ======================================================= */

  const [
    checkoutError,
    setCheckoutError,
  ] = useState("");

  const [
    checkoutLoading,
    setCheckoutLoading,
  ] = useState(false);

  /* =======================================================
     TAX

     Product subtotal already contains tax.
  ======================================================= */

  const cgst =
    (Number(subtotal) *
      2.5) /
    105;

  const sgst =
    (Number(subtotal) *
      2.5) /
    105;

  /* =======================================================
     LOAD LOGGED-IN CUSTOMER FROM DATABASE

     NO localStorage
     NO sessionStorage
  ======================================================= */

  const loadCustomerDetails =
    async () => {
      try {
        const {
          data,
        } =
          await axiosClient.get(
            "/auth/customer/me"
          );

        const customer =
          data?.user;

        if (!customer) {
          return;
        }

        const billing =
          customer
            ?.billingAddress ||
          {};

        setForm(
          (previous) => ({
            ...previous,

            firstName:
              billing.firstName ||
              customer
                ?.firstName ||
              previous.firstName ||
              "",

            lastName:
              billing.lastName ||
              customer
                ?.lastName ||
              previous.lastName ||
              "",

            // email:
            //   billing.email ||
            //   customer?.email ||
            //   previous.email ||
            //   "",
            email:
  String(
    billing.email ||
    customer?.email ||
    previous.email ||
    ""
  ).toLowerCase(),

            phone:
              billing.phone ||
              customer?.phone ||
              previous.phone ||
              "",

            /*
             * AddressForm currently
             * uses "address".
             */
            address:
              billing.address1 ||
              previous.address ||
              "",

            address2:
              billing.address2 ||
              previous.address2 ||
              "",

            city:
              billing.city ||
              previous.city ||
              "",

            state:
              billing.state ||
              previous.state ||
              "Telangana",

            pincode:
              billing.postcode ||
              previous.pincode ||
              "",

            country:
              billing.country ===
              "IN"
                ? "India"
                : billing.country ||
                  previous.country ||
                  "India",

            studentClass:
              billing
                .studentClass ||
              previous
                .studentClass ||
              "Nursery",

            admissionNo:
              billing.admissionNo ||
              previous.admissionNo ||
              "",

            parentName:
              billing.parentName ||
              previous.parentName ||
              "",
          })
        );
      } catch (error) {
        /*
         * Guest gets 401 here only if
         * this is called accidentally.
         */
        if (
          error?.response
            ?.status !== 401
        ) {
          console.error(
            "Checkout customer load error:",
            error
          );
        }
      }
    };

  /* =======================================================
     LOGGED-IN CUSTOMER:
     LOAD DB ADDRESS WHEN CHECKOUT OPENS
  ======================================================= */

  useEffect(() => {
    const draft = loadCheckoutDraft();

    if (draft?.form) {
      setForm((previous) => ({
        ...previous,
        ...draft.form,
      }));

      if (draft.notes) {
        setNotes(draft.notes);
      }
    }
  }, []);

  useEffect(() => {
    if (loadCheckoutDraft()?.form) {
      return;
    }

    if (isAuthenticated) {
      loadCustomerDetails();

      setAccountPassword("");
      setShowAccountPassword(false);
      setShowCheckoutLogin(false);
      setCheckoutError("");
      return;
    }

    const savedAddress = getDefaultAddress();

    if (savedAddress) {
      setForm((previous) => ({
        ...previous,
        firstName: savedAddress.firstName || previous.firstName,
        lastName: savedAddress.lastName || previous.lastName,
        // email: savedAddress.email || previous.email,
        email:
  String(
    savedAddress.email ||
    previous.email ||
    ""
  ).toLowerCase(),
        phone: savedAddress.phone || previous.phone,
        address: savedAddress.address || previous.address,
        address2: savedAddress.address2 || previous.address2,
        city: savedAddress.city || previous.city,
        state: savedAddress.state || previous.state || "Telangana",
        pincode: savedAddress.pincode || previous.pincode,
        country: savedAddress.country || previous.country || "India",
        studentClass: savedAddress.studentClass || previous.studentClass || "Nursery",
        admissionNo: savedAddress.admissionNo || previous.admissionNo,
        parentName: savedAddress.parentName || previous.parentName,
      }));
    }
  }, [isAuthenticated]);

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validate =
    () => {
      const next = {};

      [
        "firstName",
        "lastName",
        "address",
        "city",
        "pincode",
        "phone",
        "email",
        "admissionNo",
        "parentName",
      ].forEach(
        (key) => {
          if (
            !String(
              form[key] || ""
            ).trim()
          ) {
            next[key] =
              `${labels[key]} is a required field.`;
          }
        }
      );

      // if (
      //   form.email &&
      //   !/^\S+@\S+\.\S+$/.test(
      //     form.email
      //   )
      // ) {
      //   next.email =
      //     "Please enter a valid email address.";
      // }
      const phone =
  String(
    form.phone || ""
  ).trim();

if (
  phone &&
  !/^\d{10}$/.test(phone)
) {
  next.phone =
    "Phone number must be exactly 10 digits.";
}

const email =
  String(
    form.email || ""
  ).trim();

if (
  email &&
  !/^[a-z0-9._%+-]+@gmail\.com$/.test(
    email
  )
) {
  next.email =
    "Email must be lowercase and end with @gmail.com.";
}

      setErrors(next);

      if (
        Object.keys(next)
          .length
      ) {
        window.scrollTo({
          top: 0,
          behavior:
            "smooth",
        });
      }

      return (
        Object.keys(next)
          .length === 0
      );
    };

  /* =======================================================
     RETURNING CUSTOMER INLINE LOGIN

     LOGIN SUCCESS:
     - stay on Checkout
     - load customer DB address
     - hide account-password field
  ======================================================= */

  const handleCheckoutLogin =
    async (event) => {
      event.preventDefault();

      if (loginLoading) {
        return;
      }

      setLoginError("");
      setCheckoutError("");

      const email =
        String(
          checkoutLogin
            .email ||
            form.email ||
            ""
        )
          .trim()
          .toLowerCase();

      const password =
        checkoutLogin
          .password;

      if (!email) {
        setLoginError(
          "Please enter your email address."
        );

        return;
      }

      if (!password) {
        setLoginError(
          "Please enter your password."
        );

        return;
      }

      setLoginLoading(true);

      try {
        /*
         * IMPORTANT:
         *
         * Current AuthContext login should
         * accept:
         *
         * login({
         *   email,
         *   password,
         * })
         */
        const result =
          await login({
            email,
            password,
          });

        if (!result?.ok) {
          setLoginError(
            result?.message ||
              "Invalid email or password."
          );

          return;
        }

        /*
         * Login successful.
         * DO NOT navigate to profile.
         * Stay on checkout.
         */
        setShowCheckoutLogin(
          false
        );

        setLoginError("");

        setCheckoutError(
          ""
        );

        setAccountPassword(
          ""
        );

        setShowAccountPassword(
          false
        );

        /*
         * Fetch DB customer
         * address immediately.
         */
        await loadCustomerDetails();
      } catch (error) {
        setLoginError(
          error?.response
            ?.data
            ?.message ||
            error?.message ||
            "Invalid email or password."
        );
      } finally {
        setLoginLoading(false);
      }
    };

  /* =======================================================
     FORGOT PASSWORD FROM CHECKOUT
  ======================================================= */

  const goToForgotPassword =
    () => {
      navigate(
        "/forgot-password",
        {
          state: {
            email:
              checkoutLogin
                .email ||
              form.email ||
              "",

            /*
             * ForgotPassword page can
             * return customer to checkout.
             */
            returnTo:
              "/checkout",
          },
        }
      );
    };

  /* =======================================================
     SAVE BILLING ADDRESS / PROFILE INTO DATABASE

     Existing wp_users / wp_usermeta only.
     NO new table needed.
  ======================================================= */

  const saveCustomerBillingDetails =
    async () => {
      const {
        data,
      } =
        await axiosClient.put(
          "/auth/customer/me",
          {
            firstName:
              form.firstName,

            lastName:
              form.lastName,

            displayName:
              `${form.firstName} ${form.lastName}`
                .trim(),

            email:
              form.email,

            billingAddress: {
              firstName:
                form.firstName,

              lastName:
                form.lastName,

              email:
                form.email,

              phone:
                form.phone,

              address1:
                form.address,

              address2:
                form.address2 ||
                "",

              city:
                form.city,

              state:
                form.state,

              postcode:
                form.pincode,

              /*
               * WooCommerce normally
               * stores India as IN.
               */
              country:
                "IN",

              studentClass:
                form.studentClass,

              admissionNo:
                form.admissionNo,

              parentName:
                form.parentName,
            },
          }
        );

      return data?.user;
    };

  /* =======================================================
     CREATE DATABASE ORDER

     EXPECTED BACKEND ROUTE:
       POST /api/customer/orders

     IMPORTANT:
     Backend must derive customer_id
     from req.user.id.
     Frontend does NOT send customerId.
  ======================================================= */

  const createPendingOrder =
    async () => {
      const payload = {
        subtotal:
          Number(subtotal),

        shipping:
          Number(shipping),

        total:
          Number(total),

        cgst:
          Number(cgst),

        sgst:
          Number(sgst),

        paymentMethod:
          "paytm",

        paymentMethodTitle:
          "Paytm Payment Gateway",

        status:
          "pending",

        notes,

        billing: {
          firstName:
            form.firstName,

          lastName:
            form.lastName,

          studentClass:
            form.studentClass,

          country:
            "IN",

          address1:
            form.address,

          address2:
            form.address2 ||
            "",

          city:
            form.city,

          state:
            form.state,

          postcode:
            form.pincode,

          phone:
            form.phone,

          email:
            form.email,

          admissionNo:
            form.admissionNo,

          parentName:
            form.parentName,
        },

        items:
          cart.map(
            (item) => ({
              /*
               * Keep current cart data,
               * backend should validate
               * product/price itself.
               */
              key:
                item.key,

              productId:
                item.id,

              variationId:
                item.variationId ||
                item
                  .variation_id ||
                null,

              name:
                item.name,

              image:
                item.image,

              size:
                item.size ||
                "",

              quantity:
                Number(
                  item.quantity
                ),

              price:
                Number(
                  item.price
                ),
            })
          ),
      };

      const {
        data,
      } =
        await axiosClient.post(
          "/customer/orders",
          payload
        );

      /*
       * Supports common response shapes:
       *
       * { order: {...} }
       * { data: { order: {...} } }
       * direct order object
       */
      return (
        data?.order ||
        data?.data?.order ||
        data?.data ||
        data
      );
    };

  /* =======================================================
     PLACE ORDER
  ======================================================= */

  const submit =
    async (event) => {
      event.preventDefault();

      if (
        checkoutLoading
      ) {
        return;
      }

      if (!cart.length) {
        navigate("/");

        return;
      }

      setCheckoutError("");

      if (!validate()) {
        return;
      }

      setCheckoutLoading(true);

      try {
        let customerIsReady =
          isAuthenticated;

        /* ===============================================
           CASE 1 + CASE 2:
           USER IS NOT LOGGED IN
        =============================================== */

        if (
          !customerIsReady
        ) {
          /*
           * Check email against
           * existing customer DB.
           */
          const emailCheck =
            await checkCustomerEmail(
              form.email
            );

          if (
            !emailCheck?.ok
          ) {
            setCheckoutError(
              emailCheck
                ?.message ||
                "Unable to verify your email address."
            );

            window.scrollTo({
              top: 0,
              behavior:
                "smooth",
            });

            return;
          }

          /* =============================================
             CASE 1:
             EMAIL ALREADY REGISTERED
          ============================================= */

          if (
            emailCheck.exists
          ) {
            setCheckoutError(
              "An account is already registered with your email address."
            );

            /*
             * Pre-fill inline login
             * with checkout email.
             */
            setCheckoutLogin(
              (previous) => ({
                ...previous,

                email:
                  String(
                    form.email ||
                      ""
                  )
                    .trim()
                    .toLowerCase(),
              })
            );

            /*
             * Do not automatically open
             * if you want exact Woo style.
             * User clicks "Please log in."
             */
            window.scrollTo({
              top: 0,
              behavior:
                "smooth",
            });

            return;
          }

          /* =============================================
             CASE 2:
             NEW EMAIL

             Require Create Account Password.
          ============================================= */

          if (
            !accountPassword
          ) {
            setCheckoutError(
              "Create account password is a required field."
            );

            setShowAccountPassword(
              true
            );

            window.scrollTo({
              top: 0,
              behavior:
                "smooth",
            });

            return;
          }

          if (
            accountPassword
              .length < 8
          ) {
            setCheckoutError(
              "Create account password must be at least 8 characters."
            );

            setShowAccountPassword(
              true
            );

            window.scrollTo({
              top: 0,
              behavior:
                "smooth",
            });

            return;
          }

          /*
           * Create customer using
           * checkout-entered password.
           *
           * Backend:
           * - create DB customer
           * - save password hash
           * - set HttpOnly customer cookie
           * - return user
           *
           * NO email Set Password step
           * for checkout-created customer.
           */
          const registration =
            await checkoutRegister({
              firstName:
                form.firstName,

              lastName:
                form.lastName,

              email:
                form.email,

              password:
                accountPassword,
            });

          if (
            !registration?.ok
          ) {
            /*
             * Race-condition protection:
             * email could have become
             * registered between check
             * and registration.
             */
            if (
              registration
                ?.status ===
                409
            ) {
              setCheckoutError(
                "An account is already registered with your email address."
              );

              setCheckoutLogin(
                (previous) => ({
                  ...previous,

                  email:
                    form.email,
                })
              );
            } else {
              setCheckoutError(
                registration
                  ?.message ||
                  "Unable to create your account."
              );
            }

            window.scrollTo({
              top: 0,
              behavior:
                "smooth",
            });

            return;
          }

          /*
           * Cookie is now set.
           * This request can immediately
           * access authenticated endpoints.
           */
          customerIsReady =
            true;

          setAccountPassword(
            ""
          );

          setShowAccountPassword(
            false
          );
        }

        /* ===============================================
           LOGGED-IN CUSTOMER / NEW CHECKOUT CUSTOMER:
           SAVE ADDRESS TO DATABASE
        =============================================== */

        if (
          customerIsReady
        ) {
          await saveCustomerBillingDetails();
        }

        /* ===============================================
           CREATE REAL PENDING PAYMENT ORDER IN DATABASE
        =============================================== */

        const order =
          await createPendingOrder();

        const orderId =
          order?.id ||
          order?.ID ||
          order?.orderId ||
          order?.order_id;

        if (!orderId) {
          throw new Error(
            "Order was created but order ID was not returned."
          );
        }
        saveCheckoutDraft({
          form,
          notes,
        });

        // await clearCart();

        const goToPayPage = () => {
          navigate(
            `/pay-for-order/${orderId}?source=checkout`,
            {
              replace: true,
              state: { order },
            }
          );
        };

        try {
          await payOrderWithPaytm(orderId, {
            onSuccess: async () => {
               await clearCart();
              clearCheckoutDraft();
              navigate(
                `/order-success?orderId=${orderId}`,
                { replace: true }
              );
            },

            // onFailure: () => {
            //   goToPayPage();
            // },
            onFailure: async () => {
              await clearCart();

              goToPayPage();
            },
          });
        // } catch {
        //   goToPayPage();
        // }
        } catch {
          await clearCart();
          goToPayPage();
        }
      } catch (error) {
        console.error(
          "Checkout error:",
          error
        );

        const message =
          error?.response
            ?.data
            ?.message ||
          error?.response
            ?.data
            ?.error ||
          error?.message ||
          "Unable to place your order. Please try again.";

        setCheckoutError(
          message
        );

        window.scrollTo({
          top: 0,
          behavior:
            "smooth",
        });
      } finally {
        setCheckoutLoading(
          false
        );
      }
    };

  /* =======================================================
     EMPTY CART
  ======================================================= */

  if (!cart.length) {
    return (
      <main className="container-site py-24 text-center">

        <h1 className="text-3xl font-black text-[#243346]">
          Your cart is empty
        </h1>

      </main>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="bg-white">

      <div className="container-site py-8 sm:py-12">

        {/* =================================================
            CHECKOUT GENERAL ERRORS
        ================================================= */}

        {Object.keys(errors)
          .length > 0 && (
          <div className="
            mb-9
            border-l-4
            border-red-700
            bg-[#e93b1d]
            px-6
            py-4
            text-sm
            font-bold
            text-white
          ">
            {Object.values(
              errors
            ).map(
              (
                message,
                index
              ) => (
                <p
                  key={
                    index
                  }
                  className="py-0.5"
                >
                  {message}
                </p>
              )
            )}
          </div>
        )}

        {/* =================================================
            RETURNING CUSTOMER BAR

            Guest only.
        ================================================= */}

        {!isAuthenticated && (
          <div className="mb-7">

            <button
              type="button"
              onClick={() => {
                setShowCheckoutLogin(
                  (previous) =>
                    !previous
                );

                /*
                 * Use Billing email
                 * automatically.
                 */
                if (
                  form.email &&
                  !checkoutLogin
                    .email
                ) {
                  setCheckoutLogin(
                    (previous) => ({
                      ...previous,

                      email:
                        form.email,
                    })
                  );
                }
              }}
              className="
                w-full
                bg-[#3fa1d1]
                px-7
                py-4
                text-left
                text-sm
                font-bold
                text-white
                transition
                hover:bg-[#3695c4]
              "
            >
              Returning customer?
              Click here to login
            </button>

            {/* =============================================
                INLINE CHECKOUT LOGIN
            ============================================= */}

            {showCheckoutLogin && (
              <form
                onSubmit={
                  handleCheckoutLogin
                }
                className="
                  mx-auto
                  max-w-2xl
                  px-4
                  py-8
                  sm:px-8
                "
              >

                <p className="
                  mb-6
                  text-sm
                  font-semibold
                  leading-6
                  text-[#243346]
                ">
                  If you have
                  shopped with us
                  before, please
                  enter your
                  details below.
                  If you are a new
                  customer, please
                  proceed to the
                  Billing section.
                </p>

                <div className="
                  grid
                  gap-5
                  sm:grid-cols-2
                ">

                  {/* Email */}

                  <label className="block">

                    <span className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-[#243346]
                    ">
                      Username or email{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </span>

                    <input
                      type="email"
                      value={
                        checkoutLogin
                          .email
                      }
                      onChange={(
                        event
                      ) =>
                        setCheckoutLogin(
                          (
                            previous
                          ) => ({
                            ...previous,

                            email:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className="
                        input-field
                        h-12
                        rounded-sm
                      "
                    />

                  </label>

                  {/* Password */}

                  <label className="block">

                    <span className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-[#243346]
                    ">
                      Password{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </span>

                    <input
                      type="password"
                      value={
                        checkoutLogin
                          .password
                      }
                      onChange={(
                        event
                      ) =>
                        setCheckoutLogin(
                          (
                            previous
                          ) => ({
                            ...previous,

                            password:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className="
                        input-field
                        h-12
                        rounded-sm
                      "
                    />

                  </label>

                </div>

                {/* Login error */}

                {loginError && (
                  <p className="
                    mt-4
                    bg-red-50
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-red-700
                  ">
                    {loginError}
                  </p>
                )}

                {/* Remember me display */}

                <label className="
                  mt-5
                  flex
                  items-center
                  gap-2
                  text-sm
                  text-[#243346]
                ">
                  <input
                    type="checkbox"
                  />

                  Remember me
                </label>

                {/* Login button */}

                <button
                  type="submit"
                  disabled={
                    loginLoading
                  }
                  className="
                    mt-5
                    w-full
                    bg-[#ff7900]
                    px-5
                    py-3
                    font-bold
                    text-white
                    transition
                    hover:bg-[#e96f00]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {loginLoading
                    ? "Logging in..."
                    : "Login"}
                </button>

                {/* Forgot password */}

                <button
                  type="button"
                  onClick={
                    goToForgotPassword
                  }
                  className="
                    mt-5
                    font-bold
                    text-[#ff7900]
                    hover:underline
                  "
                >
                  Lost your password?
                </button>

              </form>
            )}

          </div>
        )}

        {/* =================================================
            EXISTING EMAIL WARNING

            Screenshot style:
            An account is already registered...
            Please log in.
        ================================================= */}

        {checkoutError && (
          <div className="
            mb-9
            border-l-4
            border-[#c92d13]
            bg-[#e93b1d]
            px-7
            py-4
            text-sm
            font-bold
            text-white
          ">

            <span>
              {checkoutError}
            </span>

            {checkoutError
              .toLowerCase()
              .includes(
                "already registered"
              ) && (
              <>
                {" "}

                <button
                  type="button"
                  onClick={() => {
                    setCheckoutLogin(
                      (
                        previous
                      ) => ({
                        ...previous,

                        email:
                          form.email,
                      })
                    );

                    setShowCheckoutLogin(
                      true
                    );

                    window.scrollTo({
                      top: 0,
                      behavior:
                        "smooth",
                    });
                  }}
                  className="
                    font-black
                    underline
                  "
                >
                  Please log in.
                </button>
              </>
            )}

          </div>
        )}

        {/* =================================================
            MAIN CHECKOUT FORM
        ================================================= */}

        <form
          onSubmit={submit}
          noValidate
          className="
            grid
            gap-10
            lg:grid-cols-[minmax(0,1fr)_460px]
          "
        >

          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <section>

            <h1 className="
              text-2xl
              font-black
              text-[#243346]
            ">
              Billing & Shipping
            </h1>

            <h2 className="
              mt-5
              text-xl
              font-black
              text-[#243346]
            ">
              CORNERSTONE School of Learning
            </h2>

            {/* =============================================
                ADDRESS FORM

                Existing UI / functionality preserved.
            ============================================= */}

            <div className="mt-6">

              <AddressForm
                value={form}
                onChange={
                  setForm
                }
                errors={errors}
              />

            </div>

            {/* =============================================
                CREATE ACCOUNT PASSWORD

                ONLY GUEST.

                Logged-in customer never sees this.
            ============================================= */}

            {!isAuthenticated && (
              <div className="mt-6">

                <label className="block">

                  <span className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-[#243346]
                  ">
                    Create account
                    password{" "}

                    <span className="text-red-500">
                      *
                    </span>
                  </span>

                  <input
                    type="password"
                    value={
                      accountPassword
                    }
                    onFocus={() =>
                      setShowAccountPassword(
                        true
                      )
                    }
                    onChange={(
                      event
                    ) =>
                      setAccountPassword(
                        event.target
                          .value
                      )
                    }
                    minLength={8}
                    placeholder="Password"
                    className="
                      input-field
                      h-12
                      rounded-sm
                    "
                  />

                  {showAccountPassword &&
                    accountPassword &&
                    accountPassword
                      .length <
                      8 && (
                      <p className="
                        mt-2
                        text-xs
                        font-semibold
                        text-red-600
                      ">
                        Password must
                        contain at least
                        8 characters.
                      </p>
                    )}

                </label>

              </div>
            )}

            {/* =============================================
                ADDITIONAL INFORMATION
            ============================================= */}

            <h2 className="
              mt-10
              text-xl
              font-black
              text-[#243346]
            ">
              Additional
              information
            </h2>

            <label className="
              mt-5
              block
              text-sm
              font-semibold
              text-[#243346]
            ">
              Order notes{" "}

              <span className="
                font-normal
                text-slate-400
              ">
                (optional)
              </span>
            </label>

            <textarea
              value={notes}
              onChange={(
                event
              ) =>
                setNotes(
                  event.target
                    .value
                )
              }
              rows={4}
              className="
                input-field
                mt-2
                rounded-sm
              "
              placeholder="Notes about your order, e.g. special notes for delivery."
            />

          </section>

          {/* =================================================
              RIGHT SIDE - ORDER SUMMARY
          ================================================= */}

          <aside className="
            h-fit
            border-[5px]
            border-[#eeeeee]
            bg-white
            p-6
            lg:sticky
            lg:top-24
          ">

            <h2 className="
              text-2xl
              font-black
              text-[#243346]
            ">
              Your order
            </h2>

            <div className="
              mt-7
              flex
              justify-between
              border-b
              border-slate-200
              pb-4
              text-sm
              font-black
              text-[#243346]
            ">
              <span>
                Product
              </span>

              <span>
                Subtotal
              </span>
            </div>

            {/* =============================================
                PRODUCTS
            ============================================= */}

            <div className="
              divide-y
              divide-slate-100
            ">

              {cart.map(
                (item) => (
                  <div
                    key={
                      item.key
                    }
                    className="
                      flex
                      justify-between
                      gap-5
                      py-4
                      text-sm
                      text-[#243346]
                    "
                  >

                    <span>
                      <b>
                        {item.name}
                      </b>

                      {item.size && (
                        <>
                          {" - "}
                          {item.size}
                        </>
                      )}

                      {" × "}
                      {item.quantity}
                    </span>

                    <b>
                      ₹
                      {(
                        Number(
                          item.price
                        ) *
                        Number(
                          item.quantity
                        )
                      ).toFixed(2)}
                    </b>

                  </div>
                )
              )}

            </div>

            {/* =============================================
                SUBTOTAL
            ============================================= */}

            <div className="
              flex
              justify-between
              border-t
              border-slate-200
              py-5
              text-sm
              text-[#243346]
            ">

              <b>
                Subtotal
              </b>

              <b>
                ₹
                {Number(
                  subtotal
                ).toFixed(2)}
              </b>

            </div>

            {/* =============================================
                SHIPPING
            ============================================= */}

            <div className="
              flex
              justify-between
              border-t
              border-slate-200
              py-5
              text-sm
              text-[#243346]
            ">

              <b>
                Shipping
              </b>

              <span>
                Flat rate:{" "}

                <b>
                  ₹
                  {Number(
                    shipping
                  ).toFixed(2)}
                </b>
              </span>

            </div>

            {/* =============================================
                TOTAL
            ============================================= */}

            <div className="
              border-t
              border-slate-200
              py-6
            ">

              <div className="
                flex
                items-start
                justify-between
                gap-5
              ">

                <b className="
                  pt-2
                  text-sm
                  text-[#243346]
                ">
                  Total
                </b>

                <div className="text-right">

                  <div className="
                    text-[26px]
                    font-black
                    text-[#D9A537]
                  ">
                    ₹
                    {Number(
                      total
                    ).toFixed(2)}
                  </div>

                  <div className="
                    mt-2
                    text-xs
                    font-semibold
                    leading-6
                    text-[#243346]
                  ">
                    (includes{" "}

                    <strong className="text-[#D9A537]">
                      ₹
                      {cgst.toFixed(
                        2
                      )}
                    </strong>

                    {" "}
                    2.5% CGST,
                    <br />

                    <strong className="text-[#D9A537]">
                      ₹
                      {sgst.toFixed(
                        2
                      )}
                    </strong>

                    {" "}
                    2.5% SGST)
                  </div>

                </div>

              </div>

            </div>

            {/* =============================================
                PAYTM
            ============================================= */}

            <div className="
              mt-3
              border-t
              border-slate-200
              pt-6
            ">

              <div className="
                flex
                items-start
                gap-3
              ">

                <span className="
                  mt-1
                  grid
                  h-4
                  w-4
                  place-items-center
                  rounded-full
                  border-2
                  border-[#D9A537]
                ">
                  <span className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-[#D9A537]
                  " />
                </span>

                <div className="flex-1">

                  <div className="
                    flex
                    flex-wrap
                    items-center
                    gap-3
                  ">

                    <b className="
                      text-sm
                      text-[#243346]
                    ">
                      Paytm Payment
                      Gateway
                    </b>

                    <span className="
                      inline-flex
                      items-center
                      font-black
                    ">
                      <span className="text-[#162d70]">
                        pay
                      </span>

                      <span className="text-[#00baf2]">
                        tm
                      </span>

                      <span className="
                        ml-1
                        rounded
                        bg-[#00baf2]
                        px-1.5
                        py-0.5
                        text-[10px]
                        text-white
                      ">
                        PG
                      </span>
                    </span>

                  </div>

                  <p className="
                    mt-3
                    text-xs
                    font-semibold
                    leading-5
                    text-[#243346]
                  ">
                    The best payment
                    gateway provider
                    in India for
                    e-payment through
                    credit card,
                    debit card &
                    netbanking.
                  </p>

                </div>

              </div>

            </div>

            {/* =============================================
                PLACE ORDER
            ============================================= */}

            <button
              type="submit"
              disabled={
                checkoutLoading
              }
              className="
                btn-gold
                mt-7
                w-full
                rounded-sm
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {checkoutLoading
                ? "Placing order..."
                : "Place order"}
            </button>

          </aside>

        </form>

      </div>

    </main>
  );
}



// import {
//   useEffect,
//   useState,
// } from "react";

// import {
//   useNavigate,
// } from "react-router-dom";

// import { useCart } from "../context/CartContext";
// import { useAuth } from "../context/AuthContext";

// import AddressForm from "../components/AddressForm";

// import {
//   EMPTY_ADDRESS,
//   getDefaultAddress,
// } from "../utils/addressStorage";

// import {
//   loadCheckoutDraft,
//   saveCheckoutDraft,
// } from "../utils/checkoutDraft";

// import axiosClient from "../api/axiosClient";

// import {
//   payOrderWithPaytm,
// } from "../services/paymentService";

// /* =========================================================
//    REQUIRED FIELD LABELS
// ========================================================= */

// const labels = {
//   firstName:
//     "Billing Student First Name",

//   lastName:
//     "Billing Student Last Name",

//   address:
//     "Billing Street address",

//   city:
//     "Billing Town / City",

//   pincode:
//     "Billing PIN Code",

//   phone:
//     "Billing Phone",

//   email:
//     "Billing Email address",

//   admissionNo:
//     "Billing Student Admission No.",

//   parentName:
//     "Billing Parent name",
// };

// /* =========================================================
//    CHECKOUT
// ========================================================= */

// export default function Checkout() {
//   const navigate =
//     useNavigate();

//   /* =======================================================
//      AUTH
//   ======================================================= */

//   const {
//     isAuthenticated,

//     login,

//     /*
//      * These 2 functions must be added
//      * in AuthContext.jsx as given before.
//      */
//     checkCustomerEmail,
//     checkoutRegister,
//   } = useAuth();

//   /* =======================================================
//      CART
//   ======================================================= */

//   const {
//     cart,
//     subtotal,
//     shipping,
//     total,

//     /*
//      * IMPORTANT:
//      * Do not clear cart immediately
//      * when pending order is created.
//      *
//      * Clear after successful Paytm payment.
//      */
//     clearCart,
//   } = useCart();

//   /* =======================================================
//      BILLING FORM
//   ======================================================= */

//   const [
//     form,
//     setForm,
//   ] = useState({
//     ...EMPTY_ADDRESS,

//     studentClass:
//       EMPTY_ADDRESS
//         ?.studentClass ||
//       "Nursery",

//     country:
//       EMPTY_ADDRESS
//         ?.country ||
//       "India",

//     state:
//       EMPTY_ADDRESS
//         ?.state ||
//       "Telangana",
//   });

//   const [
//     notes,
//     setNotes,
//   ] = useState("");

//   const [
//     errors,
//     setErrors,
//   ] = useState({});

//   /* =======================================================
//      RETURNING CUSTOMER LOGIN
//   ======================================================= */

//   const [
//     showCheckoutLogin,
//     setShowCheckoutLogin,
//   ] = useState(false);

//   const [
//     checkoutLogin,
//     setCheckoutLogin,
//   ] = useState({
//     email: "",
//     password: "",
//   });

//   const [
//     loginError,
//     setLoginError,
//   ] = useState("");

//   const [
//     loginLoading,
//     setLoginLoading,
//   ] = useState(false);

//   /* =======================================================
//      GUEST CHECKOUT ACCOUNT PASSWORD
//   ======================================================= */

//   const [
//     accountPassword,
//     setAccountPassword,
//   ] = useState("");

//   const [
//     showAccountPassword,
//     setShowAccountPassword,
//   ] = useState(false);

//   /* =======================================================
//      CHECKOUT MESSAGE
//   ======================================================= */

//   const [
//     checkoutError,
//     setCheckoutError,
//   ] = useState("");

//   const [
//     checkoutLoading,
//     setCheckoutLoading,
//   ] = useState(false);

//   /* =======================================================
//      TAX

//      Product subtotal already contains tax.
//   ======================================================= */

//   const cgst =
//     (Number(subtotal) *
//       2.5) /
//     105;

//   const sgst =
//     (Number(subtotal) *
//       2.5) /
//     105;

//   /* =======================================================
//      LOAD LOGGED-IN CUSTOMER FROM DATABASE

//      NO localStorage
//      NO sessionStorage
//   ======================================================= */

//   const loadCustomerDetails =
//     async () => {
//       try {
//         const {
//           data,
//         } =
//           await axiosClient.get(
//             "/auth/customer/me"
//           );

//         const customer =
//           data?.user;

//         if (!customer) {
//           return;
//         }

//         const billing =
//           customer
//             ?.billingAddress ||
//           {};

//         setForm(
//           (previous) => ({
//             ...previous,

//             firstName:
//               billing.firstName ||
//               customer
//                 ?.firstName ||
//               previous.firstName ||
//               "",

//             lastName:
//               billing.lastName ||
//               customer
//                 ?.lastName ||
//               previous.lastName ||
//               "",

//             email:
//               billing.email ||
//               customer?.email ||
//               previous.email ||
//               "",

//             phone:
//               billing.phone ||
//               customer?.phone ||
//               previous.phone ||
//               "",

//             /*
//              * AddressForm currently
//              * uses "address".
//              */
//             address:
//               billing.address1 ||
//               previous.address ||
//               "",

//             address2:
//               billing.address2 ||
//               previous.address2 ||
//               "",

//             city:
//               billing.city ||
//               previous.city ||
//               "",

//             state:
//               billing.state ||
//               previous.state ||
//               "Telangana",

//             pincode:
//               billing.postcode ||
//               previous.pincode ||
//               "",

//             country:
//               billing.country ===
//               "IN"
//                 ? "India"
//                 : billing.country ||
//                   previous.country ||
//                   "India",

//             studentClass:
//               billing
//                 .studentClass ||
//               previous
//                 .studentClass ||
//               "Nursery",

//             admissionNo:
//               billing.admissionNo ||
//               previous.admissionNo ||
//               "",

//             parentName:
//               billing.parentName ||
//               previous.parentName ||
//               "",
//           })
//         );
//       } catch (error) {
//         /*
//          * Guest gets 401 here only if
//          * this is called accidentally.
//          */
//         if (
//           error?.response
//             ?.status !== 401
//         ) {
//           console.error(
//             "Checkout customer load error:",
//             error
//           );
//         }
//       }
//     };

//   /* =======================================================
//      LOGGED-IN CUSTOMER:
//      LOAD DB ADDRESS WHEN CHECKOUT OPENS
//   ======================================================= */

//   useEffect(() => {
//     const draft = loadCheckoutDraft();

//     if (draft?.form) {
//       setForm((previous) => ({
//         ...previous,
//         ...draft.form,
//       }));

//       if (draft.notes) {
//         setNotes(draft.notes);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     if (loadCheckoutDraft()?.form) {
//       return;
//     }

//     if (isAuthenticated) {
//       loadCustomerDetails();

//       setAccountPassword("");
//       setShowAccountPassword(false);
//       setShowCheckoutLogin(false);
//       setCheckoutError("");
//       return;
//     }

//     const savedAddress = getDefaultAddress();

//     if (savedAddress) {
//       setForm((previous) => ({
//         ...previous,
//         firstName: savedAddress.firstName || previous.firstName,
//         lastName: savedAddress.lastName || previous.lastName,
//         email: savedAddress.email || previous.email,
//         phone: savedAddress.phone || previous.phone,
//         address: savedAddress.address || previous.address,
//         address2: savedAddress.address2 || previous.address2,
//         city: savedAddress.city || previous.city,
//         state: savedAddress.state || previous.state || "Telangana",
//         pincode: savedAddress.pincode || previous.pincode,
//         country: savedAddress.country || previous.country || "India",
//         studentClass: savedAddress.studentClass || previous.studentClass || "Nursery",
//         admissionNo: savedAddress.admissionNo || previous.admissionNo,
//         parentName: savedAddress.parentName || previous.parentName,
//       }));
//     }
//   }, [isAuthenticated]);

//   /* =======================================================
//      VALIDATION
//   ======================================================= */

//   const validate =
//     () => {
//       const next = {};

//       [
//         "firstName",
//         "lastName",
//         "address",
//         "city",
//         "pincode",
//         "phone",
//         "email",
//         "admissionNo",
//         "parentName",
//       ].forEach(
//         (key) => {
//           if (
//             !String(
//               form[key] || ""
//             ).trim()
//           ) {
//             next[key] =
//               `${labels[key]} is a required field.`;
//           }
//         }
//       );

//       if (
//         form.email &&
//         !/^\S+@\S+\.\S+$/.test(
//           form.email
//         )
//       ) {
//         next.email =
//           "Please enter a valid email address.";
//       }

//       setErrors(next);

//       if (
//         Object.keys(next)
//           .length
//       ) {
//         window.scrollTo({
//           top: 0,
//           behavior:
//             "smooth",
//         });
//       }

//       return (
//         Object.keys(next)
//           .length === 0
//       );
//     };

//   /* =======================================================
//      RETURNING CUSTOMER INLINE LOGIN

//      LOGIN SUCCESS:
//      - stay on Checkout
//      - load customer DB address
//      - hide account-password field
//   ======================================================= */

//   const handleCheckoutLogin =
//     async (event) => {
//       event.preventDefault();

//       if (loginLoading) {
//         return;
//       }

//       setLoginError("");
//       setCheckoutError("");

//       const email =
//         String(
//           checkoutLogin
//             .email ||
//             form.email ||
//             ""
//         )
//           .trim()
//           .toLowerCase();

//       const password =
//         checkoutLogin
//           .password;

//       if (!email) {
//         setLoginError(
//           "Please enter your email address."
//         );

//         return;
//       }

//       if (!password) {
//         setLoginError(
//           "Please enter your password."
//         );

//         return;
//       }

//       setLoginLoading(true);

//       try {
//         /*
//          * IMPORTANT:
//          *
//          * Current AuthContext login should
//          * accept:
//          *
//          * login({
//          *   email,
//          *   password,
//          * })
//          */
//         const result =
//           await login({
//             email,
//             password,
//           });

//         if (!result?.ok) {
//           setLoginError(
//             result?.message ||
//               "Invalid email or password."
//           );

//           return;
//         }

//         /*
//          * Login successful.
//          * DO NOT navigate to profile.
//          * Stay on checkout.
//          */
//         setShowCheckoutLogin(
//           false
//         );

//         setLoginError("");

//         setCheckoutError(
//           ""
//         );

//         setAccountPassword(
//           ""
//         );

//         setShowAccountPassword(
//           false
//         );

//         /*
//          * Fetch DB customer
//          * address immediately.
//          */
//         await loadCustomerDetails();
//       } catch (error) {
//         setLoginError(
//           error?.response
//             ?.data
//             ?.message ||
//             error?.message ||
//             "Invalid email or password."
//         );
//       } finally {
//         setLoginLoading(false);
//       }
//     };

//   /* =======================================================
//      FORGOT PASSWORD FROM CHECKOUT
//   ======================================================= */

//   const goToForgotPassword =
//     () => {
//       navigate(
//         "/forgot-password",
//         {
//           state: {
//             email:
//               checkoutLogin
//                 .email ||
//               form.email ||
//               "",

//             /*
//              * ForgotPassword page can
//              * return customer to checkout.
//              */
//             returnTo:
//               "/checkout",
//           },
//         }
//       );
//     };

//   /* =======================================================
//      SAVE BILLING ADDRESS / PROFILE INTO DATABASE

//      Existing wp_users / wp_usermeta only.
//      NO new table needed.
//   ======================================================= */

//   const saveCustomerBillingDetails =
//     async () => {
//       const {
//         data,
//       } =
//         await axiosClient.put(
//           "/auth/customer/me",
//           {
//             firstName:
//               form.firstName,

//             lastName:
//               form.lastName,

//             displayName:
//               `${form.firstName} ${form.lastName}`
//                 .trim(),

//             email:
//               form.email,

//             billingAddress: {
//               firstName:
//                 form.firstName,

//               lastName:
//                 form.lastName,

//               email:
//                 form.email,

//               phone:
//                 form.phone,

//               address1:
//                 form.address,

//               address2:
//                 form.address2 ||
//                 "",

//               city:
//                 form.city,

//               state:
//                 form.state,

//               postcode:
//                 form.pincode,

//               /*
//                * WooCommerce normally
//                * stores India as IN.
//                */
//               country:
//                 "IN",

//               studentClass:
//                 form.studentClass,

//               admissionNo:
//                 form.admissionNo,

//               parentName:
//                 form.parentName,
//             },
//           }
//         );

//       return data?.user;
//     };

//   /* =======================================================
//      CREATE DATABASE ORDER

//      EXPECTED BACKEND ROUTE:
//        POST /api/customer/orders

//      IMPORTANT:
//      Backend must derive customer_id
//      from req.user.id.
//      Frontend does NOT send customerId.
//   ======================================================= */

//   const createPendingOrder =
//     async () => {
//       const payload = {
//         subtotal:
//           Number(subtotal),

//         shipping:
//           Number(shipping),

//         total:
//           Number(total),

//         cgst:
//           Number(cgst),

//         sgst:
//           Number(sgst),

//         paymentMethod:
//           "paytm",

//         paymentMethodTitle:
//           "Paytm Payment Gateway",

//         status:
//           "pending",

//         notes,

//         billing: {
//           firstName:
//             form.firstName,

//           lastName:
//             form.lastName,

//           studentClass:
//             form.studentClass,

//           country:
//             "IN",

//           address1:
//             form.address,

//           address2:
//             form.address2 ||
//             "",

//           city:
//             form.city,

//           state:
//             form.state,

//           postcode:
//             form.pincode,

//           phone:
//             form.phone,

//           email:
//             form.email,

//           admissionNo:
//             form.admissionNo,

//           parentName:
//             form.parentName,
//         },

//         items:
//           cart.map(
//             (item) => ({
//               /*
//                * Keep current cart data,
//                * backend should validate
//                * product/price itself.
//                */
//               key:
//                 item.key,

//               productId:
//                 item.id,

//               variationId:
//                 item.variationId ||
//                 item
//                   .variation_id ||
//                 null,

//               name:
//                 item.name,

//               image:
//                 item.image,

//               size:
//                 item.size ||
//                 "",

//               quantity:
//                 Number(
//                   item.quantity
//                 ),

//               price:
//                 Number(
//                   item.price
//                 ),
//             })
//           ),
//       };

//       const {
//         data,
//       } =
//         await axiosClient.post(
//           "/customer/orders",
//           payload
//         );

//       /*
//        * Supports common response shapes:
//        *
//        * { order: {...} }
//        * { data: { order: {...} } }
//        * direct order object
//        */
//       return (
//         data?.order ||
//         data?.data?.order ||
//         data?.data ||
//         data
//       );
//     };

//   /* =======================================================
//      PLACE ORDER
//   ======================================================= */

//   const submit =
//     async (event) => {
//       event.preventDefault();

//       if (
//         checkoutLoading
//       ) {
//         return;
//       }

//       if (!cart.length) {
//         navigate("/");

//         return;
//       }

//       setCheckoutError("");

//       if (!validate()) {
//         return;
//       }

//       setCheckoutLoading(true);

//       try {
//         let customerIsReady =
//           isAuthenticated;

//         /* ===============================================
//            CASE 1 + CASE 2:
//            USER IS NOT LOGGED IN
//         =============================================== */

//         if (
//           !customerIsReady
//         ) {
//           /*
//            * Check email against
//            * existing customer DB.
//            */
//           const emailCheck =
//             await checkCustomerEmail(
//               form.email
//             );

//           if (
//             !emailCheck?.ok
//           ) {
//             setCheckoutError(
//               emailCheck
//                 ?.message ||
//                 "Unable to verify your email address."
//             );

//             window.scrollTo({
//               top: 0,
//               behavior:
//                 "smooth",
//             });

//             return;
//           }

//           /* =============================================
//              CASE 1:
//              EMAIL ALREADY REGISTERED
//           ============================================= */

//           if (
//             emailCheck.exists
//           ) {
//             setCheckoutError(
//               "An account is already registered with your email address."
//             );

//             /*
//              * Pre-fill inline login
//              * with checkout email.
//              */
//             setCheckoutLogin(
//               (previous) => ({
//                 ...previous,

//                 email:
//                   String(
//                     form.email ||
//                       ""
//                   )
//                     .trim()
//                     .toLowerCase(),
//               })
//             );

//             /*
//              * Do not automatically open
//              * if you want exact Woo style.
//              * User clicks "Please log in."
//              */
//             window.scrollTo({
//               top: 0,
//               behavior:
//                 "smooth",
//             });

//             return;
//           }

//           /* =============================================
//              CASE 2:
//              NEW EMAIL

//              Require Create Account Password.
//           ============================================= */

//           if (
//             !accountPassword
//           ) {
//             setCheckoutError(
//               "Create account password is a required field."
//             );

//             setShowAccountPassword(
//               true
//             );

//             window.scrollTo({
//               top: 0,
//               behavior:
//                 "smooth",
//             });

//             return;
//           }

//           if (
//             accountPassword
//               .length < 8
//           ) {
//             setCheckoutError(
//               "Create account password must be at least 8 characters."
//             );

//             setShowAccountPassword(
//               true
//             );

//             window.scrollTo({
//               top: 0,
//               behavior:
//                 "smooth",
//             });

//             return;
//           }

//           /*
//            * Create customer using
//            * checkout-entered password.
//            *
//            * Backend:
//            * - create DB customer
//            * - save password hash
//            * - set HttpOnly customer cookie
//            * - return user
//            *
//            * NO email Set Password step
//            * for checkout-created customer.
//            */
//           const registration =
//             await checkoutRegister({
//               firstName:
//                 form.firstName,

//               lastName:
//                 form.lastName,

//               email:
//                 form.email,

//               password:
//                 accountPassword,
//             });

//           if (
//             !registration?.ok
//           ) {
//             /*
//              * Race-condition protection:
//              * email could have become
//              * registered between check
//              * and registration.
//              */
//             if (
//               registration
//                 ?.status ===
//                 409
//             ) {
//               setCheckoutError(
//                 "An account is already registered with your email address."
//               );

//               setCheckoutLogin(
//                 (previous) => ({
//                   ...previous,

//                   email:
//                     form.email,
//                 })
//               );
//             } else {
//               setCheckoutError(
//                 registration
//                   ?.message ||
//                   "Unable to create your account."
//               );
//             }

//             window.scrollTo({
//               top: 0,
//               behavior:
//                 "smooth",
//             });

//             return;
//           }

//           /*
//            * Cookie is now set.
//            * This request can immediately
//            * access authenticated endpoints.
//            */
//           customerIsReady =
//             true;

//           setAccountPassword(
//             ""
//           );

//           setShowAccountPassword(
//             false
//           );
//         }

//         /* ===============================================
//            LOGGED-IN CUSTOMER / NEW CHECKOUT CUSTOMER:
//            SAVE ADDRESS TO DATABASE
//         =============================================== */

//         if (
//           customerIsReady
//         ) {
//           await saveCustomerBillingDetails();
//         }

//         /* ===============================================
//            CREATE REAL PENDING PAYMENT ORDER IN DATABASE
//         =============================================== */

//         const order =
//           await createPendingOrder();

//         const orderId =
//           order?.id ||
//           order?.ID ||
//           order?.orderId ||
//           order?.order_id;

//         if (!orderId) {
//           throw new Error(
//             "Order was created but order ID was not returned."
//           );
//         }

//         /*
//          * IMPORTANT:
//          *
//          * DO NOT:
//          * localStorage.setItem(...)
//          * sessionStorage.setItem(...)
//          *
//          * DO NOT clear cart yet.
//          *
//          * Pending order should remain
//          * visible if payment cancelled.
//          */

//         /*
//          * Go to Pay For Order page.
//          *
//          * There Pay Now button should
//          * open Paytm gateway.
//          */
//         saveCheckoutDraft({
//           form,
//           notes,
//         });

//         await clearCart();

//         const goToPayPage = () => {
//           navigate(
//             `/pay-for-order/${orderId}?source=checkout`,
//             {
//               replace: true,
//               state: { order },
//             }
//           );
//         };

//         try {
//           await payOrderWithPaytm(orderId, {
//             onSuccess: async () => {
//               clearCheckoutDraft();
//               navigate(
//                 `/order-success?orderId=${orderId}`,
//                 { replace: true }
//               );
//             },
//             onFailure: () => {
//               goToPayPage();
//             },
//           });
//         } catch {
//           goToPayPage();
//         }
//       } catch (error) {
//         console.error(
//           "Checkout error:",
//           error
//         );

//         const message =
//           error?.response
//             ?.data
//             ?.message ||
//           error?.response
//             ?.data
//             ?.error ||
//           error?.message ||
//           "Unable to place your order. Please try again.";

//         setCheckoutError(
//           message
//         );

//         window.scrollTo({
//           top: 0,
//           behavior:
//             "smooth",
//         });
//       } finally {
//         setCheckoutLoading(
//           false
//         );
//       }
//     };

//   /* =======================================================
//      EMPTY CART
//   ======================================================= */

//   if (!cart.length) {
//     return (
//       <main className="container-site py-24 text-center">

//         <h1 className="text-3xl font-black text-[#243346]">
//           Your cart is empty
//         </h1>

//       </main>
//     );
//   }

//   /* =======================================================
//      UI
//   ======================================================= */

//   return (
//     <main className="bg-white">

//       <div className="container-site py-8 sm:py-12">

//         {/* =================================================
//             CHECKOUT GENERAL ERRORS
//         ================================================= */}

//         {Object.keys(errors)
//           .length > 0 && (
//           <div className="
//             mb-9
//             border-l-4
//             border-red-700
//             bg-[#e93b1d]
//             px-6
//             py-4
//             text-sm
//             font-bold
//             text-white
//           ">
//             {Object.values(
//               errors
//             ).map(
//               (
//                 message,
//                 index
//               ) => (
//                 <p
//                   key={
//                     index
//                   }
//                   className="py-0.5"
//                 >
//                   {message}
//                 </p>
//               )
//             )}
//           </div>
//         )}

//         {/* =================================================
//             RETURNING CUSTOMER BAR

//             Guest only.
//         ================================================= */}

//         {!isAuthenticated && (
//           <div className="mb-7">

//             <button
//               type="button"
//               onClick={() => {
//                 setShowCheckoutLogin(
//                   (previous) =>
//                     !previous
//                 );

//                 /*
//                  * Use Billing email
//                  * automatically.
//                  */
//                 if (
//                   form.email &&
//                   !checkoutLogin
//                     .email
//                 ) {
//                   setCheckoutLogin(
//                     (previous) => ({
//                       ...previous,

//                       email:
//                         form.email,
//                     })
//                   );
//                 }
//               }}
//               className="
//                 w-full
//                 bg-[#3fa1d1]
//                 px-7
//                 py-4
//                 text-left
//                 text-sm
//                 font-bold
//                 text-white
//                 transition
//                 hover:bg-[#3695c4]
//               "
//             >
//               Returning customer?
//               Click here to login
//             </button>

//             {/* =============================================
//                 INLINE CHECKOUT LOGIN
//             ============================================= */}

//             {showCheckoutLogin && (
//               <form
//                 onSubmit={
//                   handleCheckoutLogin
//                 }
//                 className="
//                   mx-auto
//                   max-w-2xl
//                   px-4
//                   py-8
//                   sm:px-8
//                 "
//               >

//                 <p className="
//                   mb-6
//                   text-sm
//                   font-semibold
//                   leading-6
//                   text-[#243346]
//                 ">
//                   If you have
//                   shopped with us
//                   before, please
//                   enter your
//                   details below.
//                   If you are a new
//                   customer, please
//                   proceed to the
//                   Billing section.
//                 </p>

//                 <div className="
//                   grid
//                   gap-5
//                   sm:grid-cols-2
//                 ">

//                   {/* Email */}

//                   <label className="block">

//                     <span className="
//                       mb-2
//                       block
//                       text-sm
//                       font-medium
//                       text-[#243346]
//                     ">
//                       Username or email{" "}
//                       <span className="text-red-500">
//                         *
//                       </span>
//                     </span>

//                     <input
//                       type="email"
//                       value={
//                         checkoutLogin
//                           .email
//                       }
//                       onChange={(
//                         event
//                       ) =>
//                         setCheckoutLogin(
//                           (
//                             previous
//                           ) => ({
//                             ...previous,

//                             email:
//                               event
//                                 .target
//                                 .value,
//                           })
//                         )
//                       }
//                       className="
//                         input-field
//                         h-12
//                         rounded-sm
//                       "
//                     />

//                   </label>

//                   {/* Password */}

//                   <label className="block">

//                     <span className="
//                       mb-2
//                       block
//                       text-sm
//                       font-medium
//                       text-[#243346]
//                     ">
//                       Password{" "}
//                       <span className="text-red-500">
//                         *
//                       </span>
//                     </span>

//                     <input
//                       type="password"
//                       value={
//                         checkoutLogin
//                           .password
//                       }
//                       onChange={(
//                         event
//                       ) =>
//                         setCheckoutLogin(
//                           (
//                             previous
//                           ) => ({
//                             ...previous,

//                             password:
//                               event
//                                 .target
//                                 .value,
//                           })
//                         )
//                       }
//                       className="
//                         input-field
//                         h-12
//                         rounded-sm
//                       "
//                     />

//                   </label>

//                 </div>

//                 {/* Login error */}

//                 {loginError && (
//                   <p className="
//                     mt-4
//                     bg-red-50
//                     px-4
//                     py-3
//                     text-sm
//                     font-semibold
//                     text-red-700
//                   ">
//                     {loginError}
//                   </p>
//                 )}

//                 {/* Remember me display */}

//                 <label className="
//                   mt-5
//                   flex
//                   items-center
//                   gap-2
//                   text-sm
//                   text-[#243346]
//                 ">
//                   <input
//                     type="checkbox"
//                   />

//                   Remember me
//                 </label>

//                 {/* Login button */}

//                 <button
//                   type="submit"
//                   disabled={
//                     loginLoading
//                   }
//                   className="
//                     mt-5
//                     w-full
//                     bg-[#ff7900]
//                     px-5
//                     py-3
//                     font-bold
//                     text-white
//                     transition
//                     hover:bg-[#e96f00]
//                     disabled:cursor-not-allowed
//                     disabled:opacity-60
//                   "
//                 >
//                   {loginLoading
//                     ? "Logging in..."
//                     : "Login"}
//                 </button>

//                 {/* Forgot password */}

//                 <button
//                   type="button"
//                   onClick={
//                     goToForgotPassword
//                   }
//                   className="
//                     mt-5
//                     font-bold
//                     text-[#ff7900]
//                     hover:underline
//                   "
//                 >
//                   Lost your password?
//                 </button>

//               </form>
//             )}

//           </div>
//         )}

//         {/* =================================================
//             EXISTING EMAIL WARNING

//             Screenshot style:
//             An account is already registered...
//             Please log in.
//         ================================================= */}

//         {checkoutError && (
//           <div className="
//             mb-9
//             border-l-4
//             border-[#c92d13]
//             bg-[#e93b1d]
//             px-7
//             py-4
//             text-sm
//             font-bold
//             text-white
//           ">

//             <span>
//               {checkoutError}
//             </span>

//             {checkoutError
//               .toLowerCase()
//               .includes(
//                 "already registered"
//               ) && (
//               <>
//                 {" "}

//                 <button
//                   type="button"
//                   onClick={() => {
//                     setCheckoutLogin(
//                       (
//                         previous
//                       ) => ({
//                         ...previous,

//                         email:
//                           form.email,
//                       })
//                     );

//                     setShowCheckoutLogin(
//                       true
//                     );

//                     window.scrollTo({
//                       top: 0,
//                       behavior:
//                         "smooth",
//                     });
//                   }}
//                   className="
//                     font-black
//                     underline
//                   "
//                 >
//                   Please log in.
//                 </button>
//               </>
//             )}

//           </div>
//         )}

//         {/* =================================================
//             MAIN CHECKOUT FORM
//         ================================================= */}

//         <form
//           onSubmit={submit}
//           noValidate
//           className="
//             grid
//             gap-10
//             lg:grid-cols-[minmax(0,1fr)_460px]
//           "
//         >

//           {/* =================================================
//               LEFT SIDE
//           ================================================= */}

//           <section>

//             <h1 className="
//               text-2xl
//               font-black
//               text-[#243346]
//             ">
//               Billing & Shipping
//             </h1>

//             <h2 className="
//               mt-5
//               text-xl
//               font-black
//               text-[#243346]
//             ">
//               Global Edge School
//               of Learning
//             </h2>

//             {/* =============================================
//                 ADDRESS FORM

//                 Existing UI / functionality preserved.
//             ============================================= */}

//             <div className="mt-6">

//               <AddressForm
//                 value={form}
//                 onChange={
//                   setForm
//                 }
//                 errors={errors}
//               />

//             </div>

//             {/* =============================================
//                 CREATE ACCOUNT PASSWORD

//                 ONLY GUEST.

//                 Logged-in customer never sees this.
//             ============================================= */}

//             {!isAuthenticated && (
//               <div className="mt-6">

//                 <label className="block">

//                   <span className="
//                     mb-2
//                     block
//                     text-sm
//                     font-medium
//                     text-[#243346]
//                   ">
//                     Create account
//                     password{" "}

//                     <span className="text-red-500">
//                       *
//                     </span>
//                   </span>

//                   <input
//                     type="password"
//                     value={
//                       accountPassword
//                     }
//                     onFocus={() =>
//                       setShowAccountPassword(
//                         true
//                       )
//                     }
//                     onChange={(
//                       event
//                     ) =>
//                       setAccountPassword(
//                         event.target
//                           .value
//                       )
//                     }
//                     minLength={8}
//                     placeholder="Password"
//                     className="
//                       input-field
//                       h-12
//                       rounded-sm
//                     "
//                   />

//                   {showAccountPassword &&
//                     accountPassword &&
//                     accountPassword
//                       .length <
//                       8 && (
//                       <p className="
//                         mt-2
//                         text-xs
//                         font-semibold
//                         text-red-600
//                       ">
//                         Password must
//                         contain at least
//                         8 characters.
//                       </p>
//                     )}

//                 </label>

//               </div>
//             )}

//             {/* =============================================
//                 ADDITIONAL INFORMATION
//             ============================================= */}

//             <h2 className="
//               mt-10
//               text-xl
//               font-black
//               text-[#243346]
//             ">
//               Additional
//               information
//             </h2>

//             <label className="
//               mt-5
//               block
//               text-sm
//               font-semibold
//               text-[#243346]
//             ">
//               Order notes{" "}

//               <span className="
//                 font-normal
//                 text-slate-400
//               ">
//                 (optional)
//               </span>
//             </label>

//             <textarea
//               value={notes}
//               onChange={(
//                 event
//               ) =>
//                 setNotes(
//                   event.target
//                     .value
//                 )
//               }
//               rows={4}
//               className="
//                 input-field
//                 mt-2
//                 rounded-sm
//               "
//               placeholder="Notes about your order, e.g. special notes for delivery."
//             />

//           </section>

//           {/* =================================================
//               RIGHT SIDE - ORDER SUMMARY
//           ================================================= */}

//           <aside className="
//             h-fit
//             border-[5px]
//             border-[#eeeeee]
//             bg-white
//             p-6
//             lg:sticky
//             lg:top-24
//           ">

//             <h2 className="
//               text-2xl
//               font-black
//               text-[#243346]
//             ">
//               Your order
//             </h2>

//             <div className="
//               mt-7
//               flex
//               justify-between
//               border-b
//               border-slate-200
//               pb-4
//               text-sm
//               font-black
//               text-[#243346]
//             ">
//               <span>
//                 Product
//               </span>

//               <span>
//                 Subtotal
//               </span>
//             </div>

//             {/* =============================================
//                 PRODUCTS
//             ============================================= */}

//             <div className="
//               divide-y
//               divide-slate-100
//             ">

//               {cart.map(
//                 (item) => (
//                   <div
//                     key={
//                       item.key
//                     }
//                     className="
//                       flex
//                       justify-between
//                       gap-5
//                       py-4
//                       text-sm
//                       text-[#243346]
//                     "
//                   >

//                     <span>
//                       <b>
//                         {item.name}
//                       </b>

//                       {item.size && (
//                         <>
//                           {" - "}
//                           {item.size}
//                         </>
//                       )}

//                       {" × "}
//                       {item.quantity}
//                     </span>

//                     <b>
//                       ₹
//                       {(
//                         Number(
//                           item.price
//                         ) *
//                         Number(
//                           item.quantity
//                         )
//                       ).toFixed(2)}
//                     </b>

//                   </div>
//                 )
//               )}

//             </div>

//             {/* =============================================
//                 SUBTOTAL
//             ============================================= */}

//             <div className="
//               flex
//               justify-between
//               border-t
//               border-slate-200
//               py-5
//               text-sm
//               text-[#243346]
//             ">

//               <b>
//                 Subtotal
//               </b>

//               <b>
//                 ₹
//                 {Number(
//                   subtotal
//                 ).toFixed(2)}
//               </b>

//             </div>

//             {/* =============================================
//                 SHIPPING
//             ============================================= */}

//             <div className="
//               flex
//               justify-between
//               border-t
//               border-slate-200
//               py-5
//               text-sm
//               text-[#243346]
//             ">

//               <b>
//                 Shipping
//               </b>

//               <span>
//                 Flat rate:{" "}

//                 <b>
//                   ₹
//                   {Number(
//                     shipping
//                   ).toFixed(2)}
//                 </b>
//               </span>

//             </div>

//             {/* =============================================
//                 TOTAL
//             ============================================= */}

//             <div className="
//               border-t
//               border-slate-200
//               py-6
//             ">

//               <div className="
//                 flex
//                 items-start
//                 justify-between
//                 gap-5
//               ">

//                 <b className="
//                   pt-2
//                   text-sm
//                   text-[#243346]
//                 ">
//                   Total
//                 </b>

//                 <div className="text-right">

//                   <div className="
//                     text-[26px]
//                     font-black
//                     text-[#D9A537]
//                   ">
//                     ₹
//                     {Number(
//                       total
//                     ).toFixed(2)}
//                   </div>

//                   <div className="
//                     mt-2
//                     text-xs
//                     font-semibold
//                     leading-6
//                     text-[#243346]
//                   ">
//                     (includes{" "}

//                     <strong className="text-[#D9A537]">
//                       ₹
//                       {cgst.toFixed(
//                         2
//                       )}
//                     </strong>

//                     {" "}
//                     2.5% CGST,
//                     <br />

//                     <strong className="text-[#D9A537]">
//                       ₹
//                       {sgst.toFixed(
//                         2
//                       )}
//                     </strong>

//                     {" "}
//                     2.5% SGST)
//                   </div>

//                 </div>

//               </div>

//             </div>

//             {/* =============================================
//                 PAYTM
//             ============================================= */}

//             <div className="
//               mt-3
//               border-t
//               border-slate-200
//               pt-6
//             ">

//               <div className="
//                 flex
//                 items-start
//                 gap-3
//               ">

//                 <span className="
//                   mt-1
//                   grid
//                   h-4
//                   w-4
//                   place-items-center
//                   rounded-full
//                   border-2
//                   border-[#D9A537]
//                 ">
//                   <span className="
//                     h-1.5
//                     w-1.5
//                     rounded-full
//                     bg-[#D9A537]
//                   " />
//                 </span>

//                 <div className="flex-1">

//                   <div className="
//                     flex
//                     flex-wrap
//                     items-center
//                     gap-3
//                   ">

//                     <b className="
//                       text-sm
//                       text-[#243346]
//                     ">
//                       Paytm Payment
//                       Gateway
//                     </b>

//                     <span className="
//                       inline-flex
//                       items-center
//                       font-black
//                     ">
//                       <span className="text-[#162d70]">
//                         pay
//                       </span>

//                       <span className="text-[#00baf2]">
//                         tm
//                       </span>

//                       <span className="
//                         ml-1
//                         rounded
//                         bg-[#00baf2]
//                         px-1.5
//                         py-0.5
//                         text-[10px]
//                         text-white
//                       ">
//                         PG
//                       </span>
//                     </span>

//                   </div>

//                   <p className="
//                     mt-3
//                     text-xs
//                     font-semibold
//                     leading-5
//                     text-[#243346]
//                   ">
//                     The best payment
//                     gateway provider
//                     in India for
//                     e-payment through
//                     credit card,
//                     debit card &
//                     netbanking.
//                   </p>

//                 </div>

//               </div>

//             </div>

//             {/* =============================================
//                 PLACE ORDER
//             ============================================= */}

//             <button
//               type="submit"
//               disabled={
//                 checkoutLoading
//               }
//               className="
//                 btn-gold
//                 mt-7
//                 w-full
//                 rounded-sm
//                 disabled:cursor-not-allowed
//                 disabled:opacity-60
//               "
//             >
//               {checkoutLoading
//                 ? "Placing order..."
//                 : "Place order"}
//             </button>

//           </aside>

//         </form>

//       </div>

//     </main>
//   );
// }
