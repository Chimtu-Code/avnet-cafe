import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import AdminNavbar from "../components/AdminNavbar";

const SHARED = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .admin-page {
    display: flex;
    flex-direction: column;
    width:100vw;
    height: 100vh;
    overflow: hidden;
    background: #f5f5f5;
    font-family: 'Poppins', sans-serif;
  }
  .page-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.75rem 2rem;
    -webkit-overflow-scrolling: touch;
  }
  .page-heading {
    font-size: 1.15rem;
    font-weight: 600;
    color: #111;
    margin-bottom: 1.5rem;
  }
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 1.25rem;
    width: 100%;
  }
  .empty-state {
    grid-column: 1/-1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    color: #ccc;
    gap: .75rem;
  }
  .empty-state p {
    color: #aaa;
    font-size: .92rem;
  }
  .a-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 5px rgba(0,0,0,.08);
    overflow: hidden;
    transition: box-shadow .2s;
  }
  .a-card:hover {
    box-shadow: 0 4px 18px rgba(0,0,0,.13);
  }
  .card-top {
    background: #000;
    color: #fff;
    padding: .65rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: .5rem;
    font-size: .78rem;
    font-weight: 500;
    line-height: 1.3;
  }
  .card-top span {
    flex: 1;
  }
  .check-badge {
    width: 22px;
    height: 22px;
    background: #4caf50;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .token-block {
    padding: 1rem;
    border-bottom: 2px dotted #4caf50;
  }
  .token-label {
    font-size: .72rem;
    font-weight: 600;
    color: #555;
    margin-bottom: .35rem;
    text-transform: uppercase;
    letter-spacing: .3px;
  }
  .token-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .token-num {
    font-family: sans-serif;
    font-size: 2.2rem;
    font-weight: 800;
    color: #000;
    line-height: 1;
  }
  .token-meta {
    font-size: .74rem;
    color: #555;
    text-align: right;
    line-height: 1.75;
  }
  .bill-block {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: .4rem;
  }
  .bill-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: .1rem;
  }
  .bill-head p {
    font-weight: 600;
    font-size: .875rem;
  }
  .expand-btn {
    border: none;
    background: none;
    color: #888;
    font-size: .7rem;
    cursor: pointer;
    font-family: inherit;
    padding: 0;
  }
  .bill-items {
    display: flex;
    flex-direction: column;
    gap: .3rem;
    margin: .2rem 0;
  }
  .bill-item {
    display: flex;
    justify-content: space-between;
    padding: .42rem .6rem;
    border-radius: 6px;
    background: #f7f7f7;
    font-size: .8rem;
  }
  .bill-row {
    display: flex;
    justify-content: space-between;
    font-size: .82rem;
    color: #555;
  }
  .bill-total {
    display: flex;
    justify-content: space-between;
    font-size: .9rem;
    font-weight: 700;
    color: #000;
    padding-top: .25rem;
  }
  .bill-sep {
    border: none;
    border-top: 1px solid #ebebeb;
    margin: .3rem 0;
  }
  @media (max-width: 768px) {
    .page-body {
      padding: 1rem;
    }
    .cards-grid {
      grid-template-columns: 1fr;
    }
    .token-num {
      font-size: 1.9rem;
    }
  }
`;

const OrdersCompleted = () => {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false });
    if (!error && data) setOrders(data);
  };

  return (
    <>
      <style>{SHARED}</style>
      <div className="admin-page">
        <AdminNavbar currentPage="history" />
        <div className="page-body">
          <div className="cards-grid">
            {orders.length === 0 ? (
              <div className="empty-state">
                <p>No completed orders yet</p>
              </div>
            ) : (
              orders.map((order) => {
                const t = new Date(order.created_at);
                const gst = Math.round(order.total_price * 0.05);
                const base = order.total_price - gst;
                return (
                  <div key={order.id} className="a-card">
                    <div className="card-top">
                      <span>
                        {(order.name || "USER").toUpperCase()} ORDER CONFIRMED
                      </span>
                      <div className="check-badge">✓</div>
                    </div>
                    <div className="token-block">
                      <p className="token-label">Order Number</p>
                      <div className="token-row">
                        <p className="token-num">#{order.token_number}</p>
                        <div className="token-meta">
                          <p>{t.toLocaleDateString()}</p>
                          <p>
                            {t.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p>📞 {order.phone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bill-block">
                      <div className="bill-head">
                        <p>Bill Details</p>
                        <button
                          className="expand-btn"
                          onClick={() =>
                            setExpanded((p) => ({
                              ...p,
                              [order.id]: !p[order.id],
                            }))
                          }
                        >
                          Item Details ▾
                        </button>
                      </div>
                      {expanded[order.id] && (
                        <div className="bill-items">
                          <hr className="bill-sep" />
                          {order.items?.map((item, i) => (
                            <div key={i} className="bill-item">
                              <span>
                                {item.name} × {item.quantity}
                              </span>
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                          <hr className="bill-sep" />
                        </div>
                      )}
                      <div className="bill-row">
                        <span>Item Total</span>
                        <span>₹{base}</span>
                      </div>
                      <div className="bill-row">
                        <span>GST (5%)</span>
                        <span>₹{gst}</span>
                      </div>
                      <hr className="bill-sep" />
                      <div className="bill-total">
                        <span>TOTAL BILL</span>
                        <span>₹{order.total_price}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OrdersCompleted;
