import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { ShoppingBag } from "lucide-react";

const OrdersPending = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
  };

  const handleToggleComplete = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const confirmComplete = async () => {
    if (!selectedOrder) return;

    const { error } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", selectedOrder.id);

    if (!error) {
      setShowModal(false);
      setSelectedOrder(null);
      fetchOrders();
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
        }

        .content-area {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .orders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
          max-width: 1400px;
        }

        .user-token {
          width: 100%;
          position: relative;
          border-radius: 0.625rem;
          box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.25);
          background: white;
        }

        .user-name {
          color: #ffffff;
          background-color: black;
          font-family: Poppins;
          font-size: 0.875rem;
          font-style: normal;
          font-weight: 500;
          line-height: normal;
          padding: 0.5rem 0.8rem;
          border-top-right-radius: inherit;
          border-top-left-radius: inherit;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .checkbox-container {
          position: relative;
          cursor: pointer;
          width: 24px;
          height: 24px;
        }

        .checkbox-container input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .checkmark {
          position: absolute;
          top: 0;
          left: 0;
          height: 24px;
          width: 24px;
          background-color: white;
          border-radius: 4px;
          transition: all 0.3s;
        }

        .checkbox-container input:checked ~ .checkmark {
          background-color: #4caf50;
        }

        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
          left: 8px;
          top: 4px;
          width: 6px;
          height: 12px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .checkbox-container input:checked ~ .checkmark:after {
          display: block;
        }

        .user-token-details {
          width: 100%;
          padding: 1rem 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          border-bottom: 2px dotted green;
        }

        .user-token-details section {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .user-token-greet {
          color: #000;
          font-family: Poppins;
          font-size: 1rem;
          font-style: normal;
          font-weight: 600;
          line-height: normal;
        }

        .user-token-number {
          color: #000;
          font-family: sans-serif;
          font-size: 2.5rem;
          font-style: normal;
          font-weight: 800;
          line-height: normal;
        }

        .user-token-timings {
          color: #000;
          font-family: Poppins;
          font-size: 1rem;
          font-style: normal;
          font-weight: 400;
          line-height: normal;
          text-align: right;
        }

        .user-bill-details {
          width: 100%;
          padding: 1rem 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .user-bill-details header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .user-bill-details header p {
          color: #000;
          font-family: Poppins;
          font-size: 1rem;
          font-style: normal;
          font-weight: 500;
          line-height: normal;
        }

        .user-bill-details header button {
          border: none;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.2rem;
          color: #78787a;
          font-family: Roboto;
          font-size: 0.625rem;
          font-style: normal;
          font-weight: 400;
          line-height: normal;
          background-color: #ffffff;
          cursor: pointer;
        }

        .user-ordered-items {
          width: 100%;
          display: flex;
          align-items: center;
          flex-direction: column;
          gap: 0.4rem;
        }

        .user-ordered-item {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          border-radius: 0.625rem;
          background-color: #f7f7f7;
        }

        .user-bill-total,
        .user-bill-gst,
        .user-bill-to-pay {
          display: flex;
          justify-content: space-between;
          color: #282828;
          font-family: Roboto;
          font-size: 0.875rem;
          font-style: normal;
          font-weight: 400;
          line-height: normal;
        }

        .user-bill-to-pay {
          color: #282828;
          font-family: Roboto;
          font-size: 1rem;
          font-style: normal;
          font-weight: 700;
          line-height: normal;
        }

        hr {
          border: none;
          border-top: 1px solid #e0e0e0;
          margin: 0.5rem 0;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          max-width: 400px;
          width: 90%;
        }

        .modal-content h3 {
          margin-bottom: 1rem;
          font-size: 1.25rem;
        }

        .modal-content p {
          margin-bottom: 1.5rem;
          color: #666;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-cancel,
        .btn-confirm {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-family: inherit;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: #f0f0f0;
        }

        .btn-confirm {
          background: black;
          color: white;
        }

        .btn-cancel:hover {
          background: #e0e0e0;
        }

        .btn-confirm:hover {
          background: #333;
        }

        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          color: #999;
        }

        .empty-state p {
          margin-top: 1rem;
          font-size: 1.125rem;
        }

        @media (max-width: 768px) {
          .orders-grid {
            grid-template-columns: 1fr;
          }

          .content-area {
            padding: 1rem;
          }
        }
      `}</style>

      <div className="admin-layout">
        <AdminSidebar isOpen={sidebarOpen} />
        <div className="main-content">
          <AdminNavbar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
            currentPage="orders"
          />
          <div className="content-area">
            <div className="orders-grid">
              {orders.length === 0 ? (
                <div className="empty-state">
                  <ShoppingBag size={64} />
                  <p>No pending orders</p>
                </div>
              ) : (
                orders.map((order) => {
                  const createdAt = new Date(order.created_at);
                  const gst = Math.round(order.total_price * 0.05);
                  const basePrice = order.total_price - gst;
                  const showDetails = expandedOrders[order.id];

                  return (
                    <div key={order.id} className="user-token">
                      <p className="user-name">
                        {(order.name || "USER").toUpperCase()} ORDER CONFIRMED
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            onChange={() => handleToggleComplete(order)}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </p>
                      <div className="user-token-details">
                        <p className="user-token-greet">Order Number</p>
                        <section>
                          <p className="user-token-number">
                            #{order.token_number}
                          </p>
                          <div className="user-token-timings">
                            <p>{createdAt.toLocaleDateString()}</p>
                            <p>
                              {createdAt.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p>Call: {order.phone}</p>
                          </div>
                        </section>
                      </div>
                      <div className="user-bill-details">
                        <header>
                          <p>Bill Details</p>
                          <button onClick={() => toggleDetails(order.id)}>
                            Item Details{" "}
                            <img src="/down-arrow.svg" alt=">" />
                          </button>
                        </header>
                        {showDetails && (
                          <div className="user-ordered-items">
                            <hr />
                            {order.items?.map((item, idx) => (
                              <div className="user-ordered-item" key={idx}>
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
                          <p>₹{basePrice}</p>
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
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Order Completion</h3>
            <p>Mark order #{selectedOrder.token_number} as completed?</p>
            <div className="modal-actions">
              <button onClick={() => setShowModal(false)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={confirmComplete} className="btn-confirm">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrdersPending;