import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, Clock, Package, TrendingUp } from "lucide-react";

const AdminSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/admin", label: "Orders", icon: ShoppingBag },
    { path: "/admin/orders-completed", label: "History", icon: Clock },
    { path: "/admin/manage-items", label: "Stock", icon: Package },
    { path: "/admin/sales-summary", label: "Sales", icon: TrendingUp },
  ];

  const isActive = (path) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname === path;
  };

  const handleNavClick = (path) => {
    navigate(path);
    // On mobile, close sidebar after navigating
    if (onClose) onClose();
  };

  return (
    <>
      <style>{`
        /* ── Desktop: sticky sidebar that never scrolls ── */
        .admin-sidebar {
          width: 250px;
          min-width: 250px;
          height: 100vh;
          position: sticky;
          top: 0;
          left: 0;
          background: white;
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
          z-index: 200;
          transition: width 0.3s ease, min-width 0.3s ease;
          overflow: hidden;
          flex-shrink: 0;
        }

        .admin-sidebar.collapsed {
          width: 0;
          min-width: 0;
        }

        .sidebar-content {
          width: 250px;
          padding: 1.5rem 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .sidebar-logo {
          padding: 0.5rem 1.5rem 1.5rem;
          border-bottom: 1px solid #f0f0f0;
          margin-bottom: 0.75rem;
        }

        .sidebar-logo-text {
          font-family: 'Poppins', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #000;
          letter-spacing: -0.5px;
        }

        .sidebar-logo-sub {
          font-family: 'Poppins', sans-serif;
          font-size: 0.7rem;
          color: #888;
          font-weight: 400;
          margin-top: 1px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.85rem 1.5rem;
          cursor: pointer;
          transition: all 0.18s ease;
          border-left: 3px solid transparent;
          font-family: 'Poppins', sans-serif;
          font-size: 0.875rem;
          color: #555;
          text-decoration: none;
          user-select: none;
        }

        .nav-item:hover {
          background: #f7f7f7;
          color: #000;
        }

        .nav-item.active {
          background: #f0f0f0;
          border-left-color: #000;
          color: #000;
          font-weight: 600;
        }

        .nav-item .nav-icon {
          flex-shrink: 0;
          opacity: 0.7;
        }

        .nav-item.active .nav-icon,
        .nav-item:hover .nav-icon {
          opacity: 1;
        }

        /* ── Mobile overlay backdrop ── */
        .sidebar-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 299;
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }

        /* ── Mobile styles ── */
        @media (max-width: 768px) {
          /* On mobile the sidebar is always out of flow — overlay mode */
          .admin-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100dvh;
            z-index: 300;
            transform: translateX(-100%);
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
            width: 240px !important;
            min-width: 240px !important;
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
          }

          .admin-sidebar.mobile-open {
            transform: translateX(0);
            animation: slideIn 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          }

          /* Hide collapsed logic on mobile — use transform instead */
          .admin-sidebar.collapsed {
            width: 240px !important;
            min-width: 240px !important;
          }

          .sidebar-backdrop.visible {
            display: block;
          }
        }
      `}</style>

      {/* Backdrop — only renders on mobile when open */}
      <div
        className={`sidebar-backdrop ${isOpen ? "visible" : ""}`}
        onClick={onClose}
      />

      <div className={`admin-sidebar ${!isOpen ? "collapsed" : ""} ${isOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-content">
          <div className="sidebar-logo">
            <div className="sidebar-logo-text">Avneet Caafe</div>
            <div className="sidebar-logo-sub">Admin Dashboard</div>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                onClick={() => handleNavClick(item.path)}
              >
                <Icon size={18} className="nav-icon" />
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