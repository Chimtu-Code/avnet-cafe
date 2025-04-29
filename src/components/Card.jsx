import React from "react";
import "../styles/Card.css";

const Card = ({ item }) => {
  return (
    <div className="food-card">
      <img src="./food-img.svg" alt="" className="food-img" />
      <div className="name-and-price">
        <div className="card-item-name">
          <p>{item.name}</p>
          <img src="./veg-indicator.svg" alt="VEG" />
        </div>
        <p className="card-item-price">₹{item.price}</p>
        <button className="card-add-btn">ADD</button>
      </div>
    </div>
  );
};

export default Card;
