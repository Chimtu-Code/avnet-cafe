import React from "react";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import CheckoutPage from "./orders/pages/CheckoutPage";
import MyTokens from "./orders/pages/MyTokens";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const App = () => {
  return (
    <div className="app">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/check-out" element={<CheckoutPage />}></Route>
          <Route path="/my-tokens" element={<MyTokens />}></Route>
        </Routes>
      </Router>
    </div>
  );
};

export default App;
