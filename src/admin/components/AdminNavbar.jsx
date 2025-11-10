import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const AdminNavbar = ({ onToggleSidebar, sidebarOpen, currentPage }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
          }

          .page-title {
            font-size: 1rem;
          }

          .nav-right {
            font-size: 0.75rem;
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