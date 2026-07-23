import React from "react";
import { Link } from "react-router-dom";
import CartList from "../components/CartList";
import { useCartData, useCartActions } from "../context/CartContext";
import { supabase } from "../../../shared/services/supabaseClient";
import { useState, useEffect } from "react";
import { calcGST, calcTotal, GST_LABEL } from "../../../shared/utils/gst";
import "./Cart.css";

// ─── Suggestions Strip ────────────────────────────────────────────────────────
const SuggestionsStrip = ({ cartItems, addToCart }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [addedIds, setAddedIds] = useState(new Set());

  useEffect(() => {
    const fetchSuggestions = async () => {
      const { data: suggestedCategories } = await supabase
        .from("categories")
        .select("id")
        .or(
          "name.ilike.%suggestion%,name.ilike.%drinks%,name.ilike.%beverage%,name.ilike.%water%",
        );

      let query = supabase
        .from("items")
        .select("*")
        .eq("available", true)
        .limit(10);

      if (suggestedCategories?.length > 0) {
        query = query.in(
          "category_id",
          suggestedCategories.map((c) => c.id),
        );
      }

      const { data } = await query;
      if (data) {
        const cartIds = new Set(cartItems.map((i) => i.id));
        setSuggestions(
          data.filter((item) => !cartIds.has(item.id)).slice(0, 6),
        );
      }
    };
    fetchSuggestions();
  }, []);

  const handleAdd = (item) => {
    addToCart(item);
    setAddedIds((prev) => new Set([...prev, item.id]));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 2000);
  };

  if (suggestions.length === 0) return null;

  return (
    <>
      <div className="suggestions-wrapper">
        <p className="suggestions-title">🛒 Add to your order</p>
        <div className="suggestions-strip">
          {suggestions.map((item) => {
            const isAdded = addedIds.has(item.id);
            return (
              <div key={item.id} className="suggestion-card">
                <img
                  src={item.image_url || "/food-img.svg"}
                  alt={item.name}
                  className="suggestion-img"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = "/food-img.svg";
                  }}
                />
                <p className="suggestion-name">{item.name}</p>
                <p className="suggestion-price">₹{item.price}</p>
                <button
                  className={`suggestion-btn ${isAdded ? "added" : ""}`}
                  onClick={() => handleAdd(item)}
                >
                  {isAdded ? "✓ ADDED" : "ADD"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="suggestions-divider" />
    </>
  );
};

// ─── Preorder Note ───────────────────────────────────────────────────────────
const PreorderNote = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const pad = (n) => String(n).padStart(2, "0");
  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const makeTime = (h, m = 0, dayOffset = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(h, m, 0, 0);
    return d;
  };

  // Define meals and their start hours (24h)
  const meals = [
    { key: "breakfast", label: "Breakfast", startHour: 8 },
    { key: "lunch", label: "Lunch", startHour: 12 },
    { key: "snacks", label: "Snacks", startHour: 17 },
    { key: "dinner", label: "Dinner", startHour: 20 },
  ];

  // compute start and cutoff Date objects for today
  const schedule = meals.map((m) => {
    const start = makeTime(m.startHour);
    const cutoffHour = (m.startHour - 2 + 24) % 24;
    // If cutoffHour > startHour, it means cutoff is previous day (not expected here but safe)
    const cutoff = makeTime(cutoffHour, 0, cutoffHour > m.startHour ? -1 : 0);
    return { ...m, start, cutoff };
  });

  let message =
    "Pre-orders accepted for Breakfast (8:00 AM), Lunch (12:00 PM), Snacks (5:00 PM) and Dinner (8:00 PM). Cutoff is 2 hours before each meal.";

  // Follow the same open/closed logic in order
  const b = schedule[0];
  const l = schedule[1];
  const s = schedule[2];
  const d = schedule[3];

  if (now < b.cutoff) {
    message = `Pre-orders OPEN for ${b.label}. Cutoff at ${formatTime(b.cutoff)}.`;
  } else if (now >= b.cutoff && now < b.start) {
    message = `Pre-orders for ${b.label} are CLOSED. ${b.label} starts at ${formatTime(b.start)}.`;
  } else if (now >= b.start && now < l.cutoff) {
    message = `Pre-orders OPEN for ${l.label}. Cutoff at ${formatTime(l.cutoff)}.`;
  } else if (now >= l.cutoff && now < l.start) {
    message = `Pre-orders for ${l.label} are CLOSED. ${l.label} starts at ${formatTime(l.start)}.`;
  } else if (now >= l.start && now < s.cutoff) {
    message = `Pre-orders OPEN for ${s.label}. Cutoff at ${formatTime(s.cutoff)}.`;
  } else if (now >= s.cutoff && now < s.start) {
    message = `Pre-orders for ${s.label} are CLOSED. ${s.label} starts at ${formatTime(s.start)}.`;
  } else if (now >= s.start && now < d.cutoff) {
    message = `Pre-orders OPEN for ${d.label}. Cutoff at ${formatTime(d.cutoff)}.`;
  } else if (now >= d.cutoff && now < d.start) {
    message = `Pre-orders for ${d.label} are CLOSED. ${d.label} starts at ${formatTime(d.start)}.`;
  } else if (now >= d.start) {
    // after dinner: show next day's breakfast cutoff
    const nextBreakfastCutoff = makeTime(
      b.startHour - 2 < 0 ? b.startHour - 2 + 24 : b.startHour - 2,
      0,
      1,
    );
    message = `After dinner. Next ${b.label} pre-order cutoff: ${formatTime(nextBreakfastCutoff)} (tomorrow).`;
  }

  return (
    <div className="preorder-note">
      <p className="preorder-message">{message}</p>
      <p className="preorder-time">Current time: {formatTime(now)}</p>
    </div>
  );
}; 

const Cart = () => {
  const { totalItems, totalPrice, cartItems } = useCartData();
  const { addToCart } = useCartActions();

  const gst = calcGST(totalPrice);
  const totalToPay = calcTotal(totalPrice);

  return (
    <div className="cart-sec">
      <div className="cart-nav">
        <div className="cart-nav-content-left">
          <Link to="/">
            <img src="/back-arrow.svg" alt="Back" className="back-arrow" />
          </Link>
          <p className="cart-title">My Cart</p>
        </div>
        <p className="cart-nav-content-right">
          {totalItems} item{totalItems !== 1 && "s"}
        </p>
      </div>

      <CartList />

      {cartItems.length > 0 && (
        <SuggestionsStrip cartItems={cartItems} addToCart={addToCart} />
      )}

      {cartItems.length > 0 && <PreorderNote />}

      <div className="total-sec">
        <p className="total-header">Bill Details</p>
        <div className="items-total">
          <p>Item Total</p>
          <p>₹{totalPrice}</p>
        </div>
        <div className="items-gst">
          <p>GST & Other Charges ({GST_LABEL})</p>
          <p>₹{gst}</p>
        </div>
        <hr />
        <div className="total-to-pay">
          <p>TO PAY</p>
          <p>₹{totalToPay}</p>
        </div>
      </div>

      <button
        className="payment-btn"
        disabled={totalItems === 0}
        style={{ backgroundColor: totalItems === 0 ? "#ccc" : "#000" }}
      >
        <Link to={totalItems === 0 ? "" : "/check-out"}>CONTINUE</Link>
      </button>
    </div>
  );
};

export default Cart;
