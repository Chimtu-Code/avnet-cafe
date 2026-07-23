import React, { useState, useEffect } from "react";
import { supabase } from "../../../shared/services/supabaseClient";
import AdminNavbar from "../components/AdminNavbar";
import { ShoppingBag } from "lucide-react";
import { calcGST, GST_LABEL } from "../../../shared/utils/gst";

const SHARED = `
  * { margin:0; padding:0; box-sizing:border-box; }
  .admin-page { display:flex; width:100vw; flex-direction:column; height:100vh; overflow:hidden; background:#f5f5f5; font-family:'Poppins',sans-serif; }
  .page-body { flex:1; overflow-y:auto; padding:1.75rem 2rem; -webkit-overflow-scrolling:touch; }
  .cards-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:1.25rem; width:100%; }
  .meals-grid { display:flex; flex-direction:column; gap:1.25rem; }
  .meal-section { background:transparent; }
  .meal-title { font-size:0.95rem; font-weight:700; color:#222; margin:0 0 .6rem 0; font-family:'Poppins',sans-serif; }
  .meal-tabs { display:flex; gap:0.5rem; margin-bottom:1rem; }
  .meal-tab { padding:.5rem .75rem; border-radius:8px; border:1px solid transparent; background:transparent; cursor:pointer; font-weight:600; font-family:inherit; }
  .meal-tab.active { background:#000; color:#fff; border-color:#000; }
  .empty-state { grid-column:1/-1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:5rem 2rem; color:#ccc; gap:.75rem; }
  .empty-state p { color:#aaa; font-size:.92rem; }
  .a-card { background:#fff; border-radius:12px; box-shadow:0 1px 5px rgba(0,0,0,.08); overflow:hidden; transition:box-shadow .2s; }
  .a-card:hover { box-shadow:0 4px 18px rgba(0,0,0,.13); }
  .card-top { background:#000; color:#fff; padding:.65rem 1rem; display:flex; justify-content:space-between; align-items:center; gap:.5rem; font-size:.78rem; font-weight:500; line-height:1.3; }
  .card-top span { flex:1; }
  .chk-wrap { position:relative; width:22px; height:22px; flex-shrink:0; cursor:pointer; }
  .chk-wrap input { opacity:0; width:0; height:0; position:absolute; }
  .chk-mark { position:absolute; inset:0; background:#fff; border-radius:4px; transition:background .22s; }
  .chk-mark:after { content:""; position:absolute; display:none; left:7px; top:3px; width:5px; height:11px; border:solid #fff; border-width:0 2px 2px 0; transform:rotate(45deg); }
  .chk-wrap input:checked ~ .chk-mark { background:#4caf50; }
  .chk-wrap input:checked ~ .chk-mark:after { display:block; }
  .token-block { padding:1rem; border-bottom:2px dotted #4caf50; }
  .token-label { font-size:.72rem; font-weight:600; color:#555; margin-bottom:.35rem; text-transform:uppercase; letter-spacing:.3px; }
  .token-row { display:flex; justify-content:space-between; align-items:center; }
  .token-num { font-family:sans-serif; font-size:2.2rem; font-weight:800; color:#000; line-height:1; }
  .token-meta { font-size:.74rem; color:#555; text-align:right; line-height:1.75; }
  .bill-block { padding:1rem; display:flex; flex-direction:column; gap:.4rem; }
  .bill-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:.1rem; }
  .bill-head p { font-weight:600; font-size:.875rem; }
  .expand-btn { border:none; background:none; color:#888; font-size:.7rem; cursor:pointer; font-family:inherit; padding:0; }
  .bill-items { display:flex; flex-direction:column; gap:.3rem; margin:.2rem 0; }
  .bill-item { display:flex; justify-content:space-between; padding:.42rem .6rem; border-radius:6px; background:#f7f7f7; font-size:.8rem; }
  .bill-row { display:flex; justify-content:space-between; font-size:.82rem; color:#555; }
  .bill-total { display:flex; justify-content:space-between; font-size:.9rem; font-weight:700; color:#000; padding-top:.25rem; }
  .bill-sep { border:none; border-top:1px solid #ebebeb; margin:.3rem 0; }
  .overlay { position:fixed; inset:0; background:rgba(0,0,0,.48); display:flex; align-items:center; justify-content:center; z-index:500; padding:1rem; }
  .modal-box { background:#fff; border-radius:14px; padding:1.65rem; width:100%; max-width:380px; }
  .modal-box h3 { font-size:1rem; font-weight:600; margin-bottom:.6rem; }
  .modal-box p { font-size:.875rem; color:#555; margin-bottom:1.25rem; line-height:1.5; }
  .modal-actions { display:flex; gap:.65rem; }
  .btn-c,.btn-k { flex:1; padding:.72rem; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-family:inherit; font-size:.875rem; transition:all .2s; }
  .btn-c { background:#f0f0f0; }
  .btn-c:hover { background:#e0e0e0; }
  .btn-k { background:#000; color:#fff; }
  .btn-k:hover { background:#222; }
  @media (max-width:768px) { .page-body { padding:1rem; } .cards-grid { grid-template-columns:1fr; } .token-num { font-size:1.9rem; } }
`;

const OrdersPending = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [activeMeal, setActiveMeal] = useState("dinner");

  useEffect(() => {
    fetchOrders();
    const ch = supabase
      .channel("pending-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          if (payload.new.status === "pending")
            setOrders((prev) => [payload.new, ...prev]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          if (payload.new.status === "completed")
            setOrders((prev) => prev.filter((o) => o.id !== payload.new.id));
        },
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (!error && data) setOrders(data);
  };

  const confirmComplete = async () => {
    if (!selectedOrder) return;
    const { error } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", selectedOrder.id);
    if (!error) {
      setOrders((p) => p.filter((o) => o.id !== selectedOrder.id));
      setShowModal(false);
      setSelectedOrder(null);
    }
  };

  return (
    <>
      <style>{SHARED}</style>
      <div className="admin-page">
        <AdminNavbar currentPage="orders" />
        <div className="page-body">
          {/* Meal tabs */}
          <div className="meal-tabs">
            {[
              { key: "breakfast", label: "BREAKFAST" },
              { key: "lunch", label: "LUNCH" },
              { key: "snacks", label: "SNACKS" },
              { key: "dinner", label: "DINNER" },
            ].map((m) => (
              <button
                key={m.key}
                className={`meal-tab ${activeMeal === m.key ? "active" : ""}`}
                onClick={() => setActiveMeal(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="meals-grid">
            {[
              { key: "breakfast", label: "BREAKFAST" },
              { key: "lunch", label: "LUNCH" },
              { key: "snacks", label: "SNACKS" },
              { key: "dinner", label: "DINNER" },
            ]
              .filter((meal) => meal.key === activeMeal)
              .map((meal) => (
                <section className="meal-section" key={meal.key}>
                  <h3 className="meal-title">{meal.label}</h3>
                  <div className="cards-grid">
                    {/* For now all orders go under Dinner */}
                    {meal.key !== "dinner" ? (
                      <div className="empty-state">
                        <ShoppingBag size={48} />
                        <p>No pending orders for {meal.label.toLowerCase()}</p>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="empty-state">
                        <ShoppingBag size={52} />
                        <p>No pending orders</p>
                      </div>
                    ) : (
                      orders.map((order) => {
                        const t = new Date(order.created_at);
                        const base =
                          order.total_price - calcGST(order.total_price);
                        const gst = calcGST(order.total_price);
                        return (
                          <div key={order.id} className="a-card">
                            <div className="card-top">
                              <span>
                                {(order.name || "USER").toUpperCase()} ORDER
                                CONFIRMED
                              </span>
                              <label className="chk-wrap">
                                <input
                                  type="checkbox"
                                  onChange={() => {
                                    setSelectedOrder(order);
                                    setShowModal(true);
                                  }}
                                />
                                <span className="chk-mark" />
                              </label>
                            </div>
                            <div className="token-block">
                              <p className="token-label">Order Number</p>
                              <div className="token-row">
                                <p className="token-num">
                                  #{order.token_number}
                                </p>
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
                                <span>GST ({GST_LABEL})</span>
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
                </section>
              ))}
          </div>
        </div>
      </div>
      {showModal && selectedOrder && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Order Complete</h3>
            <p>
              Mark order <strong>#{selectedOrder.token_number}</strong> for{" "}
              <strong>{selectedOrder.name}</strong> as completed?
            </p>
            <div className="modal-actions">
              <button className="btn-c" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-k" onClick={confirmComplete}>
                ✓ Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrdersPending;
