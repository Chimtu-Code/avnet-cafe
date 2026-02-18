import { React, useState, useEffect } from "react";
import "./TokenCard.css";

const TokenCard = ({ order }) => {
  const createdAt = new Date(order.created_at);
  const gst = Math.round(order.total_price * 0.05);
  const basePrice = order.total_price - gst;
  const [showDetails, setShowDetails] = useState(false);
  const [showPopup, setShowPopup] = useState(order.status === "completed");

  useEffect(() => {
    if (order.status === "completed") {
      setShowPopup(true);
      const t = setTimeout(() => setShowPopup(false), 10000);
      return () => clearTimeout(t);
    }
  }, [order.status]);

  return (
    <div className="user-token">
      {showPopup && (
        <div
          style={{
            background: "#4caf50",
            color: "#fff",
            padding: "0.6rem 1rem",
            fontSize: "0.82rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
          }}
        >
          <span>🎉 Your order is ready for pickup!</span>
          <button
            onClick={() => setShowPopup(false)}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: "1rem",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}
      <p className="user-name">
        {order.name || "user"}{" "}
        {order.status === "completed" ? "ORDER READY" : "YOUR ORDER RECEIVED"}
        <img
          src={
            order.status === "completed"
              ? "./completed-order.png"
              : "./pending-order.svg"
          }
          alt={order.status}
          className="status-indicator"
        />
      </p>
      <div className="user-token-details">
        <p className="user-token-greet">Here's your order number</p>
        <section>
          <p className="user-token-number">#{order.token_number}</p>
          <div className="user-token-timings">
            <p>{createdAt.toLocaleDateString()}</p>
            <p>
              {createdAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </section>
      </div>
      <div className="user-bill-details">
        <header>
          <p>Bill Details</p>
          <button onClick={() => setShowDetails(!showDetails)}>
            Item Details <img src="./down-arrow.svg" alt=">" />
          </button>
        </header>
        {showDetails && (
          <div className="user-ordered-items">
            <hr />
            {order.items.map((item) => (
              <div className="user-ordered-item" key={item.id}>
                <p>
                  {item.name} x {item.quantity}
                </p>
                <p>₹{item.price * item.quantity}</p>
              </div>
            ))}
            <hr />
          </div>
        )}
        <div className="user-bill-total">
          <p>Item Total</p>
          <p>{basePrice}</p>
        </div>
        <div className="user-bill-gst">
          <p>GST & Other Charges (5%)</p>
          <p>₹{gst}</p>
        </div>
        <hr />
        <div className="user-bill-to-pay">
          <p>TOTAL BILL</p>
          <p>₹{order.total_price}</p>
        </div>
      </div>
    </div>
  );
};

export default TokenCard;
