import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";

const OrdersCompleted = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
  };

  const toggleDetails = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: #f5f5f5;
          font-family: 'Poppins', sans-serif;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .content-area {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
          width: 100%;
        }

        .history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
          max-width: 1400px;
        }

        .history-card {
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .history-header {
          background: black;
          color: white;
          padding: 0.5rem 0.8rem;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: Poppins;
        }

        .check-icon {
          width: 24px;
          height: 24px;
          background: #4caf50;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          font-weight: bold;
        }

        .history-body {
          padding: 1rem 0.8rem;
        }

        .history-token-section {
          padding-bottom: 1rem;
          border-bottom: 2px dotted #4caf50;
          margin-bottom: 1rem;
        }

        .history-token-label {
          font-family: Poppins;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .history-token-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .history-token {
          font-size: 2.5rem;
          font-weight: 800;
          font-family: sans-serif;
          color: #000;
        }

        .history-datetime {
          font-size: 1rem;
          color: #000;
          font-family: Poppins;
          text-align: right;
          line-height: 1.4;
        }

        .history-items-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .history-items-header p {
          font-weight: 500;
          font-family: Poppins;
          font-size: 1rem;
        }

        .details-btn {
          border: none;
          background: none;
          color: #78787a;
          font-size: 0.625rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.2rem;
          font-family: Roboto;
        }

        .history-items-list {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin: 0.5rem 0;
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background: #f7f7f7;
          border-radius: 0.625rem;
          font-size: 0.875rem;
        }

        .history-item-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #282828;
          font-family: Roboto;
          margin: 0.25rem 0;
        }

        .history-total {
          display: flex;
          justify-content: space-between;
          font-size: 1rem;
          font-weight: 700;
          color: #282828;
          font-family: Roboto;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
        }

        .check-icon {
          width: 20px;
          height: 20px;
          background: #4caf50;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
        }

        hr {
          border: none;
          border-top: 1px solid #e0e0e0;
          margin: 0.5rem 0;
        }

        @media (max-width: 768px) {
          .history-grid {
            grid-template-columns: 1fr;
          }

          .content-area {
            padding: 1rem;
          }

          .history-token {
            font-size: 2rem;
          }

          .history-token-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .history-datetime {
            text-align: left;
          }
        }
      `}</style>

      <div className="admin-layout">
        <AdminSidebar isOpen={sidebarOpen} />
        <div className="main-content">
          <AdminNavbar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
            currentPage="history"
          />
          <div className="content-area">
            <div className="history-grid">
              {orders.map((order) => {
                const createdAt = new Date(order.created_at);
                const gst = Math.round(order.total_price * 0.05);
                const basePrice = order.total_price - gst;
                const showDetails = expandedOrders[order.id];

                return (
                  <div key={order.id} className="history-card">
                    <div className="history-header">
                      <span>
                        {(order.name || "USER").toUpperCase()} ORDER COMFORMED
                      </span>
                      <div className="check-icon">✓</div>
                    </div>
                    <div className="history-body">
                      <div className="history-token-section">
                        <div className="history-token-label">Order Number</div>
                        <div className="history-token-info">
                          <div className="history-token">#{order.token_number}</div>
                          <div className="history-datetime">
                            <p>{createdAt.toLocaleDateString()}</p>
                            <p>
                              {createdAt.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p>Call: {order.phone}</p>
                          </div>
                        </div>
                      </div>

                      <div className="history-items-header">
                        <p>Bill Details</p>
                        <button
                          className="details-btn"
                          onClick={() => toggleDetails(order.id)}
                        >
                          Item Details <img src="/down-arrow.svg" alt=">" />
                        </button>
                      </div>

                      {showDetails && (
                        <>
                          <div className="history-items-list">
                            <hr />
                            {order.items?.map((item, idx) => (
                              <div className="history-item" key={idx}>
                                <span>
                                  {item.name} x {item.quantity}
                                </span>
                                <span>₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                            <hr />
                          </div>
                        </>
                      )}

                      <div className="history-item-row">
                        <span>Item Total</span>
                        <span>₹{basePrice}</span>
                      </div>
                      <div className="history-item-row">
                        <span>GST & Other Charges (5%)</span>
                        <span>₹{gst}</span>
                      </div>
                      <hr />
                      <div className="history-total">
                        <span>TOTAL BILL</span>
                        <span>₹{order.total_price}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrdersCompleted;