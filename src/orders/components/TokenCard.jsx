import {React,useState} from "react";
import "./TokenCard.css";

const TokenCard = ({ order }) => {
  const createdAt = new Date(order.created_at);
  const gst = Math.round(order.total_price * 0.05);
  const basePrice = order.total_price - gst;
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="user-token">
      <p className="user-name">
        {order.name || "user"} YOUR ORDER RECEIVED{" "}
        <img
          src="./pending-order.svg"
          alt="pending"
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
