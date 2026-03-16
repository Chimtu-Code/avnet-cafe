/**
 * BroadcastHelper — singleton pattern
 *
 * The previous version created a new supabase.channel() on every call
 * without ever subscribing, so all broadcasts silently failed.
 *
 * This version keeps ONE shared channel for the lifetime of the admin
 * session. The channel is subscribed once on first use, reused for all
 * subsequent broadcasts, and torn down when the page unloads.
 */

import { supabase } from '../../../shared/services/supabaseClient'; 

const CHANNEL_NAME = 'admin-broadcasts';

let _channel = null;
let _subscribed = false;

function getChannel() {
  if (!_channel) {
    _channel = supabase.channel(CHANNEL_NAME, {
      config: { broadcast: { self: false } },
    });
  }
  return _channel;
}

async function ensureSubscribed() {
  if (_subscribed) return;
  return new Promise((resolve, reject) => {
    getChannel()
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          _subscribed = true;
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          _subscribed = false;
          _channel = null; // force recreate next time
          reject(err ?? new Error(`Channel ${status}`));
        }
      });
  });
}

async function broadcast(event, payload = {}) {
  try {
    await ensureSubscribed();
    const res = await getChannel().send({
      type: 'broadcast',
      event,
      payload: { ...payload, timestamp: new Date().toISOString() },
    });
    if (res !== 'ok') throw new Error(`Broadcast returned: ${res}`);
    return { success: true };
  } catch (error) {
    console.error(`[BroadcastHelper] Failed to send "${event}":`, error);
    return { success: false, error };
  }
}

/**
 * Call after any menu item / category insert, update, or delete.
 */
export const broadcastMenuUpdate = () => broadcast('menu-changed');

/**
 * Call after toggling restaurant open/closed.
 */
export const broadcastStatusUpdate = () => broadcast('status-changed');

// Cleanup on page unload — prevents channel leak across hot reloads in dev
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (_channel) {
      supabase.removeChannel(_channel);
      _channel = null;
      _subscribed = false;
    }
  });
}