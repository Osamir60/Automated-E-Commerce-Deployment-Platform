import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // Auth state
  const [user, setUser] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Admin form state
  const [adminForm, setAdminForm] = useState({ name: '', price: '', description: '', category: '', image: '' });
  const [adminMsg, setAdminMsg] = useState('');
  const [adminError, setAdminError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  // Service URLs
  const PRODUCT_SERVICE_URL = import.meta.env.VITE_PRODUCT_SERVICE_URL || 'http://localhost:5001';
  const CART_SERVICE_URL = import.meta.env.VITE_CART_SERVICE_URL || 'http://localhost:5005';
  const AUTH_SERVICE_URL = import.meta.env.VITE_EMAIL_SERVICE_URL || 'http://localhost:5004';
  const SEARCH_SERVICE_URL = import.meta.env.VITE_SEARCH_SERVICE_URL || 'http://localhost:5002';

  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    if (user) {
      fetchProducts();
      if (!isAdmin) fetchCart();
    }
  }, [user]);

  // Auth Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const endpoint = isLoginMode ? '/login' : '/register';
    const payload = isLoginMode
      ? { email: authForm.email, password: authForm.password }
      : authForm;

    try {
      const response = await fetch(`${AUTH_SERVICE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (!isLoginMode) {
          setIsLoginMode(true);
          setAuthSuccess('Account created successfully! Please log in.');
          setAuthForm({ ...authForm, password: '' });
        } else {
          setUser(data);
        }
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setAuthError('Failed to connect to authentication server');
    }
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    setIsAdminPanelOpen(false);
  };

  // Search Handler
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return fetchProducts();
    }
    try {
      setIsSearching(true);
      const response = await fetch(`${SEARCH_SERVICE_URL}/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Store Handlers
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${PRODUCT_SERVICE_URL}/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await fetch(`${CART_SERVICE_URL}/cart`);
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (error) {
      console.error('Failed to fetch cart', error);
    }
  };

  const addToCart = async (product) => {
    try {
      const response = await fetch(`${CART_SERVICE_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image
        }),
      });
      if (response.ok) {
        const updatedCart = await response.json();
        setCart(updatedCart);
        setIsCartOpen(true);
      }
    } catch (error) {
      console.error('Failed to add to cart', error);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await fetch(`${CART_SERVICE_URL}/cart/${itemId}`, { method: 'DELETE' });
      if (response.ok) {
        const updatedCart = await response.json();
        setCart(updatedCart);
      }
    } catch (error) {
      console.error('Failed to remove from cart', error);
    }
  };

  // Admin Handlers
  const handleImageFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target.result);
      setAdminForm(f => ({ ...f, image: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setAdminMsg('');
    setAdminError('');

    if (!adminForm.name || !adminForm.price || (!adminForm.image && (!fileInputRef.current || !fileInputRef.current.files[0]))) {
      setAdminError('اسم المنتج، السعر، والصورة مطلوبين!');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', adminForm.name);
      formData.append('price', adminForm.price);
      if (adminForm.category) formData.append('category', adminForm.category);
      if (adminForm.description) formData.append('description', adminForm.description);
      
      if (fileInputRef.current && fileInputRef.current.files[0]) {
        formData.append('imageFile', fileInputRef.current.files[0]);
      } else if (adminForm.image) {
        formData.append('imageUrl', adminForm.image);
      }

      const response = await fetch(`${PRODUCT_SERVICE_URL}/products`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setAdminMsg('✅ تم إضافة المنتج بنجاح!');
        setAdminForm({ name: '', price: '', description: '', category: '', image: '' });
        setImagePreview('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchProducts();
      } else {
        const data = await response.json();
        setAdminError(data.error || 'فشل في إضافة المنتج');
      }
    } catch (error) {
      setAdminError('خطأ في الاتصال بالخادم');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    try {
      const response = await fetch(`${PRODUCT_SERVICE_URL}/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to delete product', error);
    }
  };

  const cartTotal = Array.isArray(cart) ? cart.reduce((total, item) => total + (item.price * item.quantity), 0) : 0;
  const cartItemCount = Array.isArray(cart) ? cart.reduce((count, item) => count + item.quantity, 0) : 0;

  // ─── Auth Screen ───────────────────────────────────────────────
  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>LuminaStore</h1>
            <p>{isLoginMode ? 'Welcome back! Please login.' : 'Create your account to start shopping.'}</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {authError && <div className="auth-error">{authError}</div>}
            {authSuccess && <div className="auth-success">{authSuccess}</div>}

            {!isLoginMode && (
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required />
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
            </div>

            <button type="submit" className="btn-auth">
              {isLoginMode ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="auth-switch">
            <button onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); setAuthSuccess(''); }}>
              {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Admin Panel ───────────────────────────────────────────────
  if (isAdmin && isAdminPanelOpen) {
    return (
      <div className="app-container">
        <nav className="navbar admin-navbar">
          <div className="logo">🛡️ LuminaStore Admin</div>
          <div className="nav-actions">
            <span className="admin-badge">Admin: {user.name}</span>
            <button className="btn-secondary" onClick={() => setIsAdminPanelOpen(false)}>← Back to Store</button>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </div>
        </nav>

        <main className="admin-main">
          <div className="admin-layout">

            {/* Add Product Form */}
            <div className="admin-card">
              <h2>➕ Add New Product</h2>
              <form onSubmit={handleAddProduct} className="admin-form">
                {adminMsg && <div className="auth-success">{adminMsg}</div>}
                {adminError && <div className="auth-error">{adminError}</div>}

                <div className="form-group">
                  <label>Product Name *</label>
                  <input type="text" placeholder="e.g. Gaming Headset" value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>Price (USD) *</label>
                  <input type="number" step="0.01" min="0" placeholder="e.g. 99.99" value={adminForm.price}
                    onChange={(e) => setAdminForm({ ...adminForm, price: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <input type="text" placeholder="e.g. Electronics" value={adminForm.category}
                    onChange={(e) => setAdminForm({ ...adminForm, category: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea placeholder="Product description..." value={adminForm.description}
                    onChange={(e) => setAdminForm({ ...adminForm, description: e.target.value })} rows={3} />
                </div>

                <div className="form-group">
                  <label>Product Image *</label>
                  <div className="image-upload-area">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="file-input" id="product-image-upload" />
                    <label htmlFor="product-image-upload" className="file-upload-label">
                      {imagePreview ? '🔄 Change Image' : '📁 Choose Image from your device'}
                    </label>
                    {imagePreview && (
                      <div className="image-preview-wrap">
                        <img src={imagePreview} alt="Preview" className="image-preview" />
                      </div>
                    )}
                  </div>
                  <div className="image-url-divider">— or paste an image URL —</div>
                  <input type="text" placeholder="https://example.com/image.jpg" value={adminForm.image && !adminForm.image.startsWith('data:') ? adminForm.image : ''}
                    onChange={(e) => { setAdminForm({ ...adminForm, image: e.target.value }); setImagePreview(e.target.value); }} />
                </div>

                <button type="submit" className="btn-admin-submit">Add Product</button>
              </form>
            </div>

            {/* Products List */}
            <div className="admin-card">
              <h2>📦 All Products ({products.length})</h2>
              <div className="admin-products-list">
                {products.map((p) => (
                  <div key={p.id} className="admin-product-row">
                    <div className="admin-product-img" style={{ backgroundImage: `url(${p.image})` }} />
                    <div className="admin-product-info">
                      <strong>{p.name}</strong>
                      <span>${p.price.toFixed(2)} · {p.category}</span>
                    </div>
                    <button className="btn-delete" onClick={() => handleDeleteProduct(p.id, p.name)}>🗑️ Delete</button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    );
  }

  // ─── Store ─────────────────────────────────────────────────────
  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">LuminaStore</div>

        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <input type="text" placeholder="Search products..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
            <button type="submit" className="search-btn">🔍</button>
          </form>
        </div>

        <div className="nav-actions">
          {isAdmin && (
            <button className="btn-admin" onClick={() => setIsAdminPanelOpen(true)}>🛡️ Admin Panel</button>
          )}
          <span className="welcome-text">Hi, {user.name}</span>
          {!isAdmin && (
            <button className="cart-toggle-btn" onClick={() => setIsCartOpen(!isCartOpen)}>
              🛒 Cart
              {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
            </button>
          )}
          <button className="btn-logout" onClick={logout}>Logout</button>
        </div>
      </nav>

      <main className="main-content">
        <header className="hero-section">
          {isSearching ? (
            <>
              <h1>Search Results</h1>
              <p>Showing results for "{searchQuery}"</p>
            </>
          ) : (
            <>
              <h1>Discover Premium Products</h1>
              <p>Elevate your lifestyle with our curated collection.</p>
            </>
          )}
        </header>

        <section className="products-grid">
          {!Array.isArray(products) ? (
            <p className="loading">Loading products...</p>
          ) : products.length === 0 ? (
            <div className="no-results">
              <h3>No products found!</h3>
              <p>Try searching with a different keyword.</p>
              <button onClick={() => { setSearchQuery(''); setIsSearching(false); fetchProducts(); }} className="btn-clear-search">
                Clear Search
              </button>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image" style={{ backgroundImage: `url(${product.image})` }}>
                  {isAdmin && (
                    <button className="btn-delete-overlay" onClick={() => handleDeleteProduct(product.id, product.name)}>🗑️</button>
                  )}
                </div>
                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-desc">{product.description}</p>
                  <div className="product-footer">
                    <span className="product-price">${product.price.toFixed(2)}</span>
                    {!isAdmin && (
                      <button className="btn-add-cart" onClick={() => addToCart(product)}>Add to Cart</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Shopping Cart Sidebar */}
      {!isAdmin && (
        <aside className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
          <div className="cart-header">
            <h2>Your Cart</h2>
            <button className="close-cart-btn" onClick={() => setIsCartOpen(false)}>×</button>
          </div>

          <div className="cart-items">
            {!Array.isArray(cart) || cart.length === 0 ? (
              <p className="empty-cart">Your cart is empty.</p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item-image" />
                  <div className="cart-item-details">
                    <h4>{item.name}</h4>
                    <p className="cart-item-price">${item.price.toFixed(2)} x {item.quantity}</p>
                  </div>
                  <button className="remove-item-btn" onClick={() => removeFromCart(item.id)}>🗑️</button>
                </div>
              ))
            )}
          </div>

          {Array.isArray(cart) && cart.length > 0 && (
            <div className="cart-footer">
              <div className="cart-total">
                <span>Total:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <button className="btn-checkout">Proceed to Checkout</button>
            </div>
          )}
        </aside>
      )}

      {isCartOpen && !isAdmin && <div className="overlay" onClick={() => setIsCartOpen(false)}></div>}
    </div>
  );
}

export default App;
