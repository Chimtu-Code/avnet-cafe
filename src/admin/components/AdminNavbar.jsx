import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import { broadcastStatusUpdate } from "../utils/BroadCastHelper";
import { ShoppingBag, Clock, Package, TrendingUp } from "lucide-react";

const AdminNavbar = ({ currentPage }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/admin", key: "orders",  label: "Orders",  icon: ShoppingBag },
    { path: "/admin/orders-completed", key: "history", label: "History", icon: Clock },
    { path: "/admin/manage-items",     key: "stock",   label: "Stock",   icon: Package },
    { path: "/admin/sales-summary",    key: "sales",   label: "Sales",   icon: TrendingUp },
  ];

  const isActive = (path) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname === path;
  };

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
    if (!error && data) setIsOpen(data.is_open);
    setLoading(false);
  };

  const toggleStatus = async () => {
    const newStatus = !isOpen;
    setIsOpen(newStatus);
    const { error } = await supabase
      .from("restaurant_settings")
      .update({ is_open: newStatus })
      .eq("id", 1);
    if (!error) await broadcastStatusUpdate();
    if (error) setIsOpen(!newStatus);
  };

  return (
    <>
      <style>{`
        /* ────────────────────────────────────────────
           ADMIN NAVBAR — full top-nav, no sidebar
        ──────────────────────────────────────────── */
        .admin-navbar {
          background: #fff;
          border-bottom: 1px solid #ebebeb;
          font-family: 'Poppins', sans-serif;
          position: sticky;
          top: 0;
          z-index: 200;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
        }

        /* ── Top row: brand | status | time ── */
        .navbar-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          height: 56px;
          gap: 1rem;
        }

        .navbar-brand {
          font-size: 1.05rem;
          font-weight: 700;
          color: #000;
          letter-spacing: -0.3px;
          white-space: nowrap;
        }

        .navbar-brand span {
          font-weight: 400;
          color: #888;
          font-size: 0.75rem;
          margin-left: 6px;
        }

        /* ── Open/closed toggle ── */
        .status-group {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .status-label {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: ${({ isOpen }) => isOpen ? '#16a34a' : '#dc2626'};
        }

        .status-label.open  { color: #16a34a; }
        .status-label.closed { color: #dc2626; }

        .toggle-pill {
          position: relative;
          width: 46px;
          height: 24px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .toggle-pill input { opacity: 0; width: 0; height: 0; }

        .toggle-track {
          position: absolute;
          inset: 0;
          background: #d1d5db;
          border-radius: 999px;
          transition: background 0.3s;
        }

        .toggle-thumb {
          position: absolute;
          top: 3px; left: 3px;
          width: 18px; height: 18px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.3s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        .toggle-pill input:checked ~ .toggle-track { background: #16a34a; }
        .toggle-pill input:checked ~ .toggle-thumb { transform: translateX(22px); }
        .toggle-pill input:disabled ~ .toggle-track { opacity: 0.5; cursor: not-allowed; }

        /* ── Time display ── */
        .navbar-time {
          font-size: 0.78rem;
          color: #888;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }

        /* ── Bottom row: nav tabs ── */
        .navbar-tabs {
          display: flex;
          align-items: stretch;
          padding: 0 2rem;
          gap: 0;
          border-top: 1px solid #f0f0f0;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .navbar-tabs::-webkit-scrollbar { display: none; }

        .nav-tab {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0 1.25rem;
          height: 44px;
          cursor: pointer;
          font-size: 0.82rem;
          font-weight: 500;
          color: #666;
          border-bottom: 2.5px solid transparent;
          transition: color 0.18s, border-color 0.18s;
          white-space: nowrap;
          user-select: none;
          flex-shrink: 0;
        }

        .nav-tab:hover { color: #000; }

        .nav-tab.active {
          color: #000;
          border-bottom-color: #000;
          font-weight: 600;
        }

        .nav-tab svg { opacity: 0.6; }
        .nav-tab.active svg,
        .nav-tab:hover svg { opacity: 1; }

        /* ── Mobile hamburger ── */
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.35rem;
          border-radius: 6px;
          color: #333;
          flex-shrink: 0;
        }

        .mobile-menu-btn:hover { background: #f0f0f0; }

        /* ── Mobile dropdown nav ── */
        .mobile-nav-dropdown {
          display: none;
          flex-direction: column;
          border-top: 1px solid #f0f0f0;
          padding: 0.5rem 0;
          background: #fff;
        }

        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: #444;
          cursor: pointer;
          transition: background 0.15s;
          border-left: 3px solid transparent;
        }

        .mobile-nav-item:hover { background: #f7f7f7; }

        .mobile-nav-item.active {
          color: #000;
          font-weight: 600;
          background: #f5f5f5;
          border-left-color: #000;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .navbar-top { padding: 0 1rem; }
          .navbar-tabs { display: none; }             /* hide desktop tabs */
          .mobile-menu-btn { display: flex; }
          .navbar-time { display: none; }             /* save space on mobile */

          .mobile-nav-dropdown.open { display: flex; }
        }

        @media (min-width: 769px) {
          .mobile-nav-dropdown { display: none !important; }
        }
      `}</style>

      <nav className="admin-navbar">
        {/* ── Top row ── */}
        <div className="navbar-top">
          <div className="navbar-brand">
            Avneet Caafe <span>Admin</span>
          </div>

          {/* Open/Closed toggle */}
          <div className="status-group">
            <span className={`status-label ${isOpen ? "open" : "closed"}`}>
              {isOpen ? "OPEN" : "CLOSED"}
            </span>
            <label className="toggle-pill">
              <input
                type="checkbox"
                checked={isOpen}
                onChange={toggleStatus}
                disabled={loading}
              />
              <span className="toggle-track" />
              <span className="toggle-thumb" />
            </label>
          </div>

          {/* Time — hidden on mobile */}
          <div className="navbar-time">
            {currentTime.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            {" · "}
            {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
          </div>

          {/* Mobile hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              /* X icon */
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              /* Hamburger */
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>

        {/* ── Desktop tab bar ── */}
        <div className="navbar-tabs">
          {navItems.map(({ path, key, label, icon: Icon }) => (
            <div
              key={key}
              className={`nav-tab ${isActive(path) ? "active" : ""}`}
              onClick={() => navigate(path)}
            >
              <Icon size={15} />
              {label}
            </div>
          ))}
        </div>

        {/* ── Mobile dropdown ── */}
        <div className={`mobile-nav-dropdown ${mobileMenuOpen ? "open" : ""}`}>
          {navItems.map(({ path, key, label, icon: Icon }) => (
            <div
              key={key}
              className={`mobile-nav-item ${isActive(path) ? "active" : ""}`}
              onClick={() => { navigate(path); setMobileMenuOpen(false); }}
            >
              <Icon size={18} />
              {label}
            </div>
          ))}
        </div>
      </nav>
    </>
  );
};

export default AdminNavbar;