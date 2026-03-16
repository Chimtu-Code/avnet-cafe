import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../shared/services/supabaseClient';

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const MENU_CACHE_KEY   = 'avnet_menu_cache';
const MENU_TTL_MS      = 5 * 60 * 1000;

function readCache(key, ttl) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > ttl) return null;
    return data;
  } catch { return null; }
}

function writeCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* noop */ }
}

export function invalidateMenuCache() {
  try { sessionStorage.removeItem(MENU_CACHE_KEY); } catch { /* noop */ }
}

function idsChanged(prev, next) {
  if (prev.length !== next.length) return true;
  const set = new Set(prev.map((i) => i.id));
  return next.some((i) => !set.has(i.id));
}

// Restaurant status is handled globally by RestaurantContext — not here.
// useMenuData only owns: categories, items, loading, cache, realtime for menu.
export function useMenuData() {
  const [categories, setCategories] = useState([]);
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);

  const channelRef = useRef(null);
  const pollRef    = useRef(null);

  const fetchMenu = useCallback(async (silent = false, force = false) => {
    if (!force) {
      const cached = readCache(MENU_CACHE_KEY, MENU_TTL_MS);
      if (cached) {
        setCategories(cached.categories);
        setItems(cached.items);
        if (!silent) setLoading(false);
        return;
      }
    }
    if (!silent) setLoading(true);
    try {
      const [{ data: catData }, { data: itemData }] = await Promise.all([
        supabase.from('categories').select('*').order('id', { ascending: true }),
        supabase.from('items').select('*').is('available', true).order('id', { ascending: true }),
      ]);
      const cats = catData ?? [];
      const itms = itemData ?? [];
      setCategories((prev) => idsChanged(prev, cats) ? cats : prev);
      setItems((prev)      => idsChanged(prev, itms) ? itms : prev);
      writeCache(MENU_CACHE_KEY, { categories: cats, items: itms });
    } catch (err) {
      console.error('[useMenuData] fetch error:', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();

    channelRef.current = supabase
      .channel('home-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items' }, (payload) => {
        invalidateMenuCache();
        setItems((prev) => {
          if (!payload.new.available) return prev.filter((i) => i.id !== payload.new.id);
          const exists = prev.find((i) => i.id === payload.new.id);
          return exists
            ? prev.map((i) => (i.id === payload.new.id ? payload.new : i))
            : [...prev, payload.new];
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items' }, (payload) => {
        invalidateMenuCache();
        if (payload.new.available) setItems((prev) => [...prev, payload.new]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' }, (payload) => {
        invalidateMenuCache();
        setItems((prev) => prev.filter((i) => i.id !== payload.old.id));
      })
      .on('broadcast', { event: 'menu-changed' }, () => {
        invalidateMenuCache();
        fetchMenu(true, true);
      })
      .subscribe();

    pollRef.current = setInterval(() => fetchMenu(true), POLL_INTERVAL_MS);

    const onVisible = () => {
      if (!document.hidden) fetchMenu(true);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(pollRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchMenu]);

  const categoriesWithCounts = useMemo(
    () => categories.map((cat) => ({
      ...cat,
      itemCount: items.filter((i) => i.category_id === cat.id).length,
    })),
    [categories, items]
  );

  return {
    categories,
    setCategories,
    items,
    loading,
    categoriesWithCounts,
    refresh: () => { invalidateMenuCache(); fetchMenu(true, true); },
  };
}