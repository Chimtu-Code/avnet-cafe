import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RestaurantProvider } from './shared/context/RestaurantContext';
import Home from './features/menu/pages/Home';
import Cart from './features/cart/pages/Cart';
import CheckoutPage from './features/orders/pages/CheckoutPage';
import MyTokens from './features/orders/pages/MyTokens';

const AdminRoutes = lazy(() => import('./features/admin/AdminRoutes'));

const App = () => (
  <div className="app">
    <Router>
      <RestaurantProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/check-out" element={<CheckoutPage />} />
          <Route path="/my-tokens" element={<MyTokens />} />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={null}>
                <AdminRoutes />
              </Suspense>
            }
          />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </RestaurantProvider>
    </Router>
  </div>
);

export default App;