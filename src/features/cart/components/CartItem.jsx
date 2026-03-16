import React from 'react';
import './CartItem.css';
import { useCartData, useCartActions } from '../context/CartContext';

const CartItem = ({ item }) => {
  const { cartItems } = useCartData();
  const { increment, decrement, removeItem } = useCartActions();

  const quantity = cartItems.find((i) => i.id === item.id)?.quantity ?? 1;

  return (
    <div className="cart-item">
      <img
        src={item.image_url || '/food-img.svg'}
        alt={item.name}
        className="cart-food-img"
        loading="lazy"
      />
      <div className="cart-name-and-price">
        <div className="cart-item-name">
          <p>{item.name}</p>
          <img src="/veg-indicator.svg" alt="VEG" />
        </div>
        <p className="cart-item-price">₹{item.price}</p>
        <div className="cart-item-quantity-and-remove">
          <div className="cart-item-quantity">
            <button
              className="cart-item-quantity-btn"
              disabled={quantity === 1}
              onClick={() => decrement(item.id)}
            >
              <img
                src="/minus-icon.svg"
                alt="-"
                style={{ opacity: quantity === 1 ? 0.5 : 1 }}
              />
            </button>
            <p className="cart-item-quantity-value">{quantity}</p>
            <button
              className="cart-item-quantity-btn"
              onClick={() => increment(item.id)}
            >
              <img src="/plus-icon.svg" alt="+" />
            </button>
          </div>
          <button className="cart-item-remove-btn" onClick={() => removeItem(item.id)}>
            <img src="/trash-icon.svg" alt="Remove" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;