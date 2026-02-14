import React, { useState, useEffect } from "react";
import CartList from "../components/Cart/CartList";
import "../styles/Cart.css";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

// ─── Inline styles for the suggestions strip ────────────────────────────────
const styles = {
  suggestionsWrapper: {
    padding: "0 1rem",
    marginTop: "0.5rem",
    marginBottom: "0.25rem",
  },
  suggestionsTitle: {
    fontSize: "0.95rem",
    fontWeight: "600",
    fontFamily: "'Poppins', sans-serif",
    color: "#1a1a1a",
    marginBottom: "0.6rem",
    textAlign : "center"
  },
  strip: {
    display: "flex",
    gap: "0.75rem",
    overflowX: "auto",
    overflowY: "hidden",
    paddingBottom: "0.5rem",
    scrollbarWidth: "thin", // Firefox
    msOverflowStyle: "auto", // IE/Edge
    WebkitOverflowScrolling: "touch",
    maxWidth: "100%",
    whiteSpace: "nowrap",
    boxSizing: "border-box",
  },
  card: {
    minWidth: "130px",
    maxWidth: "130px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    padding: "0.6rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.35rem",
    flexShrink: 0,
    border: "1px solid #f0f0f0",
  },
  cardImg: {
    width: "70px",
    height: "70px",
    objectFit: "cover",
    borderRadius: "8px",
    background: "#f5f5f5",
  },
  cardName: {
    fontSize: "0.75rem",
    fontWeight: "600",
    fontFamily: "'Poppins', sans-serif",
    color: "#1a1a1a",
    textAlign: "center",
    lineHeight: "1.2",
    width: "100%",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  cardPrice: {
    fontSize: "0.75rem",
    color: "#555",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: "500",
  },
  addBtn: {
    width: "100%",
    padding: "0.3rem 0",
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.7rem",
    fontWeight: "600",
    fontFamily: "'Poppins', sans-serif",
    cursor: "pointer",
    transition: "background 0.2s",
    letterSpacing: "0.5px",
  },
  addedBtn: {
    width: "100%",
    padding: "0.3rem 0",
    background: "#4caf50",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.7rem",
    fontWeight: "600",
    fontFamily: "'Poppins', sans-serif",
    cursor: "pointer",
    transition: "background 0.2s",
    letterSpacing: "0.5px",
  },
  divider: {
    borderTop: "1px dashed #e0e0e0",
    margin: "0.75rem 1rem",
  },
};

// ─── Suggestions Strip Component ────────────────────────────────────────────
const SuggestionsStrip = ({ cartItems, addToCart }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [addedIds, setAddedIds] = useState(new Set());

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    // Fetch items from categories named "Suggestions", "Drinks", or "Beverages"
    // Falls back to any 6 available items not in cart if no such category exists
    const { data: suggestedCategories } = await supabase
      .from("categories")
      .select("id")
      .or(
        "name.ilike.%suggestion%,name.ilike.%drink%,name.ilike.%beverage%,name.ilike.%water%",
      );

    let query = supabase
      .from("items")
      .select("*")
      .eq("avaliable", true)
      .limit(10);

    if (suggestedCategories && suggestedCategories.length > 0) {
      const ids = suggestedCategories.map((c) => c.id);
      query = query.in("category_id", ids);
    }

    const { data } = await query;
    if (data) {
      // Filter out items already in cart
      const cartIds = new Set(cartItems.map((i) => i.id));
      const filtered = data.filter((item) => !cartIds.has(item.id)).slice(0, 6);
      setSuggestions(filtered);
    }
  };

  const handleAdd = (item) => {
    addToCart(item);
    setAddedIds((prev) => new Set([...prev, item.id]));
    // Reset "Added" state after 2 seconds
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
      <div style={styles.suggestionsWrapper}>
        <p style={styles.suggestionsTitle}>🛒 Add to your order</p>
        {/* Custom scrollbar for horizontal scroll */}
        <style>{`
          .suggestions-strip {
            overflow-x: auto !important;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            width: min(100vw, 22.5rem);
            padding : 0 1rem;
          }
          .suggestions-strip::-webkit-scrollbar {
            height: 6px;
            background: #f0f0f0;
          }
          .suggestions-strip::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 4px;
          }
        `}</style>
        <div style={styles.strip} className="suggestions-strip">
          {suggestions.map((item) => {
            const isAdded = addedIds.has(item.id);
            return (
              <div key={item.id} style={styles.card}>
                <img
                  src={item.image_url || "./food-img.svg"}
                  alt={item.name}
                  style={styles.cardImg}
                  onError={(e) => {
                    e.target.src = "./food-img.svg";
                  }}
                />
                <p style={styles.cardName}>{item.name}</p>
                <p style={styles.cardPrice}>₹{item.price}</p>
                <button
                  style={isAdded ? styles.addedBtn : styles.addBtn}
                  onClick={() => handleAdd(item)}
                >
                  {isAdded ? "✓ ADDED" : "ADD"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div style={styles.divider} />
    </>
  );
};

// ─── Main Cart Page ──────────────────────────────────────────────────────────
const Cart = () => {
  const { getTotalItems, getTotalPrice, cartItems, addToCart } = useCart();
  const totalAmount = getTotalPrice();

  const gst = Math.round(totalAmount * 0.05);
  const totalToPay = totalAmount + gst;

  return (
    <div className="cart-sec">
      {/* ── Header ── */}
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

      {/* ── Cart Items ── */}
      <CartList />

      {/* ── Suggestions Strip (between items and bill) ── */}
      {cartItems.length > 0 && (
        <SuggestionsStrip cartItems={cartItems} addToCart={addToCart} />
      )}

      {/* ── Bill Details ── */}
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

      {/* ── Continue Button ── */}
      <button
        className="payment-btn"
        disabled={getTotalItems() === 0}
        style={{ backgroundColor: getTotalItems() === 0 ? "#ccc" : "#000" }}
      >
        <Link to={getTotalItems() === 0 ? "" : "/check-out"}>CONTINUE</Link>
      </button>
    </div>
  );
};

export default Cart;
