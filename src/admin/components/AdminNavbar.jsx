import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "../../services/supabaseClient";

const AdminNavbar = ({ onToggleSidebar, sidebarOpen, currentPage }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    const { data, error } = await supabase
      .from("restaurant_settings")
      .select("is_open")
      .eq("id", 1)
      .single();

    if (!error && data) {
      setIsOpen(data.is_open);
    }
    setLoading(false);
  };

  const toggleStatus = async () => {
    const newStatus = !isOpen;
    setIsOpen(newStatus);

    const { error } = await supabase
      .from("restaurant_settings")
      .update({ is_open: newStatus })
      .eq("id", 1);

    if (error) {
      console.error("Error updating status:", error);
      setIsOpen(!newStatus);
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case "orders":
        return "Orders";
      case "history":
        return "History";
      case "stock":
        return "Stock";
      case "sales":
        return "Sales";
      default:
        return "Dashboard";
    }
  };

  return (
    <>
      <style>{`
        .admin-navbar {
          background: white;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .nav-center {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .status-text {
          font-family: 'Poppins', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          color: ${isOpen ? '#4caf50' : '#f44336'};
        }

        .toggle-switch {
          position: relative;
          width: 50px;
          height: 26px;
          cursor: pointer;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          border-radius: 26px;
          transition: 0.4s;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          border-radius: 50%;
          transition: 0.4s;
        }

        .toggle-switch input:checked + .toggle-slider {
          background-color: #4caf50;
        }

        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }

        .toggle-slider.loading {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .menu-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .menu-btn:hover {
          background: #f0f0f0;
        }

        .page-title {
          font-size: 1.25rem;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          color: #000;
        }

        .nav-right {
          font-size: 0.875rem;
          color: #666;
          font-family: 'Poppins', sans-serif;
        }

        @media (max-width: 768px) {
          .admin-navbar {
            padding: 1rem;
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .page-title {
            font-size: 1rem;
          }

          .nav-right {
            font-size: 0.75rem;
          }

          .nav-center {
            order: 3;
            width: 100%;
            justify-content: center;
            margin-top: 0.5rem;
          }
        }
      `}</style>

      <div className="admin-navbar">
        <div className="nav-left">
          <button className="menu-btn" onClick={onToggleSidebar}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className="page-title">{getPageTitle()}</span>
        </div>
        <div className="nav-center">
          <span className="status-text">{isOpen ? "OPEN" : "CLOSED"}</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isOpen}
              onChange={toggleStatus}
              disabled={loading}
            />
            <span className={`toggle-slider ${loading ? 'loading' : ''}`}></span>
          </label>
        </div>
        <div className="nav-right">
          {currentTime.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
          })}
          ,{" "}
          {currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </div>
      </div>
    </>
  );
};

export default AdminNavbar;