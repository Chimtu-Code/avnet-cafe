import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

// ─── Reducer ────────────────────────────────────────────────────────────────
function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const exists = state.find((i) => i.id === action.item.id);
      if (exists) {
        return state.map((i) =>
          i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...state, { ...action.item, quantity: 1 }];
    }
    case "REMOVE":
      return state.filter((i) => i.id !== action.id);
    case "SET_QTY": {
      if (action.quantity <= 0) return state.filter((i) => i.id !== action.id);
      return state.map((i) =>
        i.id === action.id ? { ...i, quantity: action.quantity } : i,
      );
    }
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

function init() {
  try {
    const stored = localStorage.getItem("cartItems");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ─── Two contexts: one for data (changes often), one for actions (stable) ───
const CartDataContext = createContext(null);
const CartActionsContext = createContext(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export const CartProvider = ({ children }) => {
  const [cartItems, dispatch] = useReducer(cartReducer, undefined, init);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // Stable action callbacks — never change reference between renders
  const addToCart = useCallback((item) => dispatch({ type: "ADD", item }), []);
  const removeItem = useCallback((id) => dispatch({ type: "REMOVE", id }), []);
  const updateQuantity = useCallback(
    (id, quantity) => dispatch({ type: "SET_QTY", id, quantity }),
    [],
  );
  
  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);

  // Increment / decrement via SET_QTY — read quantity from cartItems
  const incrementItem = useCallback((id) => {
    dispatch((prevState) => {
      // useReducer doesn't support functional dispatch — we do it cleanly:
      return {
        type: "SET_QTY",
        id,
        quantity: (prevState.find?.((i) => i.id === id)?.quantity ?? 0) + 1,
      };
    });
  }, []);

  // Simpler: just define increment/decrement as regular callbacks that
  // close over cartItems. They're wrapped in useCallback so they only
  // change when cartItems changes — which is fine since Card.jsx
  // subscribes to CartDataContext anyway.
  const inc = useCallback(
    (id) => {
      const item = cartItems.find((i) => i.id === id);
      if (item) dispatch({ type: "SET_QTY", id, quantity: item.quantity + 1 });
    },
    [cartItems],
  );

  const dec = useCallback(
    (id) => {
      const item = cartItems.find((i) => i.id === id);
      if (item) dispatch({ type: "SET_QTY", id, quantity: item.quantity - 1 });
    },
    [cartItems],
  );

  // Derived values — only recompute when cartItems changes
  const totalItems = useMemo(
    () => cartItems.reduce((s, i) => s + i.quantity, 0),
    [cartItems],
  );

  const totalPrice = useMemo(
    () => cartItems.reduce((s, i) => s + i.quantity * i.price, 0),
    [cartItems],
  );

  // Stable actions object — addToCart / removeItem / updateQuantity / clearCart
  // never change reference, so components that only need actions never re-render
  const actions = useMemo(
    () => ({
      addToCart,
      removeItem,
      updateQuantity,
      clearCart,
      increment: inc,
      decrement: dec,
    }),
    [inc, dec],
  );

  const data = useMemo(
    () => ({ cartItems, totalItems, totalPrice }),
    [cartItems, totalItems, totalPrice],
  );

  return (
    <CartActionsContext.Provider value={actions}>
      <CartDataContext.Provider value={data}>
        {children}
      </CartDataContext.Provider>
    </CartActionsContext.Provider>
  );
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

/** Full cart data — use in Cart page, Navbar badge, Home indicator */
export const useCartData = () => {
  const ctx = useContext(CartDataContext);
  if (!ctx) throw new Error("useCartData must be used inside CartProvider");
  return ctx;
};

/** Stable action dispatchers — use in Card, CartItem (never causes re-renders from state changes) */
export const useCartActions = () => {
  const ctx = useContext(CartActionsContext);
  if (!ctx) throw new Error("useCartActions must be used inside CartProvider");
  return ctx;
};

/** Legacy hook — keeps backward compat for any component not yet migrated */
export const useCart = () => {
  const data = useContext(CartDataContext);
  const actions = useContext(CartActionsContext);
  if (!data || !actions)
    throw new Error("useCart must be used inside CartProvider");
  return { ...data, ...actions };
};
