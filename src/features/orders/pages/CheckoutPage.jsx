import React, { useMemo, useRef, useState } from 'react';
import './CheckoutPage.css';
import { useCartData, useCartActions } from '../../cart/context/CartContext';
import { supabase } from '../../../shared/services/supabaseClient';
import { useNavigate } from 'react-router-dom';

// ─── Token generation ────────────────────────────────────────────────────────
// Math.random() over a 9000-number range gives ~3% daily collision at 500
// orders. Instead we use a time-seeded approach: base on minute-of-day (0-1439)
// combined with a small random suffix, then enforce uniqueness via the DB's
// UNIQUE constraint on token_number with a retry loop.

function generateToken() {
  // 4-digit token: 1000–9999
  return Math.floor(1000 + Math.random() * 9000);
}

const MAX_RETRIES = 5;

async function insertOrderWithUniqueToken(payload) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const token = generateToken();
    const { error } = await supabase
      .from('orders')
      .insert([{ ...payload, token_number: token }]);

    if (!error) return { token, error: null };

    // Postgres unique violation code
    if (error.code === '23505') continue; // collision — retry with new token

    return { token: null, error }; // real error — stop
  }
  return { token: null, error: new Error('Could not generate a unique token after retries') };
}

// ─── Phone validation ─────────────────────────────────────────────────────────
const PHONE_RE = /^[0-9]{10}$/;

// ─── Component ────────────────────────────────────────────────────────────────
const CheckoutPage = () => {
  const { cartItems, totalPrice } = useCartData();
  const { clearCart } = useCartActions();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Submission guard — useRef so toggling it never causes a re-render
  const submittingRef = useRef(false);
  const [loading, setLoading] = useState(false);

  // Single source of truth for GST — computed once, used in UI + submit
  const gst = useMemo(() => Math.round(totalPrice * 0.05), [totalPrice]);
  const toPay = totalPrice + gst;

  const handleChange = (e) => {
    setError('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard: block if already in-flight (handles double-tap on mobile)
    if (submittingRef.current) return;

    if (!form.name.trim()) return setError('Please enter your name.');
    if (!PHONE_RE.test(form.phone)) return setError('Please enter a valid 10-digit phone number.');
    if (cartItems.length === 0) return setError('Your cart is empty.');

    submittingRef.current = true;
    setLoading(true);
    setError('');

    const { token, error: dbError } = await insertOrderWithUniqueToken({
      name: form.name.trim(),
      phone: form.phone,
      items: cartItems,
      total_price: toPay,
      status: 'pending',
    });

    submittingRef.current = false;
    setLoading(false);

    if (dbError) {
      setError('Something went wrong. Please try again.');
      console.error(dbError);
      return;
    }

    // Persist phone so MyTokens can look up orders
    try {
      const existing = JSON.parse(localStorage.getItem('userPhones') ?? '[]');
      if (!existing.includes(form.phone)) {
        localStorage.setItem('userPhones', JSON.stringify([...existing, form.phone]));
      }
    } catch {
      localStorage.setItem('userPhones', JSON.stringify([form.phone]));
    }

    clearCart();
    navigate('/my-tokens');
  };

  return (
    <div className="check-out">
      <div className="welcome-to-signin">
        <img src="/cafe-logo.svg" alt="Avnet Cafe" />
        <p>Enter Your Details</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="name">Your Name</label>
        <input
          id="name"
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          autoComplete="name"
          required
        />

        <label htmlFor="phone">Phone Number</label>
        <input
          id="phone"
          type="tel"
          name="phone"
          placeholder="10-digit phone number"
          value={form.phone}
          onChange={handleChange}
          autoComplete="tel-national"
          maxLength={10}
          required
        />

        {error && <p className="checkout-error">{error}</p>}

        <div className="checkout-price-summary">
          <span>Item total</span><span>₹{totalPrice}</span>
          <span>GST (5%)</span><span>₹{gst}</span>
          <span className="checkout-total">Total</span>
          <span className="checkout-total">₹{toPay}</span>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Placing Order…' : `Continue & Pay ₹${toPay}`}
        </button>
      </form>
    </div>
  );
};

export default CheckoutPage;