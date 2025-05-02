import React from "react";
import "../styles/Card.css";
import { useCart } from "../context/CartContext";

const Card = ({ item }) => {
  const { addToCart } = useCart();

  return (
    <div className="food-card">
      <img src="./food-img.svg" alt="" className="food-img" />
      <div className="name-and-price">
        <div className="card-item-name">
          <p>{item.name}</p>
          <img src="./veg-indicator.svg" alt="VEG" />
        </div>
        <p className="card-item-price">₹{item.price}</p>
        <button onClick={() => addToCart(item)} className="card-add-btn">
          ADD
        </button>
      </div>
    </div>
  );
};

export default Card;
