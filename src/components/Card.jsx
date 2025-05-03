import React, { useState } from "react";
import "../styles/Card.css";
import { useCart } from "../context/CartContext";

const Card = ({ item }) => {
  const { addToCart, cartItems, increment, decrement } = useCart();
  const currentItem = cartItems.find((i) => i.id === item.id);
  const quantity = currentItem ? currentItem.quantity : 0;

  const handleAdd = () => {
    addToCart(item);
  };

  const handleIncrement = () => {
    increment(item.id);
  };

  const handleDecrement = () => {
    decrement(item.id);
  };

  return (
    <div className="food-card">
      <img src="./food-img.svg" alt="" className="food-img" />
      <div className="name-and-price">
        <div className="card-item-name">
          <p>{item.name}</p>
          <img src="./veg-indicator.svg" alt="VEG" />
        </div>
        <p className="card-item-price">₹{item.price}</p>
        {quantity === 0 ? (
          <button onClick={handleAdd} className="card-add-btn">
            ADD
          </button>
        ) : (
          <div className="card-item-quantity">
            <button
              className="cart-item-quantity-btn"
              onClick={handleDecrement}
            >
              <img
                src="./minus-icon.svg"
                alt="-"
              />
            </button>
            <p className="cart-item-quantity-value">{quantity}</p>
            <button
              className="cart-item-quantity-btn"
              onClick={handleIncrement}
            >
              <img src="./plus-icon.svg" alt="+" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
