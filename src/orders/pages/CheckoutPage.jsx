import React, { useState } from "react";
import "./CheckoutPage.css";
import { useCart } from "../../context/CartContext";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";

const CheckoutPage = () => {
  const { cartItems, getTotalPrice, setCartItems } = useCart();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toPay = getTotalPrice() + Math.round(getTotalPrice() * 0.05); //5% gst

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateToken = () => Math.floor(1000 + Math.random() * 9000); // 4-digit token

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || cartItems.length === 0) return;
    if (form.phone.length != 10) {
      alert("Please enter a valid phone number!");
      return;
    }
    if (form.phone.length === 10) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(form.phone)) {
        alert("Please enter a valid phone number!");
        return;
      }
    }

    setLoading(true);
    const tokenNumber = generateToken();

    const { error } = await supabase.from("orders").insert([
      {
        name: form.name,
        phone: form.phone,
        items: cartItems,
        total_price: toPay,
        token_number: tokenNumber,
        status: "pending",
      },
    ]);

    setLoading(false);

    if (!error) {
      const existing = JSON.parse(localStorage.getItem("userPhones") || "[]");
      if (!existing.includes(form.phone)) existing.push(form.phone);
      localStorage.setItem("userPhones", JSON.stringify(existing));
      console.log("Inserting successful navigating to the /my-tokens page");
      setCartItems([]); // Clear cart
      navigate("/my-tokens"); // Redirect to token status page
    } else {
      alert("Something went wrong! Please try again.");
      console.log(error);
    }
  };

  return (
    <div className="check-out">
      <div className="welcome-to-signin">
        <img src="./cafe-logo.svg" alt="Welcome" />
        <p>Enter Your Details</p>
      </div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Enter Your Name</label>
        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
          required
        />

        <label htmlFor="phone">Enter Your PhoneNumber</label>
        <input
          type="number"
          name="phone"
          minLength={10}
          placeholder="Phone Number"
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Placing Order..." : `Continue & Pay ₹${toPay}`}
        </button>
      </form>
    </div>
  );
};

export default CheckoutPage;
