import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import AdminLogin from "./pages/AdminLogin";
import ManageItems from "./pages/ManageItems";
import OrdersPending from "./pages/OrdersPending";
import OrdersCompleted from "./pages/OrdersCompleted";
import SalesSummary from "./pages/SalesSummary";

const ADMIN_EMAIL = "sushanth211107@gmail.com";

const ProtectedRoute = ({ children }) => {
  const [isAuth, setIsAuth] = useState(null); // null = loading
  const location = useLocation();

  useEffect(() => {
    const verifySession = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;
      const isValidAdmin = user && user.email === ADMIN_EMAIL;

      if (isValidAdmin) {
        localStorage.setItem("isAdmin", "true"); // Optional
        setIsAuth(true);
      } else {
        localStorage.removeItem("isAdmin");
        setIsAuth(false);
      }
    };

    verifySession();
  }, [location.pathname]);

  if (isAuth === null) return null;
  return isAuth ? children : <Navigate to="/admin/login" />;
};

const AdminRoutes = () => {
  return (
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
};

export default AdminRoutes;
