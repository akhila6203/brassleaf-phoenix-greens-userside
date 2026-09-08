import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate, useParams } from "react-router-dom";
import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Collections from "./pages/Collections";
import UniformCollection from "./pages/UniformCollection";
import ProductDetails from "./pages/ProductDetails";

import CategoryProducts
  from "./pages/CategoryProducts";

import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import PayForOrder from "./pages/PayForOrder";
import Account from "./pages/Account";
import ForgotPassword from "./pages/ForgotPassword";
import SetPassword from "./pages/SetPassword";
import { useAuth } from "./context/AuthContext";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ReturnPolicy from "./pages/ReturnPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import CancellationPolicy from "./pages/CancellationPolicy";
import OrderTracking from "./pages/OrderTracking";

function OrderProfileRedirect() {
  const { orderId } = useParams();
  return (
    <Navigate
      to={`/profile?tab=orders&orderId=${orderId}`}
      replace
    />
  );
}

function AppShell() {
  const { isAuthenticated } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const requireAuth = (path = null) => {
    if (isAuthenticated) {
      if (path) navigate(path);
      return true;
    }
    setPendingPath(path);
    setAuthOpen(true);
    return false;
  };

  const closeAuth = () => {
    setAuthOpen(false);
    setPendingPath(null);
  };

  const authSuccess = () => {
    setAuthOpen(false);
    if (pendingPath) navigate(pendingPath);
    setPendingPath(null);
  };

  return (
    <>
      <ScrollToTop />
      <Header
        onLoginRequired={requireAuth}
        authOpen={authOpen}
        onAuthClose={closeAuth}
        onAuthSuccess={authSuccess}
      />

      <Routes location={location}>
        <Route
  path="/"
  element={<Home />}
/>

<Route
  path="/uniforms/:collectionSlug"
  element={
    <UniformCollection
      requireAuth={requireAuth}
    />
  }
/>
<Route
  path="/category/:categorySlug"
  element={
    <CategoryProducts />
  }
/>
<Route
  path="/collections"
  element={
    <Collections
      requireAuth={requireAuth}
    />
  }
/>

<Route
  path="/products/:id"
  element={
    <ProductDetails
      requireAuth={requireAuth}
    />
  }
/>
        {/* <Route path="/" element={<Home />} />
        <Route path="/collections" element={<Collections requireAuth={requireAuth} />} />
        <Route path="/products/:id" element={<ProductDetails requireAuth={requireAuth} />} /> */}

        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/pay-for-order/:orderId" element={<PayForOrder />} />
        <Route path="/order/:orderId" element={<OrderProfileRedirect />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
        <Route path="/profile" element={<Account />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/reset-password" element={<SetPassword />} />

        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/cancellation-policy" element={<CancellationPolicy />} />

        <Route path="*" element={<Home />} />
      </Routes>

      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
