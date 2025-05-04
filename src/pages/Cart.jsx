import React from "react";
import CartList from "../components/Cart/CartList";
import "../styles/Cart.css";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

const Cart = () => {
  const { getTotalItems } = useCart();
  const { getTotalPrice } = useCart();
  const totalAmount = getTotalPrice();

  const gst = Math.round(totalAmount * 0.05);
  const totalToPay = totalAmount + gst;

  return (
    <div className="cart-sec">
      <div className="cart-nav">
        <div className="cart-nav-content-left">
          <Link to="/">
            <img src="./back-arrow.svg" alt="Back" className="back-arrow" />
          </Link>
          <p className="cart-title">My Cart</p>
        </div>
        <p className="cart-nav-content-right">
          {getTotalItems()} item{getTotalItems() !== 1 && "s"}
        </p>
      </div>

      <CartList />

      <div className="total-sec">
        <p className="total-header">Bill Details</p>
        <div className="items-total">
          <p>Item Total</p>
          <p>₹{totalAmount}</p>
        </div>
        <div className="items-gst">
          <p>GST & Other Charges (5%)</p>
          <p>₹{gst}</p>
        </div>
        <hr />
        <div className="total-to-pay">
          <p>TO PAY</p>
          <p>₹{totalToPay}</p>
        </div>
      </div>

      <button className="payment-btn" disabled={getTotalItems() === 0} style={{backgroundColor: getTotalItems() === 0 ? "#ccc" : "#000"}}>
        <Link to={getTotalItems()===0?"":"/check-out" } d>CONTINUE</Link>
      </button>
    </div>
  );
};

export default Cart;
