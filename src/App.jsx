import React from "react";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import CheckoutPage from "./orders/pages/CheckoutPage";
import MyTokens from "./orders/pages/MyTokens";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminRoutes from "./admin/AdminRoutes";

const App = () => {
  return (
    <div className="app">
      <Router>
        <Routes>
          {/* User Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/check-out" element={<CheckoutPage />}></Route>
          <Route path="/my-tokens" element={<MyTokens />}></Route>
          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminRoutes />} />
          {/* 404 Not Found */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
