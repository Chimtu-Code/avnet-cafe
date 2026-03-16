import React, { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { supabase } from "../../shared/services/supabaseClient";
import { isAdmin } from "../../shared/utils/IsAdmin.js";
import AdminLogin from "./pages/AdminLogin";
import ManageItems from "./pages/ManageItems";
import OrdersPending from "./pages/OrdersPending";
import OrdersCompleted from "./pages/OrdersCompleted";
import SalesSummary from "./pages/SalesSummary";

// ─── Auth cache ───────────────────────────────────────────────────────────────
let _cachedAuth = null;

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuth, setIsAuth] = useState(_cachedAuth);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (_cachedAuth !== null) {
      setIsAuth(_cachedAuth);
      return;
    }
    if (verifyingRef.current) return;
    verifyingRef.current = true;

    supabase.auth.getSession().then(({ data }) => {
      const valid = isAdmin(data?.session?.user);
      _cachedAuth = valid;
      setIsAuth(valid);
      verifyingRef.current = false;
    });
  }, [location.pathname]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        _cachedAuth = null;
        setIsAuth(false);
      }
      if (event === "SIGNED_IN") {
        _cachedAuth = null;
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (isAuth === null) return null;
  return isAuth ? children : <Navigate to="/admin/login" replace />;
};

const AdminRoutes = () => (
  <Routes>
    <Route path="login" element={<AdminLogin />} />
    <Route
      path=""
      element={
        <ProtectedRoute>
          <OrdersPending />
        </ProtectedRoute>
      }
    />
    <Route
      path="orders-completed"
      element={
        <ProtectedRoute>
          <OrdersCompleted />
        </ProtectedRoute>
      }
    />
    <Route
      path="manage-items"
      element={
        <ProtectedRoute>
          <ManageItems />
        </ProtectedRoute>
      }
    />
    <Route
      path="sales-summary"
      element={
        <ProtectedRoute>
          <SalesSummary />
        </ProtectedRoute>
      }
    />
  </Routes>
);

export default AdminRoutes;
