import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";

const SalesSummary = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [salesData, setSalesData] = useState({
    today: { sales: 0, gst: 0, totalSales: 0, orderCount: 0, orders: [] },
    yesterday: { sales: 0, gst: 0, totalSales: 0, orderCount: 0, orders: [] },
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState(null);

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

    // Fetch today's orders
    const { data: todayOrders } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "completed")
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString());

    // Fetch yesterday's orders
    const { data: yesterdayOrders } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "completed")
      .gte("created_at", yesterday.toISOString())
      .lt("created_at", today.toISOString());

    const calculateSales = (orders) => {
      const totalSales =
        orders?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;
      const gst = Math.round(totalSales * 0.05);
      const sales = totalSales - gst;
      return {
        sales,
        gst,
        totalSales,
        orderCount: orders?.length || 0,
        orders: orders || [],
      };
    };

    setSalesData({
      today: calculateSales(todayOrders),
      yesterday: calculateSales(yesterdayOrders),
    });
  };

  const handleSeeDetails = (dayData, dayLabel) => {
    setSelectedDayData({ ...dayData, label: dayLabel });
    setShowDetailsModal(true);
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

        .sales-content {
          max-width: 1400px;
          width: 100%;
        }

        .sales-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
          width: 100%;
        }

        .sales-card {
          background: white;
          border-radius: 10px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .sales-card.highlighted {
          border: 2px solid #2196f3;
        }

        .sales-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .sales-card-title {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .sales-card-date {
          font-size: 0.875rem;
          color: #666;
        }

        .sales-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #000;
        }

        .order-count {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 1rem;
        }

        .sales-total {
          padding-top: 1rem;
          border-top: 2px solid #f0f0f0;
          margin-bottom: 1.5rem;
        }

        .sales-total-label {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.5rem;
        }

        .sales-total-value {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .btn-see-details {
          width: 100%;
          padding: 0.875rem;
          background: black;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-family: inherit;
          transition: background 0.2s;
        }

        .btn-see-details:hover {
          background: #333;
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
          max-width: 800px;
          width: 90%;
          max-height: 85vh;
          overflow-y: auto;
        }

        .modal-content h3 {
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }

        .sales-summary {
          background: #f5f5f5;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1.5rem;
        }

        .summary-item {
          text-align: center;
        }

        .summary-label {
          font-size: 0.75rem;
          color: #666;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .orders-list-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .orders-list {
          max-height: 400px;
          overflow-y: auto;
          margin-bottom: 1.5rem;
        }

        .order-summary-card {
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 0.75rem;
        }

        .order-summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .order-summary-token {
          font-weight: 600;
          font-size: 1.125rem;
        }

        .order-summary-amount {
          font-weight: 700;
          color: #4caf50;
          font-size: 1.125rem;
        }

        .order-summary-info {
          font-size: 0.875rem;
          color: #666;
        }

        .btn-close {
          width: 100%;
          padding: 0.875rem;
          background: #f0f0f0;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-family: inherit;
          transition: background 0.2s;
        }

        .btn-close:hover {
          background: #e0e0e0;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: #999;
        }

        @media (max-width: 768px) {
          .content-area {
            padding: 1rem;
          }

          .sales-cards {
            grid-template-columns: 1fr;
          }

          .sales-stats {
            grid-template-columns: 1fr;
          }

          .sales-summary {
            grid-template-columns: 1fr;
          }

          .modal-content {
            width: 95%;
            max-height: 90vh;
            padding: 1.5rem;
          }
        }
      `}</style>

      <div className="admin-layout">
        <AdminSidebar isOpen={sidebarOpen} />
        <div className="main-content">
          <AdminNavbar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
            currentPage="sales"
          />
          <div className="content-area">
            <div className="sales-content">
              <div className="sales-cards">
                {/* Today's Sales */}
                <div className="sales-card highlighted">
                <div className="sales-card-header">
                  <span className="sales-card-title">Business</span>
                  <span className="sales-card-date">Today</span>
                </div>

                <div className="sales-stats">
                  <div className="stat-item">
                    <span className="stat-label">Sales</span>
                    <span className="stat-value">₹{salesData.today.sales}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">GST</span>
                    <span className="stat-value">{salesData.today.gst}</span>
                  </div>
                </div>

                <div className="order-count">
                  {salesData.today.orderCount} Orders
                </div>

                <div className="sales-total">
                  <div className="sales-total-label">Total Sales:</div>
                  <div className="sales-total-value">
                    ₹{salesData.today.totalSales}
                  </div>
                </div>

                <button
                  className="btn-see-details"
                  onClick={() => handleSeeDetails(salesData.today, "Today")}
                >
                  See Details
                </button>
              </div>

              {/* Yesterday's Sales */}
              <div className="sales-card">
                <div className="sales-card-header">
                  <span className="sales-card-title">Business</span>
                  <span className="sales-card-date">
                    {new Date(Date.now() - 86400000).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "short" }
                    )}
                  </span>
                </div>

                <div className="sales-stats">
                  <div className="stat-item">
                    <span className="stat-label">Sales</span>
                    <span className="stat-value">
                      ₹{salesData.yesterday.sales}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">GST</span>
                    <span className="stat-value">{salesData.yesterday.gst}</span>
                  </div>
                </div>

                <div className="order-count">
                  {salesData.yesterday.orderCount} Orders
                </div>

                <div className="sales-total">
                  <div className="sales-total-label">Total Sales:</div>
                  <div className="sales-total-value">
                    ₹{salesData.yesterday.totalSales}
                  </div>
                </div>

                <button
                  className="btn-see-details"
                  onClick={() =>
                    handleSeeDetails(
                      salesData.yesterday,
                      new Date(Date.now() - 86400000).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "long" }
                      )
                    )
                  }
                >
                  See Details
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedDayData && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailsModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Business - {selectedDayData.label}</h3>

            <div className="sales-summary">
              <div className="summary-item">
                <div className="summary-label">Total Revenue</div>
                <div className="summary-value">
                  ₹{selectedDayData.totalSales}
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-label">GST Collected</div>
                <div className="summary-value">₹{selectedDayData.gst}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Total Orders</div>
                <div className="summary-value">
                  {selectedDayData.orderCount}
                </div>
              </div>
            </div>

            <h4 className="orders-list-title">Orders List</h4>
            <div className="orders-list">
              {selectedDayData.orders && selectedDayData.orders.length > 0 ? (
                selectedDayData.orders.map((order) => {
                  const orderTime = new Date(order.created_at);
                  return (
                    <div key={order.id} className="order-summary-card">
                      <div className="order-summary-header">
                        <span className="order-summary-token">
                          #{order.token_number}
                        </span>
                        <span className="order-summary-amount">
                          ₹{order.total_price}
                        </span>
                      </div>
                      <div className="order-summary-info">
                        {order.name} •{" "}
                        {orderTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        • {order.items?.length || 0} items
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <p>No orders for this day</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDetailsModal(false)}
              className="btn-close"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SalesSummary;