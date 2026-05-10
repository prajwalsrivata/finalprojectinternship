import React, { useState, useEffect, useRef, useContext } from 'react';
import './Admin.css';
import axios from 'axios';
import { StoreContext } from '../../components/Context/StoreContext';
import { menu_list } from '../../assets/assets';

const WS_URL = 'ws://localhost:5000';
const API_URL = 'http://localhost:5000';

const STATUS_OPTIONS = ['Food Processing', 'Out for Delivery', 'Delivered'];

const Admin = () => {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('orders');

  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Menu management state
  const { food_list, addFoodItem, removeFoodItem } = useContext(StoreContext);
  const [menuFilter, setMenuFilter] = useState('All');
  const [newItem, setNewItem] = useState({ name: '', category: 'Salad', price: '', description: '' });
  const [newItemImageUrl, setNewItemImageUrl] = useState(''); // base64 data-URL
  const [menuMsg, setMenuMsg] = useState('');

  const wsRef = useRef(null);

  // ── Auth ────────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
      const token = res.data.token;
      localStorage.setItem('adminToken', token);
      setAdminToken(token);
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setAdminToken('');
    wsRef.current?.close();
  };

  // ── Fetch orders ─────────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/orders`, {
        headers: { Authorization: adminToken },
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Update status ─────────────────────────────────────────────────────────────
  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(
        `${API_URL}/api/orders/status`,
        { orderId, status },
        { headers: { Authorization: adminToken } }
      );
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status } : o))
      );
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // ── WebSocket ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!adminToken) return;

    fetchOrders();

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'new_order') {
            setOrders((prev) => [msg.data, ...prev]);
            addNotification(`🆕 New order #${msg.data._id?.slice(-6)} received!`, 'new');
          } else if (msg.type === 'order_status_updated') {
            setOrders((prev) =>
              prev.map((o) => (o._id === msg.data._id ? msg.data : o))
            );
            addNotification(`✅ Order #${msg.data._id?.slice(-6)} → ${msg.data.status}`, 'update');
          } else if (msg.type === 'order_cancelled') {
            setOrders((prev) => prev.filter((o) => o._id !== msg.data.orderId));
            addNotification(`❌ Order #${msg.data.orderId?.slice(-6)} was cancelled`, 'cancel');
          }
        } catch {}
      };
    };

    connect();
    return () => wsRef.current?.close();
  }, [adminToken]);

  const addNotification = (text, kind) => {
    const id = Date.now();
    setNotifications((prev) => [{ id, text, kind }, ...prev.slice(0, 9)]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 5000);
  };

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = {
    total: orders.length,
    processing: orders.filter((o) => o.status === 'Food Processing').length,
    outForDelivery: orders.filter((o) => o.status === 'Out for Delivery').length,
    delivered: orders.filter((o) => o.status === 'Delivered').length,
    revenue: orders.reduce((sum, o) => sum + (o.amount || 0), 0),
  };

  // ── Menu management ───────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Convert to base64 so the image survives localStorage and page refresh
    const reader = new FileReader();
    reader.onload = (ev) => setNewItemImageUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) {
      setMenuMsg('Please fill in name and price.');
      return;
    }
    const id = `custom_${Date.now()}`;
    addFoodItem({
      id,
      name: newItem.name,
      category: newItem.category,
      price: Number(newItem.price),
      description: newItem.description || '',
      image: newItemImageUrl || `https://placehold.co/200x150/1a1a1a/ff6b35?text=${encodeURIComponent(newItem.name)}`,
    });
    setNewItem({ name: '', category: 'Salad', price: '', description: '' });
    setNewItemImageUrl('');
    setMenuMsg(`✅ "${newItem.name}" added to menu!`);
    setTimeout(() => setMenuMsg(''), 3000);
  };

  const handleRemoveItem = (item) => {
    removeFoodItem(item.id);
    setMenuMsg(`🗑️ "${item.name}" removed from menu.`);
    setTimeout(() => setMenuMsg(''), 3000);
  };

  const filteredMenu = menuFilter === 'All'
    ? food_list
    : food_list.filter(f => f.category === menuFilter);

  // ── Login Screen ─────────────────────────────────────────────────────────────
  if (!adminToken) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <h1 className="admin-login-title">CraveGrid</h1>
          <p className="admin-login-sub">Admin Dashboard</p>
          <form onSubmit={handleLogin} className="admin-login-form">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {loginError && <p className="admin-login-error">{loginError}</p>}
            <button type="submit">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  return (
    <div className="admin-wrapper">
      {/* Notification Toast Stack */}
      <div className="admin-toasts">
        {notifications.map((n) => (
          <div key={n.id} className={`admin-toast admin-toast--${n.kind}`}>
            {n.text}
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <h2 className="admin-sidebar-logo">CraveGrid.</h2>
        <nav>
          <span
            className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Orders
          </span>
          <span
            className={`admin-nav-item ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            🍽️ Menu
          </span>
        </nav>
        <div className="admin-sidebar-footer">
          <div className={`ws-badge ${wsConnected ? 'ws-badge--on' : 'ws-badge--off'}`}>
            {wsConnected ? '● Live' : '○ Offline'}
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">Logout</button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <>
            <div className="admin-header">
              <h1>Orders Dashboard</h1>
              <button onClick={fetchOrders} className="admin-refresh-btn">⟳ Refresh</button>
            </div>

            {/* Stats Row */}
            <div className="admin-stats">
              <div className="stat-card stat-card--total">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total Orders</span>
              </div>
              <div className="stat-card stat-card--processing">
                <span className="stat-value">{stats.processing}</span>
                <span className="stat-label">Processing</span>
              </div>
              <div className="stat-card stat-card--delivery">
                <span className="stat-value">{stats.outForDelivery}</span>
                <span className="stat-label">Out for Delivery</span>
              </div>
              <div className="stat-card stat-card--delivered">
                <span className="stat-value">{stats.delivered}</span>
                <span className="stat-label">Delivered</span>
              </div>
              <div className="stat-card stat-card--revenue">
                <span className="stat-value">₹{stats.revenue}</span>
                <span className="stat-label">Revenue</span>
              </div>
            </div>

            {/* Orders Table — fully scrollable, shows ALL orders */}
            {loading ? (
              <div className="admin-loading">Loading orders…</div>
            ) : orders.length === 0 ? (
              <div className="admin-empty">No orders yet. Waiting for live updates…</div>
            ) : (
              <div className="admin-table-wrapper">
                <div className="admin-table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Address</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, idx) => (
                        <tr key={order._id}>
                          <td className="order-seq">{idx + 1}</td>
                          <td className="order-id">#{order._id?.slice(-6)}</td>
                          <td>{new Date(order.date).toLocaleDateString()}</td>
                          <td className="order-customer">
                            {order.address
                              ? `${order.address.firstName || ''} ${order.address.lastName || ''}`.trim() || '—'
                              : '—'}
                          </td>
                          <td className="order-items">
                            {order.items?.map((item) => `${item.name} ×${item.quantity}`).join(', ')}
                          </td>
                          <td className="order-address">
                            {order.address
                              ? `${order.address.street || ''}, ${order.address.city || ''}`.replace(/^,\s*/, '')
                              : '—'}
                          </td>
                          <td>₹{order.amount}</td>
                          <td>
                            <span className={`status-badge status-badge--${order.status?.replace(/\s+/g, '-').toLowerCase()}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <select
                              value={order.status}
                              onChange={(e) => updateStatus(order._id, e.target.value)}
                              className="status-select"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="admin-table-footer">
                  Showing all <strong>{orders.length}</strong> orders
                </div>
              </div>
            )}
          </>
        )}

        {/* ── MENU TAB ── */}
        {activeTab === 'menu' && (
          <>
            <div className="admin-header">
              <h1>Menu Management</h1>
              <span className="admin-menu-count">{food_list.length} items</span>
            </div>

            {menuMsg && <div className="menu-msg">{menuMsg}</div>}

            {/* Add Food Form */}
            <div className="menu-add-card">
              <h3 className="menu-section-title">➕ Add New Food Item</h3>
              <form onSubmit={handleAddItem} className="menu-add-form">
                <div className="menu-add-row">
                  <div className="menu-field">
                    <label>Food Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Paneer Tikka"
                      value={newItem.name}
                      onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="menu-field">
                    <label>Category *</label>
                    <select
                      value={newItem.category}
                      onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                    >
                      {menu_list.map(m => (
                        <option key={m.menu_name} value={m.menu_name}>{m.menu_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="menu-field">
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 199"
                      value={newItem.price}
                      min="1"
                      onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="menu-add-row">
                  <div className="menu-field menu-field--wide">
                    <label>Description (optional)</label>
                    <input
                      type="text"
                      placeholder="Short description shown on card"
                      value={newItem.description}
                      onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <div className="menu-field">
                    <label>Image (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="menu-file-input"
                    />
                  </div>
                  {newItemImageUrl && (
                    <div className="menu-preview">
                      <img src={newItemImageUrl} alt="preview" />
                    </div>
                  )}
                </div>
                <button type="submit" className="menu-add-btn">Add to Menu</button>
              </form>
            </div>

            {/* Filter bar */}
            <div className="menu-filter-bar">
              <button
                className={`menu-filter-btn ${menuFilter === 'All' ? 'active' : ''}`}
                onClick={() => setMenuFilter('All')}
              >
                All ({food_list.length})
              </button>
              {menu_list.map(m => {
                const count = food_list.filter(f => f.category === m.menu_name).length;
                return (
                  <button
                    key={m.menu_name}
                    className={`menu-filter-btn ${menuFilter === m.menu_name ? 'active' : ''}`}
                    onClick={() => setMenuFilter(m.menu_name)}
                  >
                    {m.menu_name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Food Items Grid */}
            <div className="menu-grid">
              {filteredMenu.map(item => (
                <div key={item.id} className="menu-item-card">
                  <div className="menu-item-img-wrap">
                    <img
                      src={typeof item.image === 'string' ? item.image : item.image?.src || ''}
                      alt={item.name}
                      onError={e => { e.target.src = `https://placehold.co/200x140/1a1a1a/ff6b35?text=${encodeURIComponent(item.name)}`; }}
                    />
                    <span className="menu-item-category">{item.category}</span>
                  </div>
                  <div className="menu-item-info">
                    <span className="menu-item-name">{item.name}</span>
                    <span className="menu-item-price">₹{item.price}</span>
                  </div>
                  {item.description && (
                    <p className="menu-item-desc">{item.description}</p>
                  )}
                  <button
                    className="menu-remove-btn"
                    onClick={() => handleRemoveItem(item)}
                    title="Remove from menu"
                  >
                    🗑️ Remove
                  </button>
                </div>
              ))}
              {filteredMenu.length === 0 && (
                <div className="menu-empty">No items in this category.</div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Admin;
