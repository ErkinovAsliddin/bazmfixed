import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
  getCart,
  replaceCart,
} from "@workspace/api-client-react";

/**
 * A shopping cart that works for guests and signed-in users alike.
 *
 * Guests get an instant, localStorage-backed cart. When a user signs in, their
 * device cart is merged with the server cart (server-authoritative quantities,
 * clamped to stock) and every subsequent change is pushed to the server so it
 * follows them across devices and survives to checkout.
 */

export interface CartItem {
  productId: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  /** Total number of units across all lines. */
  count: number;
  /** Number of distinct products. */
  distinctCount: number;
  quantityOf: (productId: number) => number;
  /** Increment a product by `quantity` (default 1). */
  addItem: (productId: number, quantity?: number) => void;
  /** Set a product to an exact quantity (used by "buy the recommended amount"). */
  setItem: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clear: () => void;
  /** Flush the local cart to the server now (used right before checkout). */
  syncNow: () => Promise<void>;
}

const STORAGE_KEY = "bazm_cart";

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (i): i is CartItem =>
          typeof i?.productId === "number" && typeof i?.quantity === "number",
      )
      .map((i) => ({
        productId: i.productId,
        quantity: Math.max(0, Math.floor(i.quantity)),
      }))
      .filter((i) => i.quantity > 0);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  const { data: user } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey(), retry: false },
  });
  const userId = user?.id ?? null;

  // Which user id we've *started* a merge for (guards the one-shot merge).
  const syncedUserRef = useRef<number | null>(null);
  // Which user id the merge has *finished* for — only then may we push.
  // Kept as state so the debounced-push effect re-runs once merge completes.
  const [mergedUserId, setMergedUserId] = useState<number | null>(null);
  // Latest items, so the debounced push always sends the freshest state.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Mirror to localStorage so guests (and the pre-login state) persist.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or unavailable — cart simply won't persist.
    }
  }, [items]);

  // On sign-in, merge the device cart into the server cart exactly once.
  useEffect(() => {
    if (userId === null) {
      syncedUserRef.current = null;
      setMergedUserId(null);
      return;
    }
    if (syncedUserRef.current === userId) return;
    syncedUserRef.current = userId;

    let cancelled = false;
    (async () => {
      try {
        const server = await getCart();
        const merged = new Map<number, number>();
        for (const line of server.items) merged.set(line.productId, line.quantity);
        for (const local of itemsRef.current) {
          merged.set(
            local.productId,
            Math.max(local.quantity, merged.get(local.productId) ?? 0),
          );
        }
        const payload = [...merged].map(([productId, quantity]) => ({
          productId,
          quantity,
        }));
        const result = await replaceCart({ items: payload });
        if (!cancelled) {
          setItems(
            result.items.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
            })),
          );
        }
      } catch {
        // Offline or not reachable — keep the local cart as-is.
      } finally {
        // Only now may debounced pushes run: this prevents an early push
        // from overwriting the server cart before the merge has committed.
        if (!cancelled) setMergedUserId(userId);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Debounced push of local changes to the server, but only after the
  // merge-on-login has completed for the current user.
  useEffect(() => {
    if (userId === null || mergedUserId !== userId) return;
    const handle = window.setTimeout(() => {
      replaceCart({ items }).catch(() => {
        // Best-effort; the local cart remains the source of truth meanwhile.
      });
    }, 500);
    return () => window.clearTimeout(handle);
  }, [items, userId, mergedUserId]);

  const addItem = useCallback((productId: number, quantity = 1) => {
    if (quantity <= 0) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [...prev, { productId, quantity }];
    });
  }, []);

  const setItem = useCallback((productId: number, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.productId !== productId);
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity } : i,
        );
      }
      return [...prev, { productId, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const syncNow = useCallback(async () => {
    if (userId === null) return;
    await replaceCart({ items: itemsRef.current });
  }, [userId]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      items,
      count,
      distinctCount: items.length,
      quantityOf: (productId) =>
        items.find((i) => i.productId === productId)?.quantity ?? 0,
      addItem,
      setItem,
      removeItem,
      clear,
      syncNow,
    };
  }, [items, addItem, setItem, removeItem, clear, syncNow]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
