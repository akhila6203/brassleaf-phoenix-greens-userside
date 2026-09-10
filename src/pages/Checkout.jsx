import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

import {
  EMPTY_ADDRESS,
  getDefaultAddress,
  STUDENT_CLASSES,
} from "../utils/addressStorage";

import {
  loadCheckoutDraft,
  saveCheckoutDraft,
} from "../utils/checkoutDraft";

import axiosClient from "../api/axiosClient";

import {
  payOrderWithPaytm,
} from "../services/paymentService";

const INDIA_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const labels = {
  firstName: "Billing First name",
  lastName: "Billing Last name",

  parentName: "Billing Parent name",
  studentClass: "Billing Student Class",

  address: "Billing Street address",
  city: "Billing Town / City",
  state: "Billing State / County",
  pincode: "Billing Postcode / ZIP",
  phone: "Billing Phone",
  email: "Billing Email address",

  admissionNo: "Billing Student Admission No.",
};

function FieldError({ message }) {
  if (!message) return null;

  return (
    <p className="mt-1.5 text-xs font-semibold text-red-600">
      {message}
    </p>
  );
}

function TextField({
  label,
  required = false,
  value,
  onChange,
  type = "text",
  placeholder = "",
  error = "",
  autoComplete,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-[#1f2937]">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`h-11 w-full border bg-white px-3 text-sm text-[#243346] outline-none transition focus:border-[#D9A537] ${
          error ? "border-red-500" : "border-[#d8dce1]"
        }`}
      />

      <FieldError message={error} />
    </label>
  );
}

export default function Checkout() {
  const navigate = useNavigate();

  const {
    isAuthenticated,
    login,
    checkCustomerEmail,
    checkoutRegister,
  } = useAuth();

 const {
  cart,
  cartLoading,
  subtotal,
  shipping,
  total,
  clearCart,
} = useCart();

  const [form, setForm] = useState({
    ...EMPTY_ADDRESS,
    parentName:
    EMPTY_ADDRESS?.parentName || "",

  studentClass:
    EMPTY_ADDRESS?.studentClass || "Nursery",

  admissionNo:
    EMPTY_ADDRESS?.admissionNo || "",
    country: EMPTY_ADDRESS?.country || "India",
    state: EMPTY_ADDRESS?.state || "Telangana",
  });

  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});

  const [showCheckoutLogin, setShowCheckoutLogin] =
    useState(false);

  const [checkoutLogin, setCheckoutLogin] = useState({
    email: "",
    password: "",
  });

  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [accountPassword, setAccountPassword] =
    useState("");

  const [showAccountPassword, setShowAccountPassword] =
    useState(false);

  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutLoading, setCheckoutLoading] =
    useState(false);

  /*
   * Product subtotal already contains 18% GST.
   * CGST = 9%
   * SGST = 9%
   */
  const cgst =
    (Number(subtotal) * 9) / 118;

  const sgst =
    (Number(subtotal) * 9) / 118;

  const updateField =
    (key) =>
    (event) => {
      const value = event.target.value;

      setForm((previous) => ({
        ...previous,
        [key]: value,
      }));

      setErrors((previous) => ({
        ...previous,
        [key]: "",
      }));
    };

  const loadCustomerDetails = async () => {
    try {
      const { data } =
        await axiosClient.get(
          "/auth/customer/me"
        );

      const customer = data?.user;

      if (!customer) {
        return;
      }

      const billing =
        customer?.billingAddress || {};

      setForm((previous) => ({
        ...previous,

        firstName:
          billing.firstName ||
          customer?.firstName ||
          previous.firstName ||
          "",

        lastName:
          billing.lastName ||
          customer?.lastName ||
          previous.lastName ||
          "",

        parentName:
  billing.parentName ||
  previous.parentName ||
  "",

studentClass:
  billing.studentClass ||
  previous.studentClass ||
  "Nursery",

admissionNo:
  billing.admissionNo ||
  previous.admissionNo ||
  "",

        email: String(
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
          billing.country === "IN"
            ? "India"
            : billing.country ||
              previous.country ||
              "India",
      }));
    } catch (error) {
      if (
        error?.response?.status !== 401
      ) {
        console.error(
          "Checkout customer load error:",
          error
        );
      }
    }
  };

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

    const savedAddress =
      getDefaultAddress();

    if (savedAddress) {
      setForm((previous) => ({
        ...previous,

        firstName:
          savedAddress.firstName ||
          previous.firstName,

        lastName:
          savedAddress.lastName ||
          previous.lastName,

        parentName:
  savedAddress.parentName ||
  previous.parentName ||
  "",

studentClass:
  savedAddress.studentClass ||
  previous.studentClass ||
  "Nursery",

admissionNo:
  savedAddress.admissionNo ||
  previous.admissionNo ||
  "",

        email: String(
          savedAddress.email ||
            previous.email ||
            ""
        ).toLowerCase(),

        phone:
          savedAddress.phone ||
          previous.phone,

        address:
          savedAddress.address ||
          previous.address,

        address2:
          savedAddress.address2 ||
          previous.address2,

        city:
          savedAddress.city ||
          previous.city,

        state:
          savedAddress.state ||
          previous.state ||
          "Telangana",

        pincode:
          savedAddress.pincode ||
          previous.pincode,

        country:
          savedAddress.country ||
          previous.country ||
          "India",
      }));
    }
  }, [isAuthenticated]);

  const validate = () => {
    const next = {};

    [
      "firstName",
      "lastName",
       "parentName",
  "studentClass",
      "address",
      "city",
      "state",
      "pincode",
      "phone",
      "email",
      "admissionNo",
    ].forEach((key) => {
      if (
        !String(
          form[key] || ""
        ).trim()
      ) {
        next[key] =
          `${labels[key]} is a required field.`;
      }
    });

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
      Object.keys(next).length
    ) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    return (
      Object.keys(next).length === 0
    );
  };

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
          checkoutLogin.email ||
            form.email ||
            ""
        )
          .trim()
          .toLowerCase();

      const password =
        checkoutLogin.password;

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

        setShowCheckoutLogin(false);
        setLoginError("");
        setCheckoutError("");
        setAccountPassword("");
        setShowAccountPassword(false);

        await loadCustomerDetails();
      } catch (error) {
        setLoginError(
          error?.response?.data?.message ||
            error?.message ||
            "Invalid email or password."
        );
      } finally {
        setLoginLoading(false);
      }
    };

  const goToForgotPassword = () => {
    navigate(
      "/forgot-password",
      {
        state: {
          email:
            checkoutLogin.email ||
            form.email ||
            "",
          returnTo: "/checkout",
        },
      }
    );
  };

  /*
   * Existing DB structure is preserved.
   * Backend can save company into existing billing_company usermeta.
   */
  const saveCustomerBillingDetails =
    async () => {
      const { data } =
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

              // company:
              //   form.company || "",
              parentName:
                form.parentName,

              studentClass:
                form.studentClass,

              admissionNo:
                form.admissionNo,

              email:
                form.email,

              phone:
                form.phone,

              address1:
                form.address,

              address2:
                form.address2 || "",

              city:
                form.city,

              state:
                form.state,

              postcode:
                form.pincode,

              country:
                "IN",
            },
          }
        );

      return data?.user;
    };

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

          // company:
          //   form.company || "",
          parentName:
  form.parentName,

studentClass:
  form.studentClass,

admissionNo:
  form.admissionNo,

          country:
            "IN",

          address1:
            form.address,

          address2:
            form.address2 || "",

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
        },

        items:
          cart.map(
            (item) => ({
              key:
                item.key,

              productId:
                item.id,

              variationId:
                item.variationId ||
                item.variation_id ||
                null,

              name:
                item.name,

              image:
                item.image,

              size:
                item.size || "",

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

      const { data } =
        await axiosClient.post(
          "/customer/orders",
          payload
        );

      return (
        data?.order ||
        data?.data?.order ||
        data?.data ||
        data
      );
    };

  const submit =
    async (event) => {
      event.preventDefault();

      if (checkoutLoading) {
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

        if (!customerIsReady) {
          const emailCheck =
            await checkCustomerEmail(
              form.email
            );

          if (!emailCheck?.ok) {
            setCheckoutError(
              emailCheck?.message ||
                "Unable to verify your email address."
            );

            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });

            return;
          }

          if (emailCheck.exists) {
            setCheckoutError(
              "An account is already registered with your email address."
            );

            setCheckoutLogin(
              (previous) => ({
                ...previous,
                email: String(
                  form.email || ""
                )
                  .trim()
                  .toLowerCase(),
              })
            );

            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });

            return;
          }

          if (!accountPassword) {
            setCheckoutError(
              "Create account password is a required field."
            );

            setShowAccountPassword(
              true
            );

            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });

            return;
          }

          if (
            accountPassword.length < 8
          ) {
            setCheckoutError(
              "Create account password must be at least 8 characters."
            );

            setShowAccountPassword(
              true
            );

            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });

            return;
          }

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
            if (
              registration?.status ===
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
                registration?.message ||
                  "Unable to create your account."
              );
            }

            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });

            return;
          }

          customerIsReady = true;

          setAccountPassword("");
          setShowAccountPassword(false);
        }

        if (customerIsReady) {
          await saveCustomerBillingDetails();
        }

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
          await payOrderWithPaytm(
            orderId,
            {
              onSuccess:
                async () => {
                  await clearCart();

                  navigate(
                    `/order-success?orderId=${orderId}`,
                    {
                      replace:
                        true,
                    }
                  );
                },

              onFailure:
                async () => {
                  await clearCart();
                  goToPayPage();
                },
            }
          );
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
          error?.response?.data
            ?.message ||
          error?.response?.data
            ?.error ||
          error?.message ||
          "Unable to place your order. Please try again.";

        setCheckoutError(
          message
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } finally {
        setCheckoutLoading(
          false
        );
      }
    };

    if (cartLoading) {
  return (
    <main className="container-site py-24 text-center">
      <p className="text-sm font-semibold text-[#243346]">
        Loading your cart...
      </p>
    </main>
  );
}
  if (!cart.length) {
    return (
      <main className="container-site py-24 text-center">
        <h1 className="text-3xl font-black text-[#243346]">
          Your cart is empty
        </h1>
      </main>
    );
  }

  return (
    <main className="bg-white">
      <div className="container-site py-8 sm:py-12">

        {/* CHECKOUT PAGE HEADING */}
<div className="mb-8  pb-5">
  <h1 className="text-2xl font-black text-[#243346] sm:text-3xl">
    Checkout
  </h1>
</div>

        {Object.keys(errors)
          .length > 0 && (
          <div className="mb-7 border-l-4 border-red-700 bg-[#e93b1d] px-6 py-4 text-sm font-bold text-white">
            {Object.values(
              errors
            ).map(
              (
                message,
                index
              ) => (
                <p
                  key={index}
                  className="py-0.5"
                >
                  {message}
                </p>
              )
            )}
          </div>
        )}

        {!isAuthenticated && (
          <div className="mb-10 border-t-2 border-[#243346] bg-white px-4 py-4 text-[13px] text-[#243346]">
            <button
              type="button"
              onClick={() => {
                setShowCheckoutLogin(
                  (previous) =>
                    !previous
                );

                if (
                  form.email &&
                  !checkoutLogin.email
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
              className="inline-flex items-center gap-3"
            >
              <span className="h-3 w-3 border border-[#243346] bg-white" />

              <span>
                Returning customer?{" "}
                <b className="font-semibold text-[#D9A537]">
                  Click here to login
                </b>
              </span>
            </button>

            {showCheckoutLogin && (
              <form
                onSubmit={
                  handleCheckoutLogin
                }
                className="mt-5 max-w-2xl border-t border-slate-200 pt-5"
              >
                <p className="mb-5 text-sm leading-6 text-[#243346]">
                  If you have shopped with
                  us before, please enter
                  your details below.
                </p>

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    label="Username or email"
                    required
                    type="email"
                    value={
                      checkoutLogin.email
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
                  />

                  <TextField
                    label="Password"
                    required
                    type="password"
                    value={
                      checkoutLogin.password
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
                  />
                </div>

                {loginError && (
                  <p className="mt-4 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {loginError}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <button
                    type="submit"
                    disabled={
                      loginLoading
                    }
                    className="bg-[#D9A537] px-7 py-3 text-xs font-bold uppercase text-[#243346] transition hover:bg-[#c6972f] disabled:opacity-60"
                  >
                    {loginLoading
                      ? "Logging in..."
                      : "Login"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      goToForgotPassword
                    }
                    className="text-sm font-semibold text-[#D9A537] hover:underline"
                  >
                    Lost your password?
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {checkoutError && (
          <div className="mb-8 border-l-4 border-[#c92d13] bg-[#e93b1d] px-7 py-4 text-sm font-bold text-white">
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
                      (previous) => ({
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
                  className="font-black underline"
                >
                  Please log in.
                </button>
              </>
            )}
          </div>
        )}

        <form
          onSubmit={submit}
          noValidate
          className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_390px]"
        >
          <section>
            <h1 className="border-b border-slate-300 pb-4 text-[18px] font-black text-[#111827]">
              Billing & Shipping
            </h1>

            <div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <TextField
                label="First name"
                required
                value={
                  form.firstName || ""
                }
                onChange={
                  updateField(
                    "firstName"
                  )
                }
                error={
                  errors.firstName
                }
                autoComplete="given-name"
              />

              <TextField
                label="Last name"
                required
                value={
                  form.lastName || ""
                }
                onChange={
                  updateField(
                    "lastName"
                  )
                }
                error={
                  errors.lastName
                }
                autoComplete="family-name"
              />
            </div>
              <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
  <TextField
    label="Parent name"
    required
    value={
      form.parentName || ""
    }
    onChange={
      updateField(
        "parentName"
      )
    }
    error={
      errors.parentName
    }
  />

  <label className="block">
    <span className="mb-2 block text-[13px] font-semibold text-[#1f2937]">
      Student Class
      <span className="ml-1 text-red-500">
        *
      </span>
    </span>

    <select
      value={
        form.studentClass ||
        "Nursery"
      }
      onChange={
        updateField(
          "studentClass"
        )
      }
      className={`h-11 w-full border bg-white px-3 text-sm text-[#243346] outline-none transition focus:border-[#D9A537] ${
        errors.studentClass
          ? "border-red-500"
          : "border-[#d8dce1]"
      }`}
    >
     {STUDENT_CLASSES.map(
      (studentClass) => (
        <option
          key={studentClass}
          value={studentClass}
        >
          {studentClass}
        </option>
      )
    )}
    </select>

    <FieldError
      message={
        errors.studentClass
      }
    />
  </label>
</div>
            {/* <div className="mt-4">
              <TextField
                label="Company name (optional)"
                value={
                  form.company || ""
                }
                onChange={
                  updateField(
                    "company"
                  )
                }
                autoComplete="organization"
              />
            </div> */}

            <div className="mt-4">
              <span className="mb-1 block text-[13px] font-semibold text-[#1f2937]">
                Country / Region{" "}
                <span className="text-red-500">
                  *
                </span>
              </span>

              <p className="py-1 text-sm font-semibold text-[#243346]">
                India
              </p>
            </div>

            <div className="mt-4">
              <span className="mb-2 block text-[13px] font-semibold text-[#1f2937]">
                Street address{" "}
                <span className="text-red-500">
                  *
                </span>
              </span>

              <input
                type="text"
                value={
                  form.address || ""
                }
                onChange={
                  updateField(
                    "address"
                  )
                }
                placeholder="House number and street name"
                autoComplete="address-line1"
                className={`h-11 w-full border bg-white px-3 text-sm text-[#243346] outline-none transition focus:border-[#D9A537] ${
                  errors.address
                    ? "border-red-500"
                    : "border-[#d8dce1]"
                }`}
              />

              <FieldError
                message={
                  errors.address
                }
              />

              <input
                type="text"
                value={
                  form.address2 || ""
                }
                onChange={
                  updateField(
                    "address2"
                  )
                }
                placeholder="Apartment, suite, unit, etc. (optional)"
                autoComplete="address-line2"
                className="mt-3 h-11 w-full border border-[#d8dce1] bg-white px-3 text-sm text-[#243346] outline-none transition focus:border-[#D9A537]"
              />
            </div>

            <div className="mt-4">
              <TextField
                label="Town / City"
                required
                value={
                  form.city || ""
                }
                onChange={
                  updateField(
                    "city"
                  )
                }
                error={
                  errors.city
                }
                autoComplete="address-level2"
              />
            </div>

            <div className="mt-4">
              <label className="block">
                <span className="mb-2 block text-[13px] font-semibold text-[#1f2937]">
                  State / County{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </span>

                <select
                  value={
                    form.state ||
                    "Telangana"
                  }
                  onChange={
                    updateField(
                      "state"
                    )
                  }
                  className={`h-11 w-full border bg-white px-3 text-sm text-[#243346] outline-none transition focus:border-[#D9A537] ${
                    errors.state
                      ? "border-red-500"
                      : "border-[#d8dce1]"
                  }`}
                >
                  {INDIA_STATES.map(
                    (state) => (
                      <option
                        key={state}
                        value={state}
                      >
                        {state}
                      </option>
                    )
                  )}
                </select>

                <FieldError
                  message={
                    errors.state
                  }
                />
              </label>
            </div>

            <div className="mt-4">
              <TextField
                label="Postcode / ZIP"
                required
                value={
                  form.pincode || ""
                }
                onChange={
                  updateField(
                    "pincode"
                  )
                }
                error={
                  errors.pincode
                }
                autoComplete="postal-code"
              />
            </div>

            <div className="mt-4">
              <TextField
                label="Phone"
                required
                type="tel"
                value={
                  form.phone || ""
                }
                onChange={
                  updateField(
                    "phone"
                  )
                }
                error={
                  errors.phone
                }
                autoComplete="tel"
              />
            </div>

            <div className="mt-4">
              <TextField
                label="Email address"
                required
                type="email"
                value={
                  form.email || ""
                }
                onChange={(
                  event
                ) => {
                  const value =
                    event.target.value
                      .toLowerCase();

                  setForm(
                    (previous) => ({
                      ...previous,
                      email:
                        value,
                    })
                  );

                  setErrors(
                    (previous) => ({
                      ...previous,
                      email: "",
                    })
                  );
                }}
                error={
                  errors.email
                }
                autoComplete="email"
              />
            </div>

            <div className="mt-4">
  <TextField
    label="Student Admission No."
    required
    value={
      form.admissionNo || ""
    }
    onChange={
      updateField(
        "admissionNo"
      )
    }
    error={
      errors.admissionNo
    }
  />
</div>

            {!isAuthenticated && (
              <div className="mt-4">
                <label className="block">
                  <span className="mb-2 block text-[13px] font-semibold text-[#1f2937]">
                    Create account password{" "}
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
                    autoComplete="new-password"
                    className="h-11 w-full border border-[#d8dce1] bg-white px-3 text-sm text-[#243346] outline-none transition focus:border-[#D9A537]"
                  />

                  {showAccountPassword &&
                    accountPassword &&
                    accountPassword
                      .length < 8 && (
                    <p className="mt-2 text-xs font-semibold text-red-600">
                      Password must
                      contain at least
                      8 characters.
                    </p>
                  )}
                </label>
              </div>
            )}

            <h2 className="mt-10 border-b border-slate-300 pb-4 text-[18px] font-black text-[#111827]">
              Additional information
            </h2>

            <label className="mt-5 block text-[13px] font-semibold text-[#1f2937]">
              Order notes{" "}
              <span className="font-normal text-slate-500">
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
              className="mt-2 w-full resize-y border border-[#d8dce1] bg-white px-3 py-3 text-sm text-[#243346] outline-none transition focus:border-[#D9A537]"
              placeholder="Notes about your order, e.g. special notes for delivery."
            />
          </section>

          <aside className="h-fit border border-[#d7dce2] bg-[#f8f9fa] p-6 lg:sticky lg:top-24">
            <h2 className="text-[18px] font-black text-[#111827]">
              Your order
            </h2>

            <div className="mt-7 flex justify-between border-b border-slate-300 pb-4 text-sm font-black text-[#243346]">
              <span>Product</span>
              <span>Subtotal</span>
            </div>

            <div className="divide-y divide-slate-200">
              {cart.map(
                (item) => (
                  <div
                    key={
                      item.key
                    }
                    className="flex justify-between gap-5 py-4 text-sm text-[#243346]"
                  >
                    <span className="max-w-[220px]">
                      {item.name}

                      {item.size && (
                        <>
                          {" - "}
                          {item.size}
                        </>
                      )}

                      {" × "}
                      {item.quantity}
                    </span>

                    <span className="whitespace-nowrap">
                      ₹
                      {(
                        Number(
                          item.price
                        ) *
                        Number(
                          item.quantity
                        )
                      ).toFixed(2)}
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="flex justify-between border-t border-slate-300 py-5 text-sm text-[#243346]">
              <span>Subtotal</span>

              <span>
                ₹
                {Number(
                  subtotal
                ).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between border-t border-slate-300 py-5 text-sm text-[#243346]">
              <span>Shipping</span>

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

            <div className="border-t border-slate-300 py-5">
              <div className="flex items-start justify-between gap-4">
                <span className="pt-1 text-sm text-[#243346]">
                  Total
                </span>

                <div className="text-right">
                  <div className="text-[16px] font-medium text-[#243346]">
                    ₹
                    {Number(
                      total
                    ).toFixed(2)}
                  </div>

                  <div className="mt-1 text-[10px] leading-5 text-[#243346]">
                    (includes{" "}
                    ₹
                    {cgst.toFixed(
                      2
                    )}{" "}
                    9% CGST,
                    <br />
                    ₹
                    {sgst.toFixed(
                      2
                    )}{" "}
                    9% SGST)
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-300 pt-6">
              <p className="text-sm font-medium text-[#243346]">
                Paytm Payment
                Gateway
              </p>

              <div className="mt-2 inline-flex items-center text-[24px] font-black">
                <span className="text-[#162d70]">
                  pay
                </span>

                <span className="text-[#00baf2]">
                  tm
                </span>

                <span className="ml-1 rounded bg-[#00baf2] px-1.5 py-0.5 text-[10px] text-white">
                  PG
                </span>
              </div>

              <div className="relative mt-4 bg-[#eeeeee] px-4 py-4 text-xs leading-5 text-[#5b6168]">
                <span className="absolute -top-2 left-6 h-4 w-4 rotate-45 bg-[#eeeeee]" />

                <p className="relative">
                  The best payment
                  gateway provider in
                  India for e-payment
                  through credit card,
                  debit card &
                  netbanking.
                </p>
              </div>

              <p className="mt-7 text-sm leading-6 text-[#243346]">
                Your personal data will
                be used to process your
                order, support your
                experience throughout
                this website, and for
                other purposes described
                in our privacy policy.
              </p>

              <button
                type="submit"
                disabled={
                  checkoutLoading
                }
                className="mt-6 w-full bg-[#D9A537] px-5 py-4 text-xs font-black uppercase text-[#243346] transition hover:bg-[#c6972f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkoutLoading
                  ? "Placing order..."
                  : "Place order"}
              </button>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}













// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// import { useCart } from "../context/CartContext";
// import { useAuth } from "../context/AuthContext";

// import {
//   EMPTY_ADDRESS,
//   getDefaultAddress,
//   STUDENT_CLASSES,
// } from "../utils/addressStorage";

// import {
//   loadCheckoutDraft,
//   saveCheckoutDraft,
// } from "../utils/checkoutDraft";

// import axiosClient from "../api/axiosClient";

// import {
//   payOrderWithPaytm,
// } from "../services/paymentService";

// const INDIA_STATES = [
//   "Andhra Pradesh",
//   "Arunachal Pradesh",
//   "Assam",
//   "Bihar",
//   "Chhattisgarh",
//   "Goa",
//   "Gujarat",
//   "Haryana",
//   "Himachal Pradesh",
//   "Jharkhand",
//   "Karnataka",
//   "Kerala",
//   "Madhya Pradesh",
//   "Maharashtra",
//   "Manipur",
//   "Meghalaya",
//   "Mizoram",
//   "Nagaland",
//   "Odisha",
//   "Punjab",
//   "Rajasthan",
//   "Sikkim",
//   "Tamil Nadu",
//   "Telangana",
//   "Tripura",
//   "Uttar Pradesh",
//   "Uttarakhand",
//   "West Bengal",
//   "Andaman and Nicobar Islands",
//   "Chandigarh",
//   "Dadra and Nagar Haveli and Daman and Diu",
//   "Delhi",
//   "Jammu and Kashmir",
//   "Ladakh",
//   "Lakshadweep",
//   "Puducherry",
// ];

// const labels = {
//   firstName: "Billing First name",
//   lastName: "Billing Last name",

//   parentName: "Billing Parent name",
//   studentClass: "Billing Student Class",

//   address: "Billing Street address",
//   city: "Billing Town / City",
//   state: "Billing State / County",
//   pincode: "Billing Postcode / ZIP",
//   phone: "Billing Phone",
//   email: "Billing Email address",

//   admissionNo: "Billing Student Admission No.",
// };

// function FieldError({ message }) {
//   if (!message) return null;

//   return (
//     <p className="mt-1.5 text-xs font-semibold text-red-600">
//       {message}
//     </p>
//   );
// }

// function TextField({
//   label,
//   required = false,
//   value,
//   onChange,
//   type = "text",
//   placeholder = "",
//   error = "",
//   autoComplete,
// }) {
//   return (
//     <label className="block">
//       <span className="mb-2 block text-[13px] font-semibold text-[#1f2937]">
//         {label}
//         {required && (
//           <span className="ml-1 text-red-500">*</span>
//         )}
//       </span>

//       <input
//         type={type}
//         value={value}
//         onChange={onChange}
//         placeholder={placeholder}
//         autoComplete={autoComplete}
//         className={`h-11 w-full border bg-white px-3 text-sm text-[#243346] outline-none transition focus:border-[#D9A537] ${
//           error ? "border-red-500" : "border-[#d8dce1]"
//         }`}
//       />

//       <FieldError message={error} />
//     </label>
//   );
// }

// export default function Checkout() {
//   const navigate = useNavigate();

//   const {
//     isAuthenticated,
//     login,
//     checkCustomerEmail,
//     checkoutRegister,
//   } = useAuth();

//   const {
//     cart,
//     subtotal,
//     shipping,
//     total,
//     clearCart,
//   } = useCart();

//   const [form, setForm] = useState({
//     ...EMPTY_ADDRESS,
//     parentName:
//     EMPTY_ADDRESS?.parentName || "",

//   studentClass:
//     EMPTY_ADDRESS?.studentClass || "Nursery",

//   admissionNo:
//     EMPTY_ADDRESS?.admissionNo || "",
//     country: EMPTY_ADDRESS?.country || "India",
//     state: EMPTY_ADDRESS?.state || "Telangana",
//   });

//   const [notes, setNotes] = useState("");
//   const [errors, setErrors] = useState({});

//   const [showCheckoutLogin, setShowCheckoutLogin] =
//     useState(false);

//   const [checkoutLogin, setCheckoutLogin] = useState({
//     email: "",
//     password: "",
//   });

//   const [loginError, setLoginError] = useState("");
//   const [loginLoading, setLoginLoading] = useState(false);

//   const [accountPassword, setAccountPassword] =
//     useState("");

//   const [showAccountPassword, setShowAccountPassword] =
//     useState(false);

//   const [checkoutError, setCheckoutError] = useState("");
//   const [checkoutLoading, setCheckoutLoading] =
//     useState(false);

//   /*
//    * Product subtotal already contains 18% GST.
//    * CGST = 9%
//    * SGST = 9%
//    */
//   const cgst =
//     (Number(subtotal) * 9) / 118;

//   const sgst =
//     (Number(subtotal) * 9) / 118;

//   const updateField =
//     (key) =>
//     (event) => {
//       const value = event.target.value;

//       setForm((previous) => ({
//         ...previous,
//         [key]: value,
//       }));

//       setErrors((previous) => ({
//         ...previous,
//         [key]: "",
//       }));
//     };

//   const loadCustomerDetails = async () => {
//     try {
//       const { data } =
//         await axiosClient.get(
//           "/auth/customer/me"
//         );

//       const customer = data?.user;

//       if (!customer) {
//         return;
//       }

//       const billing =
//         customer?.billingAddress || {};

//       setForm((previous) => ({
//         ...previous,

//         firstName:
//           billing.firstName ||
//           customer?.firstName ||
//           previous.firstName ||
//           "",

//         lastName:
//           billing.lastName ||
//           customer?.lastName ||
//           previous.lastName ||
//           "",

//         parentName:
//   billing.parentName ||
//   previous.parentName ||
//   "",

// studentClass:
//   billing.studentClass ||
//   previous.studentClass ||
//   "Nursery",

// admissionNo:
//   billing.admissionNo ||
//   previous.admissionNo ||
//   "",

//         email: String(
//           billing.email ||
//             customer?.email ||
//             previous.email ||
//             ""
//         ).toLowerCase(),

//         phone:
//           billing.phone ||
//           customer?.phone ||
//           previous.phone ||
//           "",

//         address:
//           billing.address1 ||
//           previous.address ||
//           "",

//         address2:
//           billing.address2 ||
//           previous.address2 ||
//           "",

//         city:
//           billing.city ||
//           previous.city ||
//           "",

//         state:
//           billing.state ||
//           previous.state ||
//           "Telangana",

//         pincode:
//           billing.postcode ||
//           previous.pincode ||
//           "",

//         country:
//           billing.country === "IN"
//             ? "India"
//             : billing.country ||
//               previous.country ||
//               "India",
//       }));
//     } catch (error) {
//       if (
//         error?.response?.status !== 401
//       ) {
//         console.error(
//           "Checkout customer load error:",
//           error
//         );
//       }
//     }
//   };

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

//     const savedAddress =
//       getDefaultAddress();

//     if (savedAddress) {
//       setForm((previous) => ({
//         ...previous,

//         firstName:
//           savedAddress.firstName ||
//           previous.firstName,

//         lastName:
//           savedAddress.lastName ||
//           previous.lastName,

//         parentName:
//   savedAddress.parentName ||
//   previous.parentName ||
//   "",

// studentClass:
//   savedAddress.studentClass ||
//   previous.studentClass ||
//   "Nursery",

// admissionNo:
//   savedAddress.admissionNo ||
//   previous.admissionNo ||
//   "",

//         email: String(
//           savedAddress.email ||
//             previous.email ||
//             ""
//         ).toLowerCase(),

//         phone:
//           savedAddress.phone ||
//           previous.phone,

//         address:
//           savedAddress.address ||
//           previous.address,

//         address2:
//           savedAddress.address2 ||
//           previous.address2,

//         city:
//           savedAddress.city ||
//           previous.city,

//         state:
//           savedAddress.state ||
//           previous.state ||
//           "Telangana",

//         pincode:
//           savedAddress.pincode ||
//           previous.pincode,

//         country:
//           savedAddress.country ||
//           previous.country ||
//           "India",
//       }));
//     }
//   }, [isAuthenticated]);

//   const validate = () => {
//     const next = {};

//     [
//       "firstName",
//       "lastName",
//        "parentName",
//   "studentClass",
//       "address",
//       "city",
//       "state",
//       "pincode",
//       "phone",
//       "email",
//       "admissionNo",
//     ].forEach((key) => {
//       if (
//         !String(
//           form[key] || ""
//         ).trim()
//       ) {
//         next[key] =
//           `${labels[key]} is a required field.`;
//       }
//     });

//     const phone =
//       String(
//         form.phone || ""
//       ).trim();

//     if (
//       phone &&
//       !/^\d{10}$/.test(phone)
//     ) {
//       next.phone =
//         "Phone number must be exactly 10 digits.";
//     }

//     const email =
//       String(
//         form.email || ""
//       ).trim();

//     if (
//       email &&
//       !/^[a-z0-9._%+-]+@gmail\.com$/.test(
//         email
//       )
//     ) {
//       next.email =
//         "Email must be lowercase and end with @gmail.com.";
//     }

//     setErrors(next);

//     if (
//       Object.keys(next).length
//     ) {
//       window.scrollTo({
//         top: 0,
//         behavior: "smooth",
//       });
//     }

//     return (
//       Object.keys(next).length === 0
//     );
//   };

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
//           checkoutLogin.email ||
//             form.email ||
//             ""
//         )
//           .trim()
//           .toLowerCase();

//       const password =
//         checkoutLogin.password;

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

//         setShowCheckoutLogin(false);
//         setLoginError("");
//         setCheckoutError("");
//         setAccountPassword("");
//         setShowAccountPassword(false);

//         await loadCustomerDetails();
//       } catch (error) {
//         setLoginError(
//           error?.response?.data?.message ||
//             error?.message ||
//             "Invalid email or password."
//         );
//       } finally {
//         setLoginLoading(false);
//       }
//     };

//   const goToForgotPassword = () => {
//     navigate(
//       "/forgot-password",
//       {
//         state: {
//           email:
//             checkoutLogin.email ||
//             form.email ||
//             "",
//           returnTo: "/checkout",
//         },
//       }
//     );
//   };

//   /*
//    * Existing DB structure is preserved.
//    * Backend can save company into existing billing_company usermeta.
//    */
//   const saveCustomerBillingDetails =
//     async () => {
//       const { data } =
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

//               // company:
//               //   form.company || "",
//               parentName:
//                 form.parentName,

//               studentClass:
//                 form.studentClass,

//               admissionNo:
//                 form.admissionNo,

//               email:
//                 form.email,

//               phone:
//                 form.phone,

//               address1:
//                 form.address,

//               address2:
//                 form.address2 || "",

//               city:
//                 form.city,

//               state:
//                 form.state,

//               postcode:
//                 form.pincode,

//               country:
//                 "IN",
//             },
//           }
//         );

//       return data?.user;
//     };

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

//           // company:
//           //   form.company || "",
//           parentName:
//   form.parentName,

// studentClass:
//   form.studentClass,

// admissionNo:
//   form.admissionNo,

//           country:
//             "IN",

//           address1:
//             form.address,

//           address2:
//             form.address2 || "",

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
//         },

//         items:
//           cart.map(
//             (item) => ({
//               key:
//                 item.key,

//               productId:
//                 item.id,

//               variationId:
//                 item.variationId ||
//                 item.variation_id ||
//                 null,

//               name:
//                 item.name,

//               image:
//                 item.image,

//               size:
//                 item.size || "",

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

//       const { data } =
//         await axiosClient.post(
//           "/customer/orders",
//           payload
//         );

//       return (
//         data?.order ||
//         data?.data?.order ||
//         data?.data ||
//         data
//       );
//     };

//   const submit =
//     async (event) => {
//       event.preventDefault();

//       if (checkoutLoading) {
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

//         if (!customerIsReady) {
//           const emailCheck =
//             await checkCustomerEmail(
//               form.email
//             );

//           if (!emailCheck?.ok) {
//             setCheckoutError(
//               emailCheck?.message ||
//                 "Unable to verify your email address."
//             );

//             window.scrollTo({
//               top: 0,
//               behavior: "smooth",
//             });

//             return;
//           }

//           if (emailCheck.exists) {
//             setCheckoutError(
//               "An account is already registered with your email address."
//             );

//             setCheckoutLogin(
//               (previous) => ({
//                 ...previous,
//                 email: String(
//                   form.email || ""
//                 )
//                   .trim()
//                   .toLowerCase(),
//               })
//             );

//             window.scrollTo({
//               top: 0,
//               behavior: "smooth",
//             });

//             return;
//           }

//           if (!accountPassword) {
//             setCheckoutError(
//               "Create account password is a required field."
//             );

//             setShowAccountPassword(
//               true
//             );

//             window.scrollTo({
//               top: 0,
//               behavior: "smooth",
//             });

//             return;
//           }

//           if (
//             accountPassword.length < 8
//           ) {
//             setCheckoutError(
//               "Create account password must be at least 8 characters."
//             );

//             setShowAccountPassword(
//               true
//             );

//             window.scrollTo({
//               top: 0,
//               behavior: "smooth",
//             });

//             return;
//           }

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
//             if (
//               registration?.status ===
//               409
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
//                 registration?.message ||
//                   "Unable to create your account."
//               );
//             }

//             window.scrollTo({
//               top: 0,
//               behavior: "smooth",
//             });

//             return;
//           }

//           customerIsReady = true;

//           setAccountPassword("");
//           setShowAccountPassword(false);
//         }

//         if (customerIsReady) {
//           await saveCustomerBillingDetails();
//         }

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

//         saveCheckoutDraft({
//           form,
//           notes,
//         });

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
//           await payOrderWithPaytm(
//             orderId,
//             {
//               onSuccess:
//                 async () => {
//                   await clearCart();

//                   navigate(
//                     `/order-success?orderId=${orderId}`,
//                     {
//                       replace:
//                         true,
//                     }
//                   );
//                 },

//               onFailure:
//                 async () => {
//                   await clearCart();
//                   goToPayPage();
//                 },
//             }
//           );
//         } catch {
//           await clearCart();
//           goToPayPage();
//         }
//       } catch (error) {
//         console.error(
//           "Checkout error:",
//           error
//         );

//         const message =
//           error?.response?.data
//             ?.message ||
//           error?.response?.data
//             ?.error ||
//           error?.message ||
//           "Unable to place your order. Please try again.";

//         setCheckoutError(
//           message
//         );

//         window.scrollTo({
//           top: 0,
//           behavior: "smooth",
//         });
//       } finally {
//         setCheckoutLoading(
//           false
//         );
//       }
//     };

//   if (!cart.length) {
//     return (
//       <main className="container-site py-24 text-center">
//         <h1 className="text-3xl font-black text-[#243346]">
//           Your cart is empty
//         </h1>
//       </main>
//     );
//   }

//   return (
//     <main className="bg-white">
//       <div className="container-site py-8 sm:py-12">

//         {/* CHECKOUT PAGE HEADING */}
// <div className="mb-8  pb-5">
//   <h1 className="text-2xl font-black text-[#243346] sm:text-3xl">
//     Checkout
//   </h1>
// </div>

//         {Object.keys(errors)
//           .length > 0 && (
//           <div className="mb-7 border-l-4 border-red-700 bg-[#e93b1d] px-6 py-4 text-sm font-bold text-white">
//             {Object.values(
//               errors
//             ).map(
//               (
//                 message,
//                 index
//               ) => (
//                 <p
//                   key={index}
//                   className="py-0.5"
//                 >
//                   {message}
//                 </p>
//               )
//             )}
//           </div>
//         )}

//         {!isAuthenticated && (
//           <div className="mb-10 border-t-2 border-[#243346] bg-white px-4 py-4 text-[13px] text-[#243346]">
//             <button
//               type="button"
//               onClick={() => {
//                 setShowCheckoutLogin(
//                   (previous) =>
//                     !previous
//                 );

//                 if (
//                   form.email &&
//                   !checkoutLogin.email
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
//               className="inline-flex items-center gap-3"
//             >
//               <span className="h-3 w-3 border border-[#243346] bg-white" />

//               <span>
//                 Returning customer?{" "}
//                 <b className="font-semibold text-[#D9A537]">
//                   Click here to login
//                 </b>
//               </span>
//             </button>

//             {showCheckoutLogin && (
//               <form
//                 onSubmit={
//                   handleCheckoutLogin
//                 }
//                 className="mt-5 max-w-2xl border-t border-slate-200 pt-5"
//               >
//                 <p className="mb-5 text-sm leading-6 text-[#243346]">
//                   If you have shopped with
//                   us before, please enter
//                   your details below.
//                 </p>

//                 <div className="grid gap-5 sm:grid-cols-2">
//                   <TextField
//                     label="Username or email"
//                     required
//                     type="email"
//                     value={
//                       checkoutLogin.email
//                     }
//                     onChange={(
//                       event
//                     ) =>
//                       setCheckoutLogin(
//                         (
//                           previous
//                         ) => ({
//                           ...previous,
//                           email:
//                             event
//                               .target
//                               .value,
//                         })
//                       )
//                     }
//                   />

//                   <TextField
//                     label="Password"
//                     required
//                     type="password"
//                     value={
//                       checkoutLogin.password
//                     }
//                     onChange={(
//                       event
//                     ) =>
//                       setCheckoutLogin(
//                         (
//                           previous
//                         ) => ({
//                           ...previous,
//                           password:
//                             event
//                               .target
//                               .value,
//                         })
//                       )
//                     }
//                   />
//                 </div>

//                 {loginError && (
//                   <p className="mt-4 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
//                     {loginError}
//                   </p>
//                 )}

//                 <div className="mt-5 flex flex-wrap items-center gap-4">
//                   <button
//                     type="submit"
//                     disabled={
//                       loginLoading
//                     }
//                     className="bg-[#D9A537] px-7 py-3 text-xs font-bold uppercase text-[#243346] transition hover:bg-[#c6972f] disabled:opacity-60"
//                   >
//                     {loginLoading
//                       ? "Logging in..."
//                       : "Login"}
//                   </button>

//                   <button
//                     type="button"
//                     onClick={
//                       goToForgotPassword
//                     }
//                     className="text-sm font-semibold text-[#D9A537] hover:underline"
//                   >
//                     Lost your password?
//                   </button>
//                 </div>
//               </form>
//             )}
//           </div>
//         )}

//         {checkoutError && (
//           <div className="mb-8 border-l-4 border-[#c92d13] bg-[#e93b1d] px-7 py-4 text-sm font-bold text-white">
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
//                       (previous) => ({
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
//                   className="font-black underline"
//                 >
//                   Please log in.
//                 </button>
//               </>
//             )}
//           </div>
//         )}

//         <form
//           onSubmit={submit}
//           noValidate
//           className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_390px]"
//         >
//           <section>
//             <h1 className="border-b border-slate-300 pb-4 text-[18px] font-black text-[#111827]">
//               Billing & Shipping
//             </h1>

//             <div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
//               <TextField
//                 label="First name"
//                 required
//                 value={
//                   form.firstName || ""
//                 }
//                 onChange={
//                   updateField(
//                     "firstName"
//                   )
//                 }
//                 error={
//                   errors.firstName
//                 }
//                 autoComplete="given-name"
//               />

//               <TextField
//                 label="Last name"
//                 required
//                 value={
//                   form.lastName || ""
//                 }
//                 onChange={
//                   updateField(
//                     "lastName"
//                   )
//                 }
//                 error={
//                   errors.lastName
//                 }
//                 autoComplete="family-name"
//               />
//             </div>
//               <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
//   <TextField
//     label="Parent name"
//     required
//     value={
//       form.parentName || ""
//     }
//     onChange={
//       updateField(
//         "parentName"
//       )
//     }
//     error={
//       errors.parentName
//     }
//   />

//   <label className="block">
//     <span className="mb-2 block text-[13px] font-semibold text-[#1f2937]">
//       Student Class
//       <span className="ml-1 text-red-500">
//         *
//       </span>
//     </span>

//     <select
//       value={
//         form.studentClass ||
//         "Nursery"
//       }
//       onChange={
//         updateField(
//           "studentClass"
//         )
//       }
//       className={`h-11 w-full border bg-white px-3 text-sm text-[#243346] outline-none transition focus:border-[#D9A537] ${
//         errors.studentClass
//           ? "border-red-500"
//           : "border-[#d8dce1]"
//       }`}
//     >
//      {STUDENT_CLASSES.map(
//       (studentClass) => (
//         <option
//           key={studentClass}
//           value={studentClass}
//         >
//           {studentClass}
//         </option>
//       )
//     )}
//     </select>

//     <FieldError
//       message={
//         errors.studentClass
//       }
//     />
//   </label>
// </div>
//             {/* <div className="mt-4">
//               <TextField
//                 label="Company name (optional)"
//                 value={
//                   form.company || ""
//                 }
//                 onChange={
//                   updateField(
//                     "company"
//                   )
//                 }
//                 autoComplete="organization"
//               />
//             </div> */}

//             <div className="mt-4">
//               <span className="mb-1 block text-[13px] font-semibold text-[#1f2937]">
//                 Country / Region{" "}
//                 <span className="text-red-500">
//                   *
//                 </span>
//               </span>

//               <p className="py-1 text-sm font-semibold text-[#243346]">
//                 India
//               </p>
//             </div>

//             <div className="mt-4">
//               <span className="mb-2 block text-[13px] font-semibold text-[#1f2937]">
//                 Street address{" "}
//                 <span className="text-red-500">
//                   *
//                 </span>
//               </span>

//               <input
//                 type="text"
//                 value={
//                   form.address || ""
//                 }
//                 onChange={
//                   updateField(
//                     "address"
//                   )
//                 }
//                 placeholder="House number and street name"
//                 autoComplete="address-line1"
//                 className={`h-11 w-full border bg-white px-3 text-sm text-[#243346] outline-none transition focus:border-[#D9A537] ${
//                   errors.address
//                     ? "border-red-500"
//                     : "border-[#d8dce1]"
//                 }`}
//               />

//               <FieldError
//                 message={
//                   errors.address
//                 }
//               />

//               <input
//                 type="text"
//                 value={
//                   form.address2 || ""
//                 }
//                 onChange={
//                   updateField(
//                     "address2"
//                   )
//                 }
//                 placeholder="Apartment, suite, unit, etc. (optional)"
//                 autoComplete="address-line2"
//                 className="mt-3 h-11 w-full border border-[#d8dce1] bg-white px-3 text-sm text-[#243346] outline-none transition focus:border-[#D9A537]"
//               />
//             </div>

//             <div className="mt-4">
//               <TextField
//                 label="Town / City"
//                 required
//                 value={
//                   form.city || ""
//                 }
//                 onChange={
//                   updateField(
//                     "city"
//                   )
//                 }
//                 error={
//                   errors.city
//                 }
//                 autoComplete="address-level2"
//               />
//             </div>

//             <div className="mt-4">
//               <label className="block">
//                 <span className="mb-2 block text-[13px] font-semibold text-[#1f2937]">
//                   State / County{" "}
//                   <span className="text-red-500">
//                     *
//                   </span>
//                 </span>

//                 <select
//                   value={
//                     form.state ||
//                     "Telangana"
//                   }
//                   onChange={
//                     updateField(
//                       "state"
//                     )
//                   }
//                   className={`h-11 w-full border bg-white px-3 text-sm text-[#243346] outline-none transition focus:border-[#D9A537] ${
//                     errors.state
//                       ? "border-red-500"
//                       : "border-[#d8dce1]"
//                   }`}
//                 >
//                   {INDIA_STATES.map(
//                     (state) => (
//                       <option
//                         key={state}
//                         value={state}
//                       >
//                         {state}
//                       </option>
//                     )
//                   )}
//                 </select>

//                 <FieldError
//                   message={
//                     errors.state
//                   }
//                 />
//               </label>
//             </div>

//             <div className="mt-4">
//               <TextField
//                 label="Postcode / ZIP"
//                 required
//                 value={
//                   form.pincode || ""
//                 }
//                 onChange={
//                   updateField(
//                     "pincode"
//                   )
//                 }
//                 error={
//                   errors.pincode
//                 }
//                 autoComplete="postal-code"
//               />
//             </div>

//             <div className="mt-4">
//               <TextField
//                 label="Phone"
//                 required
//                 type="tel"
//                 value={
//                   form.phone || ""
//                 }
//                 onChange={
//                   updateField(
//                     "phone"
//                   )
//                 }
//                 error={
//                   errors.phone
//                 }
//                 autoComplete="tel"
//               />
//             </div>

//             <div className="mt-4">
//               <TextField
//                 label="Email address"
//                 required
//                 type="email"
//                 value={
//                   form.email || ""
//                 }
//                 onChange={(
//                   event
//                 ) => {
//                   const value =
//                     event.target.value
//                       .toLowerCase();

//                   setForm(
//                     (previous) => ({
//                       ...previous,
//                       email:
//                         value,
//                     })
//                   );

//                   setErrors(
//                     (previous) => ({
//                       ...previous,
//                       email: "",
//                     })
//                   );
//                 }}
//                 error={
//                   errors.email
//                 }
//                 autoComplete="email"
//               />
//             </div>

//             <div className="mt-4">
//   <TextField
//     label="Student Admission No."
//     required
//     value={
//       form.admissionNo || ""
//     }
//     onChange={
//       updateField(
//         "admissionNo"
//       )
//     }
//     error={
//       errors.admissionNo
//     }
//   />
// </div>

//             {!isAuthenticated && (
//               <div className="mt-4">
//                 <label className="block">
//                   <span className="mb-2 block text-[13px] font-semibold text-[#1f2937]">
//                     Create account password{" "}
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
//                     autoComplete="new-password"
//                     className="h-11 w-full border border-[#d8dce1] bg-white px-3 text-sm text-[#243346] outline-none transition focus:border-[#D9A537]"
//                   />

//                   {showAccountPassword &&
//                     accountPassword &&
//                     accountPassword
//                       .length < 8 && (
//                     <p className="mt-2 text-xs font-semibold text-red-600">
//                       Password must
//                       contain at least
//                       8 characters.
//                     </p>
//                   )}
//                 </label>
//               </div>
//             )}

//             <h2 className="mt-10 border-b border-slate-300 pb-4 text-[18px] font-black text-[#111827]">
//               Additional information
//             </h2>

//             <label className="mt-5 block text-[13px] font-semibold text-[#1f2937]">
//               Order notes{" "}
//               <span className="font-normal text-slate-500">
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
//               className="mt-2 w-full resize-y border border-[#d8dce1] bg-white px-3 py-3 text-sm text-[#243346] outline-none transition focus:border-[#D9A537]"
//               placeholder="Notes about your order, e.g. special notes for delivery."
//             />
//           </section>

//           <aside className="h-fit border border-[#d7dce2] bg-[#f8f9fa] p-6 lg:sticky lg:top-24">
//             <h2 className="text-[18px] font-black text-[#111827]">
//               Your order
//             </h2>

//             <div className="mt-7 flex justify-between border-b border-slate-300 pb-4 text-sm font-black text-[#243346]">
//               <span>Product</span>
//               <span>Subtotal</span>
//             </div>

//             <div className="divide-y divide-slate-200">
//               {cart.map(
//                 (item) => (
//                   <div
//                     key={
//                       item.key
//                     }
//                     className="flex justify-between gap-5 py-4 text-sm text-[#243346]"
//                   >
//                     <span className="max-w-[220px]">
//                       {item.name}

//                       {item.size && (
//                         <>
//                           {" - "}
//                           {item.size}
//                         </>
//                       )}

//                       {" × "}
//                       {item.quantity}
//                     </span>

//                     <span className="whitespace-nowrap">
//                       ₹
//                       {(
//                         Number(
//                           item.price
//                         ) *
//                         Number(
//                           item.quantity
//                         )
//                       ).toFixed(2)}
//                     </span>
//                   </div>
//                 )
//               )}
//             </div>

//             <div className="flex justify-between border-t border-slate-300 py-5 text-sm text-[#243346]">
//               <span>Subtotal</span>

//               <span>
//                 ₹
//                 {Number(
//                   subtotal
//                 ).toFixed(2)}
//               </span>
//             </div>

//             <div className="flex justify-between border-t border-slate-300 py-5 text-sm text-[#243346]">
//               <span>Shipping</span>

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

//             <div className="border-t border-slate-300 py-5">
//               <div className="flex items-start justify-between gap-4">
//                 <span className="pt-1 text-sm text-[#243346]">
//                   Total
//                 </span>

//                 <div className="text-right">
//                   <div className="text-[16px] font-medium text-[#243346]">
//                     ₹
//                     {Number(
//                       total
//                     ).toFixed(2)}
//                   </div>

//                   <div className="mt-1 text-[10px] leading-5 text-[#243346]">
//                     (includes{" "}
//                     ₹
//                     {cgst.toFixed(
//                       2
//                     )}{" "}
//                     9% CGST,
//                     <br />
//                     ₹
//                     {sgst.toFixed(
//                       2
//                     )}{" "}
//                     9% SGST)
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="border-t border-slate-300 pt-6">
//               <p className="text-sm font-medium text-[#243346]">
//                 Paytm Payment
//                 Gateway
//               </p>

//               <div className="mt-2 inline-flex items-center text-[24px] font-black">
//                 <span className="text-[#162d70]">
//                   pay
//                 </span>

//                 <span className="text-[#00baf2]">
//                   tm
//                 </span>

//                 <span className="ml-1 rounded bg-[#00baf2] px-1.5 py-0.5 text-[10px] text-white">
//                   PG
//                 </span>
//               </div>

//               <div className="relative mt-4 bg-[#eeeeee] px-4 py-4 text-xs leading-5 text-[#5b6168]">
//                 <span className="absolute -top-2 left-6 h-4 w-4 rotate-45 bg-[#eeeeee]" />

//                 <p className="relative">
//                   The best payment
//                   gateway provider in
//                   India for e-payment
//                   through credit card,
//                   debit card &
//                   netbanking.
//                 </p>
//               </div>

//               <p className="mt-7 text-sm leading-6 text-[#243346]">
//                 Your personal data will
//                 be used to process your
//                 order, support your
//                 experience throughout
//                 this website, and for
//                 other purposes described
//                 in our privacy policy.
//               </p>

//               <button
//                 type="submit"
//                 disabled={
//                   checkoutLoading
//                 }
//                 className="mt-6 w-full bg-[#D9A537] px-5 py-4 text-xs font-black uppercase text-[#243346] transition hover:bg-[#c6972f] disabled:cursor-not-allowed disabled:opacity-60"
//               >
//                 {checkoutLoading
//                   ? "Placing order..."
//                   : "Place order"}
//               </button>
//             </div>
//           </aside>
//         </form>
//       </div>
//     </main>
//   );
// }













