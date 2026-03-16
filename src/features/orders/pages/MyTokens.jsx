import React, { useEffect, useMemo, useState } from 'react';
import './MyTokens.css';
import TokenCard from '../components/TokenCard';
import { supabase } from '../../../shared/services/supabaseClient';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// ─── Resolve stored phones once at module level ───────────────────────────────
// Reading from localStorage inside the component body (outside useEffect) is
// safe for initial render but can produce stale values on HMR / re-mounts.
// We derive it once here so it's stable across re-renders.
function getStoredPhones() {
  try {
    const multi = localStorage.getItem('userPhones');
    if (multi) return JSON.parse(multi);
    const legacy = localStorage.getItem('userPhone');
    return legacy ? [legacy] : [];
  } catch {
    return [];
  }
}

const MyTokens = () => {
  const userPhones = useMemo(getStoredPhones, []); // stable across renders
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userPhones.length) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('phone', userPhones)
        .order('created_at', { ascending: false });
      if (!error && mounted) setOrders(data ?? []);
      if (mounted) setLoading(false);
    };

    fetchOrders();

    /**
     * Filter realtime events server-side using the `filter` option.
     * Previously every UPDATE on the whole orders table was broadcast to
     * this client and filtered in JS. With the filter pushed to Postgres
     * we only receive rows where phone matches — far less traffic.
     *
     * Note: Supabase realtime filter supports a single eq() value.
     * For multiple phones we subscribe to one channel per phone.
     * At a cafeteria scale (1-3 devices per user) this is fine.
     */
    const channels = userPhones.map((phone) =>
      supabase
        .channel(`my-orders-${phone}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `phone=eq.${phone}`,
          },
          (payload) => {
            if (!mounted) return;
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? payload.new : o))
            );
          }
        )
        .subscribe()
    );

    return () => {
      mounted = false;
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [userPhones]);

  return (
    <div className="user-tokens">
      <div className="user-tokens-nav">
        <button onClick={() => (window.location.href = '/')}>
          <img src="/back-arrow.svg" alt="Back" className="back-arw" />
        </button>
        <p>My Tokens</p>
      </div>

      <div className="user-tokens-list">
        {loading ? (
          <DotLottieReact
            src="/loader-food-animation.lottie"
            loop
            autoplay
            className="loader-animation"
          />
        ) : orders.length > 0 ? (
          orders.map((order) => <TokenCard key={order.id} order={order} />)
        ) : (
          <img src="/no-tokens.svg" alt="No orders yet" className="no-tokens" />
        )}
      </div>
    </div>
  );
};

export default MyTokens;