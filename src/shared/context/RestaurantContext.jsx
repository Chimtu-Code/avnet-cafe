import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const STATUS_CACHE_KEY = 'avnet_status_cache';
const STATUS_TTL_MS    = 60 * 1000;

function readStatusCache() {
  try {
    const raw = sessionStorage.getItem(STATUS_CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > STATUS_TTL_MS) return null;
    return data;
  } catch { return null; }
}

function writeStatusCache(data) {
  try {
    sessionStorage.setItem(STATUS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* noop */ }
}

function invalidateStatusCache() {
  try { sessionStorage.removeItem(STATUS_CACHE_KEY); } catch { /* noop */ }
}

const DEFAULT_MSG = "We're currently closed. Please check back during our operating hours.";

const ClosedOverlay = ({ message }) => (
  <div className="closed-overlay">
    <div className="closed-sign">
      <p className="closed-text">CLOSED</p>
      <p className="closed-subtext">Sorry, We're Closed</p>
    </div>
    <p className="closed-message">{message}</p>
  </div>
);

const RestaurantContext = createContext(null);

export const RestaurantProvider = ({ children }) => {
  const [isOpen, setIsOpen]               = useState(true);
  const [closedMessage, setClosedMessage] = useState('');
  const channelRef = useRef(null);
  const location   = useLocation();

  // Never show the closed overlay on admin pages —
  // admins need to use their panel even when the restaurant is closed
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Apply status directly from any data object — no extra DB call
  const applyStatus = useCallback((data) => {
    if (!data) return;
    const msg = data.closed_message || DEFAULT_MSG;
    setIsOpen(data.is_open);
    setClosedMessage(msg);
    writeStatusCache({ is_open: data.is_open, closed_message: msg });
  }, []);

  // Only called on mount or tab-focus — reads cache first
  const fetchStatus = useCallback(async () => {
    const cached = readStatusCache();
    if (cached) { applyStatus(cached); return; }

    const { data } = await supabase
      .from('restaurant_settings')
      .select('is_open, closed_message')
      .eq('id', 1)
      .single();
    applyStatus(data);
  }, [applyStatus]);

  useEffect(() => {
    fetchStatus();

    channelRef.current = supabase
      .channel('restaurant-status-global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_settings' },
        (payload) => {
          // payload.new has the full updated row — apply instantly, zero extra query
          invalidateStatusCache();
          applyStatus(payload.new);
        }
      )
      .on('broadcast', { event: 'status-changed' }, () => {
        // Broadcast from BroadcastHelper — no payload, must re-fetch
        invalidateStatusCache();
        fetchStatus();
      })
      .subscribe();

    const onVisible = () => {
      if (!document.hidden) fetchStatus();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchStatus, applyStatus]);

  return (
    <RestaurantContext.Provider value={{ isOpen, closedMessage }}>
      {!isOpen && !isAdminRoute && <ClosedOverlay message={closedMessage} />}
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error('useRestaurant must be used inside RestaurantProvider');
  return ctx;
};