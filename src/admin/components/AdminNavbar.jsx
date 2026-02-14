import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import { broadcastStatusUpdate } from "../utils/BroadCastHelper";
import { ShoppingBag, Clock, Package, TrendingUp, MessageSquare } from "lucide-react";

const AdminNavbar = ({ currentPage }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [closedMessage, setClosedMessage] = useState("");
  const [tempMessage, setTempMessage] = useState("");
  const [savingMessage, setSavingMessage] = useState(false);
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
      .select("is_open, closed_message")
      .eq("id", 1)
      .single();
    if (!error && data) {
      setIsOpen(data.is_open);
      setClosedMessage(data.closed_message || "We're currently closed. Please check back during our operating hours. Thank you!");
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
    if (!error) await broadcastStatusUpdate();
    if (error) setIsOpen(!newStatus);
  };

  const openMessageModal = () => {
    setTempMessage(closedMessage);
    setShowMessageModal(true);
  };

  const saveClosedMessage = async () => {
    if (!tempMessage.trim()) {
      alert("Please enter a message");
      return;
    }
    
    setSavingMessage(true);
    const { error } = await supabase
      .from("restaurant_settings")
      .update({ closed_message: tempMessage.trim() })
      .eq("id", 1);
    
    if (!error) {
      setClosedMessage(tempMessage.trim());
      await broadcastStatusUpdate();
      setShowMessageModal(false);
    } else {
      alert("Failed to save message");
    }
    setSavingMessage(false);
  };

  const resetToDefault = () => {
    setTempMessage("We're currently closed. Please check back during our operating hours. Thank you!");
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

        /* ── Open/closed toggle + message button ── */
        .status-group {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .status-label {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.5px;
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

        /* ── Message button ── */
        .msg-btn {
          background: #f0f0f0;
          border: none;
          padding: 0.45rem 0.65rem;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: #555;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .msg-btn:hover {
          background: #e0e0e0;
          color: #000;
        }

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

        /* ── Message Modal ── */
        .msg-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .msg-modal {
          background: #fff;
          border-radius: 12px;
          padding: 1.75rem;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }

        .msg-modal h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #000;
        }

        .msg-modal p {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 1.25rem;
        }

        .msg-textarea {
          width: 100%;
          min-height: 100px;
          padding: 0.75rem;
          border: 1.5px solid #e5e5e5;
          border-radius: 8px;
          font-family: inherit;
          font-size: 0.875rem;
          resize: vertical;
          transition: border-color 0.2s;
          margin-bottom: 1rem;
        }

        .msg-textarea:focus {
          outline: none;
          border-color: #000;
        }

        .msg-actions {
          display: flex;
          gap: 0.65rem;
          align-items: center;
        }

        .msg-btn-secondary {
          padding: 0.65rem 1rem;
          border: 1px solid #ddd;
          background: #fff;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          font-family: inherit;
          transition: all 0.2s;
          color: #666;
        }

        .msg-btn-secondary:hover {
          background: #f5f5f5;
          border-color: #999;
        }

        .msg-btn-primary {
          flex: 1;
          padding: 0.65rem 1rem;
          border: none;
          background: #000;
          color: #fff;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          font-family: inherit;
          transition: background 0.2s;
        }

        .msg-btn-primary:hover {
          background: #222;
        }

        .msg-btn-primary:disabled {
          background: #999;
          cursor: not-allowed;
        }

        .msg-btn-cancel {
          padding: 0.65rem 1rem;
          border: none;
          background: #f0f0f0;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          font-family: inherit;
          transition: background 0.2s;
        }

        .msg-btn-cancel:hover {
          background: #e0e0e0;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .navbar-top { padding: 0 1rem; }
          .navbar-tabs { display: none; }
          .mobile-menu-btn { display: flex; }
          .navbar-time { display: none; }
          .msg-btn span { display: none; } /* Hide text on mobile */
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

          {/* Open/Closed toggle + Message button */}
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
            <button
              className="msg-btn"
              onClick={openMessageModal}
              title="Edit closed message"
            >
              <MessageSquare size={14} />
              <span>Message</span>
            </button>
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
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

      {/* ── Closed Message Modal ── */}
      {showMessageModal && (
        <div className="msg-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="msg-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Closed Message</h3>
            <p>This message will be displayed to customers when the restaurant is closed.</p>
            
            <textarea
              className="msg-textarea"
              value={tempMessage}
              onChange={(e) => setTempMessage(e.target.value)}
              placeholder="Enter your closed message..."
              maxLength={200}
            />
            
            <div className="msg-actions">
              <button
                className="msg-btn-secondary"
                onClick={resetToDefault}
                type="button"
              >
                Reset
              </button>
              <button
                className="msg-btn-cancel"
                onClick={() => setShowMessageModal(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="msg-btn-primary"
                onClick={saveClosedMessage}
                disabled={savingMessage}
                type="button"
              >
                {savingMessage ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminNavbar;