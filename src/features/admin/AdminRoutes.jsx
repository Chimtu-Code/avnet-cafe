import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { supabase } from '../../shared/services/supabaseClient';
import AdminLogin from './pages/AdminLogin';
import ManageItems from './pages/ManageItems';
import OrdersPending from './pages/OrdersPending';
import OrdersCompleted from './pages/OrdersCompleted';
import SalesSummary from './pages/SalesSummary';

/**
 * Admin email comes from an env var so it's never exposed in the client bundle.
 * Add VITE_ADMIN_EMAIL=youraddress@example.com to your .env file.
 *
 * Security note: this check prevents accidental access by non-admin Supabase
 * users. For a production app, pair it with a Supabase custom claim or a
 * server-side role check so the restriction can't be bypassed in the browser.
 */
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

// ─── Auth cache ───────────────────────────────────────────────────────────────
// We store the verification result in a module-level ref so ProtectedRoute
// doesn't hit supabase.auth.getSession() on every navigation event.
let _cachedAuth = null; // null = unknown, true/false = resolved

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuth, setIsAuth] = useState(_cachedAuth); // start from cache
  const verifyingRef = useRef(false);

  useEffect(() => {
    // Already know the answer — don't re-verify
    if (_cachedAuth !== null) {
      setIsAuth(_cachedAuth);
      return;
    }
    // Guard against concurrent calls on rapid navigation
    if (verifyingRef.current) return;
    verifyingRef.current = true;

    supabase.auth.getSession().then(({ data }) => {
      const user = data?.session?.user;
      const valid = !!(user && user.email === ADMIN_EMAIL);
      _cachedAuth = valid;
      setIsAuth(valid);
      verifyingRef.current = false;
    });
  }, [location.pathname]);

  // Listen for sign-out events and invalidate the cache
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          _cachedAuth = null;
          setIsAuth(false);
        }
        if (event === 'SIGNED_IN') {
          // Force re-verify on next render
          _cachedAuth = null;
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  if (isAuth === null) return null; // loading — render nothing briefly
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