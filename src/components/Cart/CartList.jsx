import React from 'react';
import CartItem from './CartItem';
import './CartList.css';
import { useCart } from '../../context/CartContext';

const CartList = () => {
  const { cartItems } = useCart();

  return (
    <div className='cart-list'>
      {cartItems.length === 0 ? (
        <img src="./empty-cart.svg" alt=":(" className='empty-cart'/>
      ) : (
        cartItems.map((item) => <CartItem key={item.id} item={item} />)
      )}
    </div>
  );
};

export default CartList;
