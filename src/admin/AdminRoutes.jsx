import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import CategoryManager from './pages/CategoryManager';
import OrdersPending from './pages/OrdersPending';
import OrdersCompleted from './pages/OrdersCompleted';
import RevenueStats from './pages/RevenueStats';

const isAdminAuthenticated = () => {
  return sessionStorage.getItem('isAdmin') === 'true';
};

const ProtectedRoute = ({ children }) => {
  return isAdminAuthenticated() ? children : <Navigate to="/admin/login" />;
};

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      />
      <Route
        path="/admin/categories"
        element={<ProtectedRoute><CategoryManager /></ProtectedRoute>}
      />
      <Route
        path="/admin/orders-pending"
        element={<ProtectedRoute><OrdersPending /></ProtectedRoute>}
      />
      <Route
        path="/admin/orders-completed"
        element={<ProtectedRoute><OrdersCompleted /></ProtectedRoute>}
      />
      <Route
        path="/admin/stats"
        element={<ProtectedRoute><RevenueStats /></ProtectedRoute>}
      />
    </Routes>
  );
};

export default AdminRoutes;
