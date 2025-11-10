import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, Clock, Package, TrendingUp } from "lucide-react";

const AdminSidebar = ({ isOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/admin", label: "Orders", icon: ShoppingBag },
    { path: "/admin/orders-completed", label: "History", icon: Clock },
    { path: "/admin/manage-items", label: "Stock", icon: Package },
    { path: "/admin/sales-summary", label: "Sales", icon: TrendingUp },
  ];

  const isActive = (path) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname === path;
  };

  return (
    <>
      <style>{`
        .admin-sidebar {
          width: ${isOpen ? "250px" : "0"};
          background: white;
          transition: width 0.3s ease;
          overflow: hidden;
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
          min-height: 100vh;
          height: fit-content;
        }

        .sidebar-content {
          width: 250px;
          padding: 2rem 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 4px solid transparent;
          font-family: 'Poppins', sans-serif;
          color: #333;
          text-decoration: none;
        }

        .nav-item:hover {
          background: #f0f0f0;
        }

        .nav-item.active {
          background: #f0f0f0;
          border-left-color: #000;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .admin-sidebar {
            position: fixed;
            z-index: 999;
            height: 100vh;
          }
        }
      `}</style>

      <div className="admin-sidebar">
        <div className="sidebar-content">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;