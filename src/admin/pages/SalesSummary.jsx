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
    height: 100vh;
    overflow: hidden;
    width:100vw;
    background: #f5f5f5;
    font-family: 'Poppins', sans-serif;
  }
  .page-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.75rem 2rem;
    -webkit-overflow-scrolling: touch;
  }
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
    width: 100%;
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
  .a-card.highlighted {
    box-shadow: 0 0 0 2px #2196f3, 0 4px 18px rgba(33,150,243,.15);
  }
  .card-top {
    background: #000;
    color: #fff;
    padding: .65rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: .78rem;
    font-weight: 500;
    line-height: 1.3;
  }
  .sales-body {
    padding: 1.1rem 1rem;
    border-bottom: 2px dotted #4caf50;
  }
  .sales-stats {
    display: flex;
    gap: 2rem;
    margin-bottom: .85rem;
  }
  .stat-lbl {
    font-size: .72rem;
    color: #777;
    margin-bottom: .25rem;
    text-transform: uppercase;
    letter-spacing: .3px;
  }
  .stat-val {
    font-size: 1.6rem;
    font-weight: 700;
    color: #000;
  }
  .order-count {
    font-size: .875rem;
    font-weight: 600;
    color: #333;
  }
  .sales-foot {
    padding: 1rem;
  }
  .sales-total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: .9rem;
  }
  .sales-total-lbl {
    font-size: .78rem;
    color: #777;
    text-transform: uppercase;
    letter-spacing: .3px;
  }
  .sales-total-val {
    font-size: 1.2rem;
    font-weight: 700;
    color: #000;
  }
  .btn-detail {
    width: 100%;
    padding: .8rem;
    background: #000;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-family: inherit;
    font-size: .875rem;
    transition: background .2s;
  }
  .btn-detail:hover {
    background: #222;
  }
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.48);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 500;
    padding: 1rem;
  }
  .modal-box {
    background: #fff;
    border-radius: 14px;
    padding: 1.75rem;
    width: 100%;
    max-width: 640px;
    max-height: 88vh;
    overflow-y: auto;
  }
  .modal-box h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 1.25rem;
  }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    background: #f5f5f5;
    border-radius: 10px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }
  .sum-item {
    text-align: center;
  }
  .sum-lbl {
    font-size: .7rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: .4px;
    margin-bottom: .35rem;
  }
  .sum-val {
    font-size: 1.4rem;
    font-weight: 700;
    color: #111;
  }
  .orders-list-title {
    font-size: .9rem;
    font-weight: 600;
    margin-bottom: .75rem;
    color: #333;
  }
  .orders-list {
    display: flex;
    flex-direction: column;
    gap: .6rem;
    margin-bottom: 1.5rem;
  }
  .order-row {
    background: #f9f9f9;
    border-radius: 8px;
    padding: .85rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .order-row-left .token {
    font-weight: 700;
    font-size: 1rem;
  }
  .order-row-left .meta {
    font-size: .75rem;
    color: #777;
    margin-top: .15rem;
  }
  .order-row-amt {
    font-weight: 700;
    color: #4caf50;
    font-size: 1rem;
  }
  .btn-close {
    width: 100%;
    padding: .78rem;
    background: #f0f0f0;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-family: inherit;
    transition: background .2s;
  }
  .btn-close:hover {
    background: #e0e0e0;
  }
  .no-data {
    text-align: center;
    padding: 2rem;
    color: #aaa;
    font-size: .875rem;
  }
  @media (max-width: 768px) {
    .page-body {
      padding: 1rem;
    }
    .cards-grid {
      grid-template-columns: 1fr;
    }
    .summary-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const SalesSummary = () => {
  const [salesData, setSalesData] = useState({
    today: { sales: 0, gst: 0, totalSales: 0, orderCount: 0, orders: [] },
    yesterday: { sales: 0, gst: 0, totalSales: 0, orderCount: 0, orders: [] },
  });
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [{ data: tod }, { data: yes }] = await Promise.all([
      supabase
        .from("orders")
        .select("*")
        .eq("status", "completed")
        .gte("created_at", today.toISOString())
        .lt("created_at", tomorrow.toISOString()),
      supabase
        .from("orders")
        .select("*")
        .eq("status", "completed")
        .gte("created_at", yesterday.toISOString())
        .lt("created_at", today.toISOString()),
    ]);

    const calc = (rows) => {
      const totalSales =
        rows?.reduce((s, o) => s + Number(o.total_price), 0) || 0;
      const gst = Math.round(totalSales * 0.05);
      const sales = totalSales - gst;
      return {
        sales,
        gst,
        totalSales,
        orderCount: rows?.length || 0,
        orders: rows || [],
      };
    };
    setSalesData({ today: calc(tod), yesterday: calc(yes) });
  };

  const openModal = (data, label) => {
    setModalData({ ...data, label });
    setShowModal(true);
  };

  const cards = [
    { key: "today", label: "TODAY", data: salesData.today, highlight: true },
    {
      key: "yesterday",
      label: new Date(Date.now() - 86400000)
        .toLocaleDateString("en-GB", { day: "numeric", month: "short" })
        .toUpperCase(),
      data: salesData.yesterday,
      highlight: false,
    },
  ];

  return (
    <>
      <style>{SHARED}</style>
      <div className="admin-page">
        <AdminNavbar currentPage="sales" />
        <div className="page-body">
          <div className="cards-grid">
            {cards.map(({ key, label, data, highlight }) => (
              <div
                key={key}
                className={`a-card ${highlight ? "highlighted" : ""}`}
              >
                <div className="card-top">
                  <span>BUSINESS</span>
                  <span>{label}</span>
                </div>
                <div className="sales-body">
                  <div className="sales-stats">
                    <div>
                      <p className="stat-lbl">Sales</p>
                      <p className="stat-val">₹{data.sales}</p>
                    </div>
                    <div>
                      <p className="stat-lbl">GST</p>
                      <p className="stat-val">₹{data.gst}</p>
                    </div>
                  </div>
                  <p className="order-count">{data.orderCount} Orders</p>
                </div>
                <div className="sales-foot">
                  <div className="sales-total-row">
                    <span className="sales-total-lbl">Total Sales</span>
                    <span className="sales-total-val">₹{data.totalSales}</span>
                  </div>
                  <button
                    className="btn-detail"
                    onClick={() =>
                      openModal(
                        data,
                        label === "TODAY"
                          ? "Today"
                          : new Date(Date.now() - 86400000).toLocaleDateString(
                              "en-GB",
                              { day: "numeric", month: "long" },
                            ),
                      )
                    }
                  >
                    See Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && modalData && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Business — {modalData.label}</h3>
            <div className="summary-grid">
              <div className="sum-item">
                <p className="sum-lbl">Revenue</p>
                <p className="sum-val">₹{modalData.totalSales}</p>
              </div>
              <div className="sum-item">
                <p className="sum-lbl">GST</p>
                <p className="sum-val">₹{modalData.gst}</p>
              </div>
              <div className="sum-item">
                <p className="sum-lbl">Orders</p>
                <p className="sum-val">{modalData.orderCount}</p>
              </div>
            </div>
            <p className="orders-list-title">Orders</p>
            <div className="orders-list">
              {modalData.orders.length > 0 ? (
                modalData.orders.map((o) => {
                  const t = new Date(o.created_at);
                  return (
                    <div key={o.id} className="order-row">
                      <div className="order-row-left">
                        <p className="token">#{o.token_number}</p>
                        <p className="meta">
                          {o.name} ·{" "}
                          {t.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {o.items?.length || 0} items
                        </p>
                      </div>
                      <p className="order-row-amt">₹{o.total_price}</p>
                    </div>
                  );
                })
              ) : (
                <p className="no-data">No orders for this day</p>
              )}
            </div>
            <button className="btn-close" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SalesSummary;
