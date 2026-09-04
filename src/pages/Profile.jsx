import {
  Download,
  Gauge,
  Home,
  LogOut,
  ShoppingBag,
  User,
  Eye,
  CreditCard,
  XCircle,
  Pencil,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "../context/AuthContext";

import AddressForm from "../components/AddressForm";
import OrderDetailPanel from "../components/OrderDetailPanel";

import axiosClient from "../api/axiosClient";

/* =========================================================
   EMPTY ADDRESS

   IMPORTANT:
   Same field names used by Checkout.jsx / AddressForm.
========================================================= */

const EMPTY_ADDRESS = {
  firstName: "",
  lastName: "",

  studentClass: "Nursery",

  country: "India",

  address: "",
  address2: "",

  city: "",
  state: "Telangana",
  pincode: "",

  phone: "",
  email: "",

  admissionNo: "",
  parentName: "",

  isDefault: true,
};

/* =========================================================
   NAVIGATION
========================================================= */

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Gauge,
  },

  {
    id: "orders",
    label: "Orders",
    icon: ShoppingBag,
  },

  {
    id: "downloads",
    label: "Downloads",
    icon: Download,
  },

  {
    id: "addresses",
    label: "Addresses",
    icon: Home,
  },

  {
    id: "account",
    label: "Account details",
    icon: User,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function getOrderId(order) {
  return (
    order?.id ||
    order?.ID ||
    order?.orderId ||
    order?.order_id ||
    ""
  );
}

function getOrderTotal(order) {
  return Number(
    order?.total ||
      order?.total_amount ||
      order?.order_total ||
      0
  );
}

function normalizeOrderStatus(
  status
) {
  const value = String(
    status || ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /^wc-/,
      ""
    );

  if (
    value === "pending" ||
    value ===
      "pending-payment"
  ) {
    return "Pending payment";
  }

  if (
    value === "processing"
  ) {
    return "Processing";
  }

  if (
    value === "completed"
  ) {
    return "Completed";
  }

  if (
    value === "cancelled" ||
    value === "canceled"
  ) {
    return "Cancelled";
  }

  if (
    value === "failed"
  ) {
    return "Failed";
  }

  if (
    value === "refunded"
  ) {
    return "Refunded";
  }

  if (
    value === "on-hold"
  ) {
    return "On hold";
  }

  if (!value) {
    return "—";
  }

  return value
    .replace(/-/g, " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatOrderDate(
  value
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function getOrderItemCount(
  order
) {
  if (
    Number.isFinite(
      Number(
        order?.itemCount
      )
    )
  ) {
    return Number(
      order.itemCount
    );
  }

  if (
    Number.isFinite(
      Number(
        order?.item_count
      )
    )
  ) {
    return Number(
      order.item_count
    );
  }

  if (
    Array.isArray(
      order?.items
    )
  ) {
    return order.items.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item?.quantity ||
            1
        ),
      0
    );
  }

  return 0;
}

export default function Profile() {
  /* =======================================================
     AUTH
  ======================================================= */

  const {
    user,
    logout,
    changePassword,
  } = useAuth();

  const navigate =
    useNavigate();

  const [
    searchParams,
    setSearchParams,
  ] =
    useSearchParams();

  const requestedTab =
    searchParams.get(
      "tab"
    ) ||
    "dashboard";

  const activeTab =
    navItems.some(
      (item) =>
        item.id ===
        requestedTab
    )
      ? requestedTab
      : "dashboard";

  /* =======================================================
     ACCOUNT
  ======================================================= */

  const [
    account,
    setAccount,
  ] =
    useState({
      firstName:
        user?.firstName ||
        "",

      lastName:
        user?.lastName ||
        "",

      displayName:
        user?.displayName ||
        "",

      email:
        user?.email ||
        "",

      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  const [
    accountMessage,
    setAccountMessage,
  ] =
    useState("");

  const [
    accountError,
    setAccountError,
  ] =
    useState("");

  const [
    savingAccount,
    setSavingAccount,
  ] =
    useState(false);

  /* =======================================================
     ADDRESS
  ======================================================= */

  const [
    address,
    setAddress,
  ] =
    useState({
      ...EMPTY_ADDRESS,
    });

  const [
    editingAddress,
    setEditingAddress,
  ] =
    useState(false);

  const [
    savingAddress,
    setSavingAddress,
  ] =
    useState(false);

  const [
    addressMessage,
    setAddressMessage,
  ] =
    useState("");

  const [
    addressError,
    setAddressError,
  ] =
    useState("");

  /* =======================================================
     ORDERS
  ======================================================= */

  const [
    orders,
    setOrders,
  ] =
    useState([]);

  const [
    ordersLoading,
    setOrdersLoading,
  ] =
    useState(false);

  const [
    ordersError,
    setOrdersError,
  ] =
    useState("");

  const [
    cancellingOrderId,
    setCancellingOrderId,
  ] =
    useState(null);

  /* =======================================================
     PROFILE LOADING
  ======================================================= */

  const [
    profileLoading,
    setProfileLoading,
  ] =
    useState(true);

  /* =======================================================
     CURRENT CUSTOMER NAME
  ======================================================= */

  const userName =
    account.displayName ||
    `${account.firstName} ${account.lastName}`.trim() ||
    user?.displayName ||
    user?.firstName ||
    "Customer";

  /* =======================================================
     CHANGE TAB
  ======================================================= */

  const changeTab =
    (tab) => {
      setSearchParams(
        tab ===
          "dashboard"
          ? {}
          : {
              tab,
            }
      );
    };

  /* =======================================================
     LOAD PROFILE + ADDRESS FROM DATABASE

     GET /api/auth/customer/me

     NO localStorage
     NO sessionStorage
  ======================================================= */

  const loadProfile =
    useCallback(
      async () => {
        try {
          setProfileLoading(
            true
          );

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

          /* ===============================================
             ACCOUNT
          =============================================== */

          setAccount(
            (previous) => ({
              ...previous,

              firstName:
                customer
                  .firstName ||
                "",

              lastName:
                customer
                  .lastName ||
                "",

              displayName:
                customer
                  .displayName ||
                `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim(),

              email:
                customer
                  .email ||
                "",
            })
          );

          /* ===============================================
             BILLING ADDRESS
          =============================================== */

          setAddress({
            ...EMPTY_ADDRESS,

            firstName:
              billing
                .firstName ||
              customer
                .firstName ||
              "",

            lastName:
              billing
                .lastName ||
              customer
                .lastName ||
              "",

            email:
              billing.email ||
              customer.email ||
              "",

            phone:
              billing.phone ||
              customer.phone ||
              "",

            /*
             * Backend:
             * billingAddress.address1
             *
             * AddressForm:
             * address
             */
            address:
              billing.address1 ||
              "",

            address2:
              billing.address2 ||
              "",

            city:
              billing.city ||
              "",

            state:
              billing.state ||
              "Telangana",

            pincode:
              billing.postcode ||
              "",

            country:
              billing.country ===
              "IN"
                ? "India"
                : billing.country ||
                  "India",

            studentClass:
              billing
                .studentClass ||
              "Nursery",

            admissionNo:
              billing
                .admissionNo ||
              "",

            parentName:
              billing
                .parentName ||
              "",

            isDefault: true,
          });
        } catch (error) {
          console.error(
            "Profile load error:",
            error
          );

          /*
           * AuthContext generally handles
           * unauthenticated state.
           */
        } finally {
          setProfileLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /* =======================================================
     LOAD CURRENT CUSTOMER'S ORDERS FROM DATABASE

     GET /api/customer/orders

     Backend MUST use req.user.id.
  ======================================================= */

  const loadOrders =
    useCallback(
      async () => {
        setOrdersLoading(
          true
        );

        setOrdersError(
          ""
        );

        try {
          const {
            data,
          } =
            await axiosClient.get(
              "/customer/orders"
            );

          const result =
            data?.orders ||
            data?.items ||
            data?.data?.orders ||
            data?.data?.items ||
            data?.data ||
            data ||
            [];

          setOrders(
            Array.isArray(
              result
            )
              ? result
              : []
          );
        } catch (error) {
          console.error(
            "Orders load error:",
            error
          );

          setOrders([]);

          setOrdersError(
            error?.response
              ?.data
              ?.message ||
              "Unable to load your orders."
          );
        } finally {
          setOrdersLoading(
            false
          );
        }
      },
      []
    );

  /*
   * Only load orders when user
   * opens Orders tab.
   */
  useEffect(() => {
    if (
      activeTab ===
      "orders"
    ) {
      loadOrders();
    }
  }, [
    activeTab,
    loadOrders,
  ]);

  /* =======================================================
     SAVE ADDRESS INTO DATABASE

     PUT /api/auth/customer/me
  ======================================================= */

  const saveAddress =
    async (event) => {
      event.preventDefault();

      if (
        savingAddress
      ) {
        return;
      }

      setAddressMessage(
        ""
      );

      setAddressError(
        ""
      );

      if (
        !String(
          address.firstName ||
            ""
        ).trim()
      ) {
        setAddressError(
          "First name is required."
        );

        return;
      }

      if (
        !String(
          address.lastName ||
            ""
        ).trim()
      ) {
        setAddressError(
          "Last name is required."
        );

        return;
      }

      if (
        !String(
          address.email ||
            ""
        ).trim()
      ) {
        setAddressError(
          "Email address is required."
        );

        return;
      }

      setSavingAddress(
        true
      );

      try {
        const {
          data,
        } =
          await axiosClient.put(
            "/auth/customer/me",
            {
              firstName:
                address.firstName,

              lastName:
                address.lastName,

              displayName:
                account.displayName ||
                `${address.firstName} ${address.lastName}`.trim(),

              email:
                address.email,

              billingAddress: {
                firstName:
                  address.firstName,

                lastName:
                  address.lastName,

                email:
                  address.email,

                phone:
                  address.phone,

                address1:
                  address.address,

                address2:
                  address.address2 ||
                  "",

                city:
                  address.city,

                state:
                  address.state,

                postcode:
                  address.pincode,

                country:
                  "IN",

                studentClass:
                  address
                    .studentClass,

                admissionNo:
                  address
                    .admissionNo,

                parentName:
                  address
                    .parentName,
              },
            }
          );

        const customer =
          data?.user;

        if (customer) {
          const billing =
            customer
              ?.billingAddress ||
            {};

          setAccount(
            (previous) => ({
              ...previous,

              firstName:
                customer
                  .firstName ||
                previous.firstName,

              lastName:
                customer
                  .lastName ||
                previous.lastName,

              displayName:
                customer
                  .displayName ||
                previous
                  .displayName,

              email:
                customer
                  .email ||
                previous.email,
            })
          );

          setAddress(
            (previous) => ({
              ...previous,

              firstName:
                billing.firstName ||
                customer
                  .firstName ||
                previous
                  .firstName,

              lastName:
                billing.lastName ||
                customer
                  .lastName ||
                previous
                  .lastName,

              email:
                billing.email ||
                customer.email ||
                previous.email,

              phone:
                billing.phone ||
                previous.phone,

              address:
                billing.address1 ??
                previous.address,

              address2:
                billing.address2 ??
                previous.address2,

              city:
                billing.city ??
                previous.city,

              state:
                billing.state ||
                previous.state,

              pincode:
                billing.postcode ??
                previous.pincode,

              studentClass:
                billing
                  .studentClass ||
                previous
                  .studentClass,

              admissionNo:
                billing
                  .admissionNo ??
                previous
                  .admissionNo,

              parentName:
                billing
                  .parentName ??
                previous
                  .parentName,

              country:
                billing.country ===
                "IN"
                  ? "India"
                  : billing.country ||
                    previous.country,
            })
          );
        }

        setAddressMessage(
          "Address saved successfully."
        );

        setEditingAddress(
          false
        );
      } catch (error) {
        setAddressError(
          error?.response
            ?.data
            ?.message ||
            "Unable to save address."
        );
      } finally {
        setSavingAddress(
          false
        );
      }
    };

  /* =======================================================
     SAVE ACCOUNT DETAILS + OPTIONAL PASSWORD CHANGE

     First/last/display/email:
       PUT /api/auth/customer/me

     Password:
       PUT /api/auth/customer/change-password
  ======================================================= */

  const saveAccount =
    async (event) => {
      event.preventDefault();

      if (
        savingAccount
      ) {
        return;
      }

      setAccountMessage(
        ""
      );

      setAccountError(
        ""
      );

      /* ===============================================
         NORMAL ACCOUNT VALIDATION
      =============================================== */

      if (
        !account.firstName
          .trim()
      ) {
        setAccountError(
          "First name is required."
        );

        return;
      }

      if (
        !account.lastName
          .trim()
      ) {
        setAccountError(
          "Last name is required."
        );

        return;
      }

      if (
        !account.displayName
          .trim()
      ) {
        setAccountError(
          "Display name is required."
        );

        return;
      }

      if (
        !account.email
          .trim()
      ) {
        setAccountError(
          "Email address is required."
        );

        return;
      }

      const wantsPasswordChange =
        !!(
          account
            .currentPassword ||
          account.newPassword ||
          account
            .confirmPassword
        );

      /* ===============================================
         PASSWORD VALIDATION ONLY WHEN USER ENTERED IT
      =============================================== */

      if (
        wantsPasswordChange
      ) {
        if (
          !account
            .currentPassword
        ) {
          setAccountError(
            "Please enter your current password."
          );

          return;
        }

        if (
          !account
            .newPassword
        ) {
          setAccountError(
            "Please enter your new password."
          );

          return;
        }

        if (
          account
            .newPassword
            .length < 8
        ) {
          setAccountError(
            "New password must be at least 8 characters."
          );

          return;
        }

        if (
          !account
            .confirmPassword
        ) {
          setAccountError(
            "Please confirm your new password."
          );

          return;
        }

        if (
          account
            .newPassword !==
          account
            .confirmPassword
        ) {
          setAccountError(
            "New password and confirm password do not match."
          );

          return;
        }
      }

      setSavingAccount(
        true
      );

      try {
        /* =============================================
           1. SAVE ACCOUNT DETAILS TO DATABASE

           Preserve current address.
        ============================================= */

        const {
          data,
        } =
          await axiosClient.put(
            "/auth/customer/me",
            {
              firstName:
                account.firstName,

              lastName:
                account.lastName,

              displayName:
                account
                  .displayName,

              email:
                account.email,

              billingAddress: {
                firstName:
                  address.firstName ||
                  account.firstName,

                lastName:
                  address.lastName ||
                  account.lastName,

                email:
                  address.email ||
                  account.email,

                phone:
                  address.phone,

                address1:
                  address.address,

                address2:
                  address.address2 ||
                  "",

                city:
                  address.city,

                state:
                  address.state,

                postcode:
                  address.pincode,

                country:
                  "IN",

                studentClass:
                  address
                    .studentClass,

                admissionNo:
                  address
                    .admissionNo,

                parentName:
                  address
                    .parentName,
              },
            }
          );

        const updatedUser =
          data?.user;

        if (
          updatedUser
        ) {
          setAccount(
            (previous) => ({
              ...previous,

              firstName:
                updatedUser
                  .firstName ||
                previous.firstName,

              lastName:
                updatedUser
                  .lastName ||
                previous.lastName,

              displayName:
                updatedUser
                  .displayName ||
                previous
                  .displayName,

              email:
                updatedUser
                  .email ||
                previous.email,
            })
          );
        }

        /* =============================================
           2. PASSWORD CHANGE ONLY IF REQUESTED
        ============================================= */

        if (
          wantsPasswordChange
        ) {
          const result =
            await changePassword(
              {
                currentPassword:
                  account
                    .currentPassword,

                newPassword:
                  account
                    .newPassword,

                confirmPassword:
                  account
                    .confirmPassword,
              }
            );

          if (
            !result?.ok
          ) {
            setAccountError(
              result?.message ||
                "Unable to change password."
            );

            return;
          }
        }

        /* =============================================
           SUCCESS
        ============================================= */

        setAccountMessage(
          wantsPasswordChange
            ? "Account details and password saved successfully."
            : "Account details saved successfully."
        );

        setAccount(
          (previous) => ({
            ...previous,

            currentPassword:
              "",

            newPassword:
              "",

            confirmPassword:
              "",
          })
        );
      } catch (error) {
        setAccountError(
          error?.response
            ?.data
            ?.message ||
            "Unable to save account details."
        );
      } finally {
        setSavingAccount(
          false
        );
      }
    };

  /* =======================================================
     ORDER ACTION: PAY

     Pending payment order:
     go to Pay For Order page.
  ======================================================= */

  const payOrder =
    (order) => {
      const orderId =
        getOrderId(
          order
        );

      if (!orderId) {
        return;
      }

      navigate(
        `/pay-for-order/${orderId}?source=orders`
      );
    };

  /* =======================================================
     ORDER ACTION: VIEW

     This route needs OrderDetails page.
  ======================================================= */

  const viewOrder =
    (order) => {
      const orderId =
        getOrderId(
          order
        );

      if (!orderId) {
        return;
      }

      setSearchParams({
        tab: "orders",
        orderId: String(orderId),
      });
    };

  const closeOrderView =
    () => {
      setSearchParams({ tab: "orders" });
    };

  /* =======================================================
     ORDER ACTION: CANCEL

     POST /api/customer/orders/:id/cancel
  ======================================================= */

  const cancelOrder =
    async (order) => {
      const orderId =
        getOrderId(
          order
        );

      if (!orderId) {
        return;
      }

      const confirmed =
        window.confirm(
          `Are you sure you want to cancel order #${orderId}?`
        );

      if (!confirmed) {
        return;
      }

      setCancellingOrderId(
        String(orderId)
      );

      setOrdersError(
        ""
      );

      try {
        await axiosClient.post(
          `/customer/orders/${orderId}/cancel`
        );

        /*
         * Fetch database again.
         */
        await loadOrders();
      } catch (error) {
        setOrdersError(
          error?.response
            ?.data
            ?.message ||
            "Unable to cancel this order."
        );
      } finally {
        setCancellingOrderId(
          null
        );
      }
    };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const doLogout =
    async () => {
      try {
        await logout();
      } finally {
        navigate(
          "/",
          {
            replace: true,
          }
        );
      }
    };

  /* =======================================================
     DASHBOARD
  ======================================================= */

  const renderDashboard =
    () => (
      <div className="text-[15px] leading-7 text-slate-600">

        <p>
          Hello{" "}

          <b className="text-[#243346]">
            {userName}
          </b>

          {" "}
          (not{" "}

          <b className="text-[#243346]">
            {userName}
          </b>

          ?{" "}

          <button
            type="button"
            onClick={
              doLogout
            }
            className="font-semibold text-[#D9A537]"
          >
            Log out
          </button>

          )
        </p>

        <p className="mt-5">
          From your account
          dashboard you can
          view your{" "}

          <button
            type="button"
            onClick={() =>
              changeTab(
                "orders"
              )
            }
            className="text-[#D9A537]"
          >
            recent orders
          </button>

          , manage your{" "}

          <button
            type="button"
            onClick={() =>
              changeTab(
                "addresses"
              )
            }
            className="text-[#D9A537]"
          >
            shipping and
            billing addresses
          </button>

          , and edit your{" "}

          <button
            type="button"
            onClick={() =>
              changeTab(
                "account"
              )
            }
            className="text-[#D9A537]"
          >
            password and
            account details
          </button>

          .
        </p>

      </div>
    );

  /* =======================================================
     ORDERS

     Screenshot behaviour:
     Order | Date | Status | Total | Actions

     Pending:
       Pay
       View
       Cancel
  ======================================================= */

  const renderOrders =
    () => {
      const viewingOrderId =
        searchParams.get(
          "orderId"
        );

      if (
        viewingOrderId
      ) {
        return (
          <OrderDetailPanel
            orderId={
              viewingOrderId
            }
            onBack={
              closeOrderView
            }
            onPay={
              payOrder
            }
          />
        );
      }

      if (
        ordersLoading
      ) {
        return (
          <div className="
            bg-slate-50
            px-6
            py-5
            text-sm
            font-semibold
            text-slate-600
          ">
            Loading orders...
          </div>
        );
      }

      if (
        ordersError &&
        !orders.length
      ) {
        return (
          <div className="
            bg-red-50
            px-6
            py-4
            text-sm
            font-semibold
            text-red-700
          ">
            {ordersError}
          </div>
        );
      }

      if (
        !orders.length
      ) {
        return (
          <div className="
            flex
            flex-col
            gap-3
            bg-[#3da0d1]
            px-6
            py-4
            text-sm
            font-semibold
            text-white
            sm:flex-row
            sm:items-center
            sm:justify-between
          ">

            <span>
              No order has
              been made yet.
            </span>

            <Link
              to="/"
              className="font-black"
            >
              Browse products »
            </Link>

          </div>
        );
      }

      return (
        <div>

          {ordersError && (
            <div className="
              mb-4
              bg-red-50
              px-4
              py-3
              text-sm
              font-semibold
              text-red-700
            ">
              {ordersError}
            </div>
          )}

         <div className="overflow-x-auto">

  <table className="
    min-w-full
    border-collapse
    text-left
    text-sm
  ">

    <thead>
      <tr className="
        bg-[#f4f4f4]
        text-[#243346]
      ">

        <th className="px-3 py-3">
          Order
        </th>

        <th className="px-3 py-3">
          Date
        </th>

        <th className="px-3 py-3">
          Status
        </th>

        <th className="px-3 py-3">
          Total
        </th>

        <th className="
          w-[250px]
          min-w-[250px]
          px-3
          py-3
        ">
          Actions
        </th>

      </tr>
    </thead>

    <tbody>

      {orders.map(
        (
          order,
          index
        ) => {
          const orderId =
            getOrderId(order) ||
            index + 1;

          const status =
            normalizeOrderStatus(
              order?.status
            );

          const pending =
            status ===
            "Pending payment";

          const itemCount =
            getOrderItemCount(
              order
            );

          const isCancelling =
            cancellingOrderId ===
            String(orderId);

          return (
            <tr
              key={orderId}
              className="
                border-b
                border-slate-100
                even:bg-[#f7f7f7]
              "
            >

              {/* ORDER */}
              <td className="
                px-3
                py-2.5
              ">
                <button
                  type="button"
                  onClick={() =>
                    viewOrder(order)
                  }
                  className="
                    font-bold
                    text-[#D9A537]
                    hover:underline
                  "
                >
                  #{orderId}
                </button>
              </td>

              {/* DATE */}
              <td className="
                whitespace-nowrap
                px-3
                py-2.5
                text-slate-600
              ">
                {formatOrderDate(
                  order?.date ||
                  order?.createdAt ||
                  order?.created_at ||
                  order?.date_created
                )}
              </td>

              {/* STATUS */}
              <td className="
                whitespace-nowrap
                px-3
                py-2.5
                text-slate-600
              ">
                {status}
              </td>

              {/* TOTAL */}
              <td className="
                whitespace-nowrap
                px-3
                py-2.5
                text-slate-600
              ">
                ₹
                {getOrderTotal(
                  order
                ).toFixed(2)}

                {itemCount > 0 && (
                  <>
                    {" "}
                    for{" "}
                    {itemCount}{" "}
                    {itemCount === 1
                      ? "item"
                      : "items"}
                  </>
                )}
              </td>

              {/* ACTIONS */}
              <td className="
                w-[250px]
                min-w-[250px]
                whitespace-nowrap
                px-3
                py-2.5
                align-middle
              ">

                <div className="
                  flex
                  flex-nowrap
                  items-center
                  gap-1.5
                ">

                  {/* PAY */}
                  {pending && (
                    <button
                      type="button"
                      onClick={() =>
                        payOrder(order)
                      }
                      className="
                        btn-gold
                        inline-flex
                        shrink-0
                        items-center
                        justify-center
                        gap-1
                        rounded-sm
                        px-2
                        py-1
                        text-[11px]
                        font-bold
                      "
                    >
                      <CreditCard
                        size={12}
                      />

                      Pay
                    </button>
                  )}

                  {/* VIEW */}
                  <button
                    type="button"
                    onClick={() =>
                      viewOrder(order)
                    }
                    className="
                      btn-gold
                      inline-flex
                      shrink-0
                      items-center
                      justify-center
                      gap-1
                      rounded-sm
                      px-2
                      py-1
                      text-[11px]
                      font-bold
                    "
                  >
                    View

                    <Eye
                      size={12}
                    />
                  </button>

                  {/* CANCEL */}
                  {pending && (
                    <button
                      type="button"
                      disabled={
                        isCancelling
                      }
                      onClick={() =>
                        cancelOrder(order)
                      }
                      className="
                        btn-gold
                        inline-flex
                        shrink-0
                        items-center
                        justify-center
                        gap-1
                        rounded-sm
                        px-2
                        py-1
                        text-[11px]
                        font-bold
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                    >
                      <XCircle
                        size={12}
                      />

                      {isCancelling
                        ? "Cancelling..."
                        : "Cancel"}
                    </button>
                  )}

                </div>

              </td>

            </tr>
          );
        }
      )}

    </tbody>

  </table>

</div>
        </div>
      );
    };

  /* =======================================================
     DOWNLOADS
  ======================================================= */

  const renderDownloads =
    () => (
      <div className="
        flex
        flex-col
        gap-3
        bg-[#3da0d1]
        px-6
        py-4
        text-sm
        font-semibold
        text-white
        sm:flex-row
        sm:items-center
        sm:justify-between
      ">

        <span>
          No downloads
          available yet.
        </span>

        <Link
          // to="/"
          to="/collections"
          className="font-black"
        >
          Browse products »
        </Link>

      </div>
    );

  /* =======================================================
     ADDRESS

     DEFAULT:
       show saved address

     EDIT:
       AddressForm opens
  ======================================================= */

  const renderAddress =
    () => {
      if (
        editingAddress
      ) {
        return (
          <form
            onSubmit={
              saveAddress
            }
            className="max-w-4xl"
          >

            <div className="
              mb-6
              flex
              items-center
              justify-between
              gap-4
            ">

              <div>
                <h2 className="
                  text-2xl
                  font-black
                  text-[#004c40]
                ">
                  Edit Billing
                  address
                </h2>

                <p className="
                  mt-2
                  text-sm
                  text-slate-500
                ">
                  This address
                  will be used
                  on the checkout
                  page by default.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingAddress(
                    false
                  );

                  setAddressMessage(
                    ""
                  );

                  setAddressError(
                    ""
                  );

                  loadProfile();
                }}
                className="
                  border
                  border-slate-200
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-slate-600
                  hover:bg-slate-50
                "
              >
                Cancel
              </button>

            </div>

            <AddressForm
              title="Billing address"
              value={
                address
              }
              onChange={
                setAddress
              }
            />

            {addressError && (
              <p className="
                mt-4
                bg-red-50
                px-3
                py-3
                text-sm
                font-semibold
                text-red-700
              ">
                {addressError}
              </p>
            )}

            {addressMessage && (
              <p className="
                mt-4
                bg-green-50
                px-3
                py-3
                text-sm
                font-semibold
                text-green-700
              ">
                {addressMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={
                savingAddress
              }
              className="
                btn-gold
                mt-5
                rounded-sm
                px-6
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {savingAddress
                ? "Saving..."
                : "Save address"}
            </button>

          </form>
        );
      }

      const hasAddress =
        !!(
          address.address ||
          address.city ||
          address.pincode ||
          address.phone
        );

      return (
        <div className="max-w-4xl">

          <p className="
            text-sm
            text-slate-600
          ">
            The following
            addresses will be
            used on the checkout
            page by default.
          </p>

          <div className="
            mt-5
            flex
            items-start
            justify-between
            gap-5
          ">

            <div>

              <h2 className="
                text-2xl
                font-black
                text-[#004c40]
              ">
                Billing address
              </h2>

              <button
                type="button"
                onClick={() => {
                  setAddressMessage(
                    ""
                  );

                  setAddressError(
                    ""
                  );

                  setEditingAddress(
                    true
                  );
                }}
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  font-medium
                  text-[#D9A537]
                  hover:underline
                "
              >
                <Pencil
                  size={14}
                />

                Edit Billing
                address
              </button>

            </div>

          </div>

          {hasAddress ? (
            <address className="
              mt-3
              space-y-1
              text-sm
              not-italic
              leading-6
              text-slate-600
            ">

              <div>
                {`${address.firstName} ${address.lastName}`.trim()}
              </div>

              {address
                .studentClass && (
                <div>
                  {
                    address
                      .studentClass
                  }
                </div>
              )}

              {address
                .address && (
                <div>
                  {
                    address
                      .address
                  }
                </div>
              )}

              {address
                .address2 && (
                <div>
                  {
                    address
                      .address2
                  }
                </div>
              )}

              {(address.city ||
                address.pincode) && (
                <div>
                  {[
                    address.city,
                    address.pincode,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      " "
                    )}
                </div>
              )}

              {address
                .state && (
                <div>
                  {
                    address
                      .state
                  }
                </div>
              )}

              {address
                .country && (
                <div>
                  {
                    address
                      .country
                  }
                </div>
              )}

              {address.phone && (
                <div className="pt-3">
                  {
                    address.phone
                  }
                </div>
              )}

              {address.email && (
                <div>
                  {
                    address.email
                  }
                </div>
              )}

            </address>
          ) : (
            <p className="
              mt-5
              text-sm
              text-slate-500
            ">
              You have not yet
              added a billing
              address.
            </p>
          )}

          {addressMessage && (
            <p className="
              mt-4
              bg-green-50
              px-3
              py-3
              text-sm
              font-semibold
              text-green-700
            ">
              {addressMessage}
            </p>
          )}

        </div>
      );
    };

  /* =======================================================
     ACCOUNT DETAILS
  ======================================================= */

  const renderAccount =
    () => (
      <form
        onSubmit={
          saveAccount
        }
        className="max-w-4xl"
      >

        {/* ===============================================
            ACCOUNT DETAILS
        =============================================== */}

        <div className="
          grid
          gap-5
          sm:grid-cols-2
        ">

          {/* FIRST NAME */}

          <label>

            <span className="
              mb-2
              block
              text-sm
              font-medium
              text-[#243346]
            ">
              First name{" "}

              <span className="text-red-500">
                *
              </span>
            </span>

            <input
              required
              value={
                account
                  .firstName
              }
              onChange={(
                event
              ) =>
                setAccount(
                  (
                    previous
                  ) => ({
                    ...previous,

                    firstName:
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

          {/* LAST NAME */}

          <label>

            <span className="
              mb-2
              block
              text-sm
              font-medium
              text-[#243346]
            ">
              Last name{" "}

              <span className="text-red-500">
                *
              </span>
            </span>

            <input
              required
              value={
                account
                  .lastName
              }
              onChange={(
                event
              ) =>
                setAccount(
                  (
                    previous
                  ) => ({
                    ...previous,

                    lastName:
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

          {/* DISPLAY NAME */}

          <label className="sm:col-span-2">

            <span className="
              mb-2
              block
              text-sm
              font-medium
              text-[#243346]
            ">
              Display name{" "}

              <span className="text-red-500">
                *
              </span>
            </span>

            <input
              required
              value={
                account
                  .displayName
              }
              onChange={(
                event
              ) =>
                setAccount(
                  (
                    previous
                  ) => ({
                    ...previous,

                    displayName:
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

            <i className="
              mt-2
              block
              text-xs
              text-slate-500
            ">
              This will be how
              your name will be
              displayed in the
              account section
              and in reviews.
            </i>

          </label>

          {/* EMAIL */}

          <label className="sm:col-span-2">

            <span className="
              mb-2
              block
              text-sm
              font-medium
              text-[#243346]
            ">
              Email address{" "}

              <span className="text-red-500">
                *
              </span>
            </span>

            <input
              required
              type="email"
              value={
                account.email
              }
              onChange={(
                event
              ) =>
                setAccount(
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

        </div>

        {/* ===============================================
            PASSWORD CHANGE

            Existing functionality retained.
        =============================================== */}

        <fieldset className="
          mt-7
          border
          border-slate-200
          p-4
          sm:p-5
        ">

          <legend className="
            px-2
            text-sm
            font-black
            text-[#243346]
          ">
            Password change
          </legend>

          <div className="space-y-5">

            {/* CURRENT */}

            <label className="block">

              <span className="
                mb-2
                block
                text-sm
                text-[#243346]
              ">
                Current password
                (leave blank to
                leave unchanged)
              </span>

              <input
                type="password"
                autoComplete="current-password"
                value={
                  account
                    .currentPassword
                }
                onChange={(
                  event
                ) =>
                  setAccount(
                    (
                      previous
                    ) => ({
                      ...previous,

                      currentPassword:
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

            {/* NEW */}

            <label className="block">

              <span className="
                mb-2
                block
                text-sm
                text-[#243346]
              ">
                New password
                (leave blank to
                leave unchanged)
              </span>

              <input
                type="password"
                autoComplete="new-password"
                value={
                  account
                    .newPassword
                }
                onChange={(
                  event
                ) =>
                  setAccount(
                    (
                      previous
                    ) => ({
                      ...previous,

                      newPassword:
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

            {/* CONFIRM */}

            <label className="block">

              <span className="
                mb-2
                block
                text-sm
                text-[#243346]
              ">
                Confirm new
                password
              </span>

              <input
                type="password"
                autoComplete="new-password"
                value={
                  account
                    .confirmPassword
                }
                onChange={(
                  event
                ) =>
                  setAccount(
                    (
                      previous
                    ) => ({
                      ...previous,

                      confirmPassword:
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

        </fieldset>

        {/* ERROR */}

        {accountError && (
          <p className="
            mt-4
            bg-red-50
            px-3
            py-3
            text-sm
            font-semibold
            text-red-700
          ">
            {accountError}
          </p>
        )}

        {/* SUCCESS */}

        {accountMessage && (
          <p className="
            mt-4
            bg-green-50
            px-3
            py-3
            text-sm
            font-semibold
            text-green-700
          ">
            {accountMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={
            savingAccount
          }
          className="
            btn-gold
            mt-5
            rounded-sm
            px-6
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {savingAccount
            ? "Saving..."
            : "Save changes"}
        </button>

      </form>
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    profileLoading
  ) {
    return (
      <main className="bg-white">

        <div className="
          container-site
          py-20
          text-center
        ">

          <p className="
            text-sm
            font-semibold
            text-slate-500
          ">
            Loading account...
          </p>

        </div>

      </main>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="bg-white">

      <div className="
        container-site
        py-10
        sm:py-14
        lg:py-16
      ">

        {/* TITLE */}

        <h1 className="
          text-3xl
          font-black
          text-[#243346]
          sm:text-4xl
        ">
          My Account
        </h1>

        {/* BREADCRUMB */}

        <div className="
          mt-3
          flex
          items-center
          gap-1
          text-sm
        ">

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

          <span className="text-slate-300">
            ›
          </span>

          <span className="text-slate-400">
            My account
          </span>

          {activeTab !==
            "dashboard" && (
            <>
              <span className="text-slate-300">
                ›
              </span>

              <span className="
                font-medium
                text-[#243346]
              ">
                {
                  searchParams.get(
                    "orderId"
                  ) &&
                  activeTab ===
                    "orders"
                    ? `Order #${searchParams.get(
                        "orderId"
                      )}`
                    : navItems.find(
                        (item) =>
                          item.id ===
                          activeTab
                      )?.label
                }
              </span>
            </>
          )}

        </div>

        {/* =================================================
            LAYOUT
        ================================================= */}

        <div className="
          mt-12
          grid
          gap-8
          lg:grid-cols-[300px_1fr]
          lg:gap-14
        ">

          {/* ===============================================
              SIDEBAR

              Existing UI preserved.
          =============================================== */}

          <aside className="
            h-fit
            border-t
            border-slate-200
          ">

            {navItems.map(
              ({
                id,
                label,
                icon:
                  Icon,
              }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    changeTab(
                      id
                    )
                  }
                  className={`
                    flex
                    w-full
                    items-center
                    justify-between
                    border-b
                    border-slate-200
                    py-4
                    text-left
                    text-sm
                    font-medium
                    transition

                    ${
                      activeTab ===
                      id
                        ? "text-[#D9A537]"
                        : "text-[#243346] hover:text-[#D9A537]"
                    }
                  `}
                >

                  <span>
                    {label}
                  </span>

                  <Icon
                    size={16}
                    className={
                      activeTab ===
                      id
                        ? "text-[#D9A537]"
                        : "text-slate-300"
                    }
                  />

                </button>
              )
            )}

            {/* LOGOUT */}

            <button
              type="button"
              onClick={
                doLogout
              }
              className="
                flex
                w-full
                items-center
                justify-between
                border-b
                border-slate-200
                py-4
                text-left
                text-sm
                font-medium
                text-[#243346]
                transition
                hover:text-[#D9A537]
              "
            >

              <span>
                Log out
              </span>

              <LogOut
                size={16}
                className="text-slate-300"
              />

            </button>

          </aside>

          {/* ===============================================
              CONTENT
          =============================================== */}

          <section className="
            min-w-0
            pt-1
          ">

            {activeTab ===
              "dashboard" &&
              renderDashboard()}

            {activeTab ===
              "orders" &&
              renderOrders()}

            {activeTab ===
              "downloads" &&
              renderDownloads()}

            {activeTab ===
              "addresses" &&
              renderAddress()}

            {activeTab ===
              "account" &&
              renderAccount()}

          </section>

        </div>

      </div>

    </main>
  );
}


// import { Download, Gauge, Home, LogOut, MapPin, ShoppingBag, User } from "lucide-react";
// import { Link, useNavigate, useSearchParams } from "react-router-dom";
// import { useEffect, useMemo, useState } from "react";
// import { useAuth } from "../context/AuthContext";
// import AddressForm from "../components/AddressForm";
// import { EMPTY_ADDRESS, getDefaultAddress, saveSharedAddress } from "../utils/addressStorage";

// const navItems = [
//   { id: "dashboard", label: "Dashboard", icon: Gauge },
//   { id: "orders", label: "Orders", icon: ShoppingBag },
//   { id: "downloads", label: "Downloads", icon: Download },
//   { id: "addresses", label: "Edit Address", icon: Home },
//   { id: "account", label: "Account details", icon: User },
// ];

// function readSaved(key, fallback) {
//   try {
//     return JSON.parse(localStorage.getItem(key) || sessionStorage.getItem(key) || JSON.stringify(fallback));
//   } catch {
//     return fallback;
//   }
// }

// function saveBoth(key, value) {
//   const serialized = JSON.stringify(value);
//   localStorage.setItem(key, serialized);
//   sessionStorage.setItem(key, serialized);
// }

// export default function Profile() {
//   // const { user, logout } = useAuth();
//   const {
//   user,
//   logout,
//   changePassword,
// } = useAuth();
//   const navigate = useNavigate();
//   const [searchParams, setSearchParams] = useSearchParams();
//   const requestedTab = searchParams.get("tab") || "dashboard";
//   const activeTab = navItems.some((item) => item.id === requestedTab) ? requestedTab : "dashboard";

//   const savedProfile = useMemo(() => readSaved("uniforms_profile", null), []);
//   const userName = user?.name || user?.displayName || user?.username || "Customer";
//   const userEmail = user?.email || "";
//   const splitName = String(savedProfile?.name || userName).trim().split(/\s+/);

//   const [account, setAccount] = useState({
//     firstName: savedProfile?.firstName || splitName[0] || "",
//     lastName: savedProfile?.lastName || splitName.slice(1).join(" ") || "",
//     displayName: savedProfile?.displayName || savedProfile?.name || userName || "",
//     email: savedProfile?.email || userEmail,
//     currentPassword: "",
//     newPassword: "",
//     confirmPassword: "",
//   });
//   const [accountMessage, setAccountMessage] = useState("");
//   const [
//   accountError,
//   setAccountError,
// ] = useState("");

// const [
//   savingAccount,
//   setSavingAccount,
// ] = useState(false);

//   const [orders, setOrders] = useState([]);
//   const [address, setAddress] = useState(EMPTY_ADDRESS);
//   const [addressMessage, setAddressMessage] = useState("");

//   useEffect(() => {
//     const list = readSaved("uniforms_orders", []);
//     if (list.length) setOrders(list);
//     else {
//       const last = readSaved("uniforms_last_order", null);
//       setOrders(last ? [last] : []);
//     }

//     const current = getDefaultAddress();
//     if (current) {
//       const nameParts = String(current.name || "").trim().split(/\s+/);
//       setAddress({
//         ...EMPTY_ADDRESS,
//         ...current,
//         firstName: current.firstName || nameParts[0] || account.firstName || "",
//         lastName: current.lastName || nameParts.slice(1).join(" ") || account.lastName || "",
//         email: current.email || account.email || "",
//         country: current.country || "India",
//         state: current.state || "Telangana",
//         studentClass: current.studentClass || "Nursery",
//         isDefault: true,
//       });
//     } else {
//       setAddress({ ...EMPTY_ADDRESS, firstName: account.firstName, lastName: account.lastName, email: account.email });
//     }
//   }, []); // intentionally load once from existing local/session storage

//   const changeTab = (tab) => setSearchParams(tab === "dashboard" ? {} : { tab });

//   const saveAddress = (e) => {
//     e.preventDefault();
//     setAddressMessage("");
//     const next = saveSharedAddress(address);
//     setAddress(next);

//     const oldProfile = readSaved("uniforms_profile", {});
//     saveBoth("uniforms_profile", {
//       ...oldProfile,
//       name: `${next.firstName} ${next.lastName}`.trim(),
//       firstName: next.firstName,
//       lastName: next.lastName,
//       email: next.email,
//       phone: next.phone,
//     });

//     setAddressMessage("Address saved successfully.");
//   };

//   const saveAccount =
//   async (e) => {
//     e.preventDefault();

//     if (savingAccount) {
//       return;
//     }

//     setAccountMessage("");
//     setAccountError("");

//     const wantsPasswordChange =
//       account.currentPassword ||
//       account.newPassword ||
//       account.confirmPassword;

//     /*
//      * Password section completely blank:
//      * no password update.
//      */
//     if (
//       !wantsPasswordChange
//     ) {
//       setAccountMessage(
//         "No password changes were entered."
//       );

//       return;
//     }

//     /*
//      * If one password field filled,
//      * all three are required.
//      */
//     if (
//       !account.currentPassword
//     ) {
//       setAccountError(
//         "Please enter your current password."
//       );

//       return;
//     }

//     if (
//       !account.newPassword
//     ) {
//       setAccountError(
//         "Please enter your new password."
//       );

//       return;
//     }

//     if (
//       account.newPassword
//         .length < 8
//     ) {
//       setAccountError(
//         "New password must be at least 8 characters."
//       );

//       return;
//     }

//     if (
//       !account.confirmPassword
//     ) {
//       setAccountError(
//         "Please confirm your new password."
//       );

//       return;
//     }

//     if (
//       account.newPassword !==
//       account.confirmPassword
//     ) {
//       setAccountError(
//         "New password and confirm password do not match."
//       );

//       return;
//     }

//     setSavingAccount(true);

//     try {
//       const result =
//         await changePassword({
//           currentPassword:
//             account.currentPassword,

//           newPassword:
//             account.newPassword,

//           confirmPassword:
//             account.confirmPassword,
//         });

//       if (!result.ok) {
//         setAccountError(
//           result.message
//         );

//         return;
//       }

//       setAccountMessage(
//         result.message ||
//           "Password changed successfully."
//       );

//       /*
//        * Clear password fields
//        */
//       setAccount(
//         (prev) => ({
//           ...prev,

//           currentPassword: "",

//           newPassword: "",

//           confirmPassword: "",
//         })
//       );
//     } finally {
//       setSavingAccount(false);
//     }
//   };
//   // const saveAccount = (e) => {
//   //   e.preventDefault();
//   //   setAccountMessage("");
//   //   if (account.newPassword && account.newPassword !== account.confirmPassword) {
//   //     setAccountMessage("New password and confirm password do not match.");
//   //     return;
//   //   }
//   //   const profile = {
//   //     name: account.displayName || `${account.firstName} ${account.lastName}`.trim(),
//   //     firstName: account.firstName,
//   //     lastName: account.lastName,
//   //     displayName: account.displayName,
//   //     email: account.email,
//   //     phone: address.phone || savedProfile?.phone || "",
//   //     photo: savedProfile?.photo || "",
//   //   };
//   //   saveBoth("uniforms_profile", profile);
//   //   setAccountMessage(account.newPassword ? "Account details saved. Password fields are kept in the existing authentication flow." : "Account details saved successfully.");
//   //   setAccount((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
//   // };

//   const doLogout = () => {
//     logout();
//     navigate("/");
//   };

//   const renderDashboard = () => (
//     <div className="text-[15px] leading-7 text-slate-600">
//       <p>Hello <b className="text-[#243346]">{account.displayName || userName}</b> (not <b className="text-[#243346]">{account.displayName || userName}</b>? <button onClick={doLogout} className="font-semibold text-[#D9A537]">Log out</button>)</p>
//       <p className="mt-5">From your account dashboard you can view your <button onClick={() => changeTab("orders")} className="text-[#D9A537]">recent orders</button>, manage your <button onClick={() => changeTab("addresses")} className="text-[#D9A537]">shipping and billing addresses</button>, and edit your <button onClick={() => changeTab("account")} className="text-[#D9A537]">password and account details</button>.</p>
//     </div>
//   );

//   const renderOrders = () => {
//     if (!orders.length) {
//       return <div className="flex flex-col gap-3 bg-[#3da0d1] px-6 py-4 text-sm font-semibold text-white sm:flex-row sm:items-center sm:justify-between"><span>No order has been made yet.</span><Link to="/" className="font-black">Browse products »</Link></div>;
//     }
//     return (
//       <div className="overflow-x-auto">
//         <table className="min-w-full border-collapse text-left text-sm">
//           <thead><tr className="border-b border-slate-200 text-[#243346]"><th className="py-3 pr-4">Order</th><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Total</th></tr></thead>
//           <tbody>{orders.map((order, index) => <tr key={order.id || order.orderId || index} className="border-b border-slate-100"><td className="py-4 pr-4 font-bold text-[#D9A537]">#{order.id || order.orderId || index + 1}</td><td className="py-4 pr-4">{order.date || order.createdAt || "—"}</td><td className="py-4 pr-4">{order.status || "Placed"}</td><td className="py-4 pr-4 font-bold">₹{Number(order.total || 0).toFixed(2)}</td></tr>)}</tbody>
//         </table>
//       </div>
//     );
//   };

//   const renderDownloads = () => <div className="flex flex-col gap-3 bg-[#3da0d1] px-6 py-4 text-sm font-semibold text-white sm:flex-row sm:items-center sm:justify-between"><span>No downloads available yet.</span><Link to="/" className="font-black">Browse products »</Link></div>;

//   const renderAddress = () => (
//     <form onSubmit={saveAddress} className="max-w-4xl">
//       <AddressForm title="Billing address" value={address} onChange={setAddress} />
//       {addressMessage && <p className="mt-4 text-sm font-semibold text-green-700">{addressMessage}</p>}
//       <button type="submit" className="btn-gold mt-5 rounded-sm px-6">Save address</button>
//     </form>
//   );

//   const renderAccount = () => (
//     <form onSubmit={saveAccount} className="max-w-4xl">
//       <div className="grid gap-5 sm:grid-cols-2">
//         <label><span className="mb-2 block text-sm font-medium text-[#243346]">First name <span className="text-red-500">*</span></span><input required value={account.firstName} onChange={(e) => setAccount({ ...account, firstName: e.target.value })} className="input-field h-12 rounded-sm" /></label>
//         <label><span className="mb-2 block text-sm font-medium text-[#243346]">Last name <span className="text-red-500">*</span></span><input required value={account.lastName} onChange={(e) => setAccount({ ...account, lastName: e.target.value })} className="input-field h-12 rounded-sm" /></label>
//         <label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium text-[#243346]">Display name <span className="text-red-500">*</span></span><input required value={account.displayName} onChange={(e) => setAccount({ ...account, displayName: e.target.value })} className="input-field h-12 rounded-sm" /><i className="mt-2 block text-xs text-slate-500">This will be how your name will be displayed in the account section and in reviews.</i></label>
//         <label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium text-[#243346]">Email address <span className="text-red-500">*</span></span><input required type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} className="input-field h-12 rounded-sm" /></label>
//       </div>
//       <fieldset className="mt-7 border border-slate-200 p-4 sm:p-5">
//         <legend className="px-2 text-sm font-black text-[#243346]">Password change</legend>
//         <div className="space-y-5">
//           <label className="block"><span className="mb-2 block text-sm text-[#243346]">Current password (leave blank to leave unchanged)</span><input type="password" value={account.currentPassword} onChange={(e) => setAccount({ ...account, currentPassword: e.target.value })} className="input-field h-12 rounded-sm" /></label>
//           <label className="block"><span className="mb-2 block text-sm text-[#243346]">New password (leave blank to leave unchanged)</span><input type="password" value={account.newPassword} onChange={(e) => setAccount({ ...account, newPassword: e.target.value })} className="input-field h-12 rounded-sm" /></label>
//           <label className="block"><span className="mb-2 block text-sm text-[#243346]">Confirm new password</span><input type="password" value={account.confirmPassword} onChange={(e) => setAccount({ ...account, confirmPassword: e.target.value })} className="input-field h-12 rounded-sm" /></label>
//         </div>
//       </fieldset>
//       {accountError && (
//   <p className="mt-4 bg-red-50 px-3 py-3 text-sm font-semibold text-red-700">
//     {accountError}
//   </p>
// )}

// {accountMessage && (
//   <p className="mt-4 bg-green-50 px-3 py-3 text-sm font-semibold text-green-700">
//     {accountMessage}
//   </p>
// )}
// <button
//   type="submit"
//   disabled={savingAccount}
//   className="btn-gold mt-5 rounded-sm px-6 disabled:cursor-not-allowed disabled:opacity-60"
// >
//   {savingAccount
//     ? "Saving..."
//     : "Save changes"}
// </button>
//       {/* {accountMessage && <p className={`mt-4 text-sm font-semibold ${accountMessage.includes("do not match") ? "text-red-600" : "text-green-700"}`}>{accountMessage}</p>} */}
//       {/* <button type="submit" className="btn-gold mt-5 rounded-sm px-6">Save changes</button> */}
//     </form>
//   );

//   return (
//     <main className="bg-white">
//       <div className="container-site py-10 sm:py-14 lg:py-16">
//         <h1 className="text-3xl font-black text-[#243346] sm:text-4xl">My Account</h1>

//         <div className="mt-3 flex items-center gap-1 text-sm">
//           <Link to="/" className="text-slate-400 transition hover:text-[#D9A537]">Home</Link>
//           <span className="text-slate-300">›</span>
//           <span className="font-medium text-[#243346]">My Account</span>
//         </div>

//         <div className="mt-12 grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-14">
//           <aside className="h-fit border-t border-slate-200">
//             {navItems.map(({ id, label, icon: Icon }) => (
//               <button key={id} onClick={() => changeTab(id)} className={`flex w-full items-center justify-between border-b border-slate-200 py-4 text-left text-sm font-medium transition ${activeTab === id ? "text-[#D9A537]" : "text-[#243346] hover:text-[#D9A537]"}`}><span>{label}</span><Icon size={16} className={activeTab === id ? "text-[#D9A537]" : "text-slate-300"} /></button>
//             ))}
//             <button onClick={doLogout} className="flex w-full items-center justify-between border-b border-slate-200 py-4 text-left text-sm font-medium text-[#243346] hover:text-[#D9A537]"><span>Log out</span><LogOut size={16} className="text-slate-300" /></button>
//           </aside>

//           <section className="min-w-0 pt-1">
//             {activeTab === "dashboard" && renderDashboard()}
//             {activeTab === "orders" && renderOrders()}
//             {activeTab === "downloads" && renderDownloads()}
//             {activeTab === "addresses" && renderAddress()}
//             {activeTab === "account" && renderAccount()}
//           </section>
//         </div>
//       </div>
//     </main>
//   );
// }

