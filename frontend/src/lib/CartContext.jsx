/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useCallback, useEffect } from "react";

const CART_KEY = "meals_cart";

const initial = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { shopId: null, shopName: null, items: [] };
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case "SET_SHOP":
      return {
        shopId: action.shopId,
        shopName: action.shopName,
        items: state.shopId === action.shopId ? state.items : [],
      };
    case "ADD_ITEM": {
      const { menuItemId, name, priceLkr, qty = 1 } = action.payload;
      const existing = state.items.find((i) => i.menuItemId === menuItemId);
      const items = existing
        ? state.items.map((i) =>
            i.menuItemId === menuItemId ? { ...i, qty: i.qty + qty } : i
          )
        : [...state.items, { menuItemId, name, priceLkr, qty }];
      return { ...state, items };
    }
    case "UPDATE_QTY": {
      const { menuItemId, qty } = action.payload;
      if (qty < 1) {
        return { ...state, items: state.items.filter((i) => i.menuItemId !== menuItemId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.menuItemId === menuItemId ? { ...i, qty } : i
        ),
      };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.menuItemId !== action.menuItemId),
      };
    case "CLEAR":
      return { shopId: null, shopName: null, items: [] };
    default:
      return state;
  }
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, initial);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const setShop = useCallback((shopId, shopName) => {
    dispatch({ type: "SET_SHOP", shopId, shopName });
  }, []);

  const addItem = useCallback((payload) => {
    dispatch({ type: "ADD_ITEM", payload });
  }, []);

  const updateQty = useCallback((menuItemId, qty) => {
    dispatch({ type: "UPDATE_QTY", payload: { menuItemId, qty } });
  }, []);

  const removeItem = useCallback((menuItemId) => {
    dispatch({ type: "REMOVE_ITEM", menuItemId });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  return (
    <CartContext.Provider
      value={{
        ...state,
        setShop,
        addItem,
        updateQty,
        removeItem,
        clearCart,
        itemCount: state.items.reduce((n, i) => n + i.qty, 0),
        subtotal: state.items.reduce((s, i) => s + i.priceLkr * i.qty, 0),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
