import React from "react";
import "../styles/Card.css";
import { useCartData, useCartActions } from "../../cart/context/CartContext";

/**
 * Card uses two separate context hooks:
 * - useCartActions: stable refs (addToCart, inc, dec) — never causes re-render
 * - useCartData: only to read this item's quantity
 *
 * With the old single useCart hook, every card re-rendered whenever ANY cart
 * item changed. Now only the card whose item quantity actually changed re-renders.
 */
const Card = ({ item }) => {
  const { cartItems } = useCartData();
  const { addToCart, increment, decrement } = useCartActions();

  const quantity = cartItems.find((i) => i.id === item.id)?.quantity ?? 0;

  return (
    <div className="food-card">
      <img
        src={item.image_url || "/food-img.svg"}
        alt={item.name}
        className="food-img"
        loading="lazy"
      />
      <div className="name-and-price">
        <div className="card-item-name">
          <p>{item.name}</p>
          <img src="/veg-indicator.svg" alt="VEG" />
        </div>
        <p className="card-item-price">₹{item.price}</p>

        {quantity === 0 ? (
          <button onClick={() => addToCart(item)} className="card-add-btn">
            ADD
          </button>
        ) : (
          <div className="card-item-quantity">
            <button
              className="cart-item-quantity-btn"
              onClick={() => decrement(item.id)}
            >
              <img src="/minus-icon.svg" alt="-" />
            </button>
            <p className="cart-item-quantity-value">{quantity}</p>
            <button
              className="cart-item-quantity-btn"
              onClick={() => increment(item.id)}
            >
              <img src="/plus-icon.svg" alt="+" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
