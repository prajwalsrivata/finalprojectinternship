import { createContext, useEffect, useState } from "react"
import { food_list as initial_food_list } from "../../assets/assets"

// eslint-disable-next-line react-refresh/only-export-components
export const StoreContext = createContext(null)

// Keys used in localStorage
const LS_REMOVED = "admin_removed_ids";   // JSON array of original item ids removed by admin
const LS_CUSTOM  = "admin_custom_items";  // JSON array of admin-added items (with base64 images)

const loadState = () => {
    try {
        const removed = JSON.parse(localStorage.getItem(LS_REMOVED) || "[]");
        const custom  = JSON.parse(localStorage.getItem(LS_CUSTOM)  || "[]");
        // Original items minus any the admin removed, then custom items appended
        const originals = initial_food_list.filter(f => !removed.includes(f.id));
        return { list: [...originals, ...custom], removed, custom };
    } catch {
        return { list: initial_food_list, removed: [], custom: [] };
    }
};

const StoreContextProvider = (props) => {

    const [cartItems, setCartItems] = useState({});

    const init = loadState();
    const [food_list, setFoodList] = useState(init.list);
    const [removedIds, setRemovedIds] = useState(init.removed);   // ids of original items removed
    const [customItems, setCustomItems] = useState(init.custom);   // admin-added items

    const addToCart = (itemId) => {
        setCartItems(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    }

    const removeFromCart = (itemId) => {
        setCartItems(prev => {
            if (!prev[itemId]) return prev;
            return { ...prev, [itemId]: prev[itemId] - 1 };
        });
    }

    const getTotalCartAmount = () => {
        let total = 0;
        for (const id in cartItems) {
            if (cartItems[id] > 0) {
                const item = food_list.find(p => p.id === id);
                if (item) total += item.price * cartItems[id];
            }
        }
        return total;
    }

    // ── Admin: add a new item (image must already be a base64 data-URL) ─────────
    const addFoodItem = (newItem) => {
        const updated = [...customItems, newItem];
        setCustomItems(updated);
        localStorage.setItem(LS_CUSTOM, JSON.stringify(updated));
        setFoodList(prev => [...prev, newItem]);
    };

    // ── Admin: remove an item ────────────────────────────────────────────────────
    const removeFoodItem = (itemId) => {
        // Decide whether it's an original or a custom item
        const isOriginal = initial_food_list.some(f => f.id === itemId);

        if (isOriginal) {
            const updatedRemoved = [...removedIds, itemId];
            setRemovedIds(updatedRemoved);
            localStorage.setItem(LS_REMOVED, JSON.stringify(updatedRemoved));
        } else {
            const updatedCustom = customItems.filter(f => f.id !== itemId);
            setCustomItems(updatedCustom);
            localStorage.setItem(LS_CUSTOM, JSON.stringify(updatedCustom));
        }

        setFoodList(prev => prev.filter(f => f.id !== itemId));
    };

    const url = "http://localhost:5000"
    const [token, setToken] = useState("");

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) setToken(storedToken);
        const storedCart = localStorage.getItem("cartItems");
        if (storedCart) setCartItems(JSON.parse(storedCart));
    }, []);

    useEffect(() => {
        localStorage.setItem("cartItems", JSON.stringify(cartItems));
    }, [cartItems]);

    const [search, setSearch] = useState("");

    const contextValue = {
        food_list,
        setFoodList,
        addFoodItem,
        removeFoodItem,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        url,
        token,
        setToken,
        search,
        setSearch
    }

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}

export default StoreContextProvider
