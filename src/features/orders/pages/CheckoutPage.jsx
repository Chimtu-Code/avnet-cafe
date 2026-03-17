import React, { useMemo, useRef, useState } from 'react';
import './CheckoutPage.css';
import { useCartData, useCartActions } from '../../cart/context/CartContext';
import { supabase } from '../../../shared/services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { calcGST, calcTotal, GST_LABEL } from '../../../shared/utils/gst';

function generateToken() {
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
    if (error.code === '23505') continue;
    return { token: null, error };
  }
  return { token: null, error: new Error('Could not generate a unique token after retries') };
}

const PHONE_RE = /^[0-9]{10}$/;

const CheckoutPage = () => {
  const { cartItems, totalPrice } = useCartData();
  const { clearCart } = useCartActions();
  const [form, setForm]           = useState({ name: '', phone: '' });
  const [error, setError]         = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]     = useState(false);
  const submittingRef = useRef(false);
  const navigate = useNavigate();

  const gst   = useMemo(() => calcGST(totalPrice), [totalPrice]);
  const toPay = useMemo(() => calcTotal(totalPrice), [totalPrice]);

  const handleChange = (e) => {
    setError('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Step 1 — validate form, show confirmation popup
  const handleReview = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Please enter your name.');
    if (!PHONE_RE.test(form.phone)) return setError('Please enter a valid 10-digit phone number.');
    if (cartItems.length === 0) return setError('Your cart is empty.');
    setError('');
    setShowConfirm(true);
  };

  // Step 2 — user confirmed, actually place the order
  const handleConfirm = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);

    const { error: dbError } = await insertOrderWithUniqueToken({
      name:        form.name.trim(),
      phone:       form.phone,
      items:       cartItems,
      total_price: toPay,
      status:      'pending',
    });

    submittingRef.current = false;
    setLoading(false);

    if (dbError) {
      setShowConfirm(false);
      setError('Something went wrong. Please try again.');
      console.error(dbError);
      return;
    }

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

      <form onSubmit={handleReview} noValidate>
        <label htmlFor="name">Your Name</label>
        <input
          id="name" type="text" name="name"
          placeholder="Name" value={form.name}
          onChange={handleChange} autoComplete="name" required
        />

        <label htmlFor="phone">Phone Number</label>
        <input
          id="phone" type="tel" name="phone"
          placeholder="10-digit phone number" value={form.phone}
          onChange={handleChange} autoComplete="tel-national"
          maxLength={10} required
        />

        {error && <p className="checkout-error">{error}</p>}

        <button type="submit">
          Continue & Pay ₹{toPay}
        </button>
      </form>

      {/* ── Confirmation popup ─────────────────────────────────────── */}
      {showConfirm && (
        <div className="confirm-overlay" onClick={() => !loading && setShowConfirm(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>

            <p className="confirm-title">Confirm Your Order</p>

            {/* Order summary */}
            <div className="confirm-items">
              {cartItems.map((item) => (
                <div key={item.id} className="confirm-item-row">
                  <span className="confirm-item-name">{item.name}</span>
                  <span className="confirm-item-meta">
                    x{item.quantity} &nbsp;·&nbsp; ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Bill breakdown */}
            <div className="confirm-bill">
              <div className="confirm-bill-row">
                <span>Item total</span>
                <span>₹{totalPrice}</span>
              </div>
              <div className="confirm-bill-row">
                <span>GST ({GST_LABEL})</span>
                <span>₹{gst}</span>
              </div>
              <div className="confirm-bill-row confirm-bill-total">
                <span>Total</span>
                <span>₹{toPay}</span>
              </div>
            </div>

            {/* Customer details */}
            <div className="confirm-details">
              <span>👤 {form.name}</span>
              <span>📞 {form.phone}</span>
            </div>

            {/* Actions */}
            <div className="confirm-actions">
              <button
                className="confirm-btn-cancel"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                Edit
              </button>
              <button
                className="confirm-btn-pay"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? 'Placing…' : `Pay ₹${toPay}`}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;