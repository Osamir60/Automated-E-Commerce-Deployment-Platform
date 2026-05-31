import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Auth state
  const [user, setUser] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Service URLs
  const PRODUCT_SERVICE_URL = import.meta.env.VITE_PRODUCT_SERVICE_URL || 'http://localhost:5001';
  const CART_SERVICE_URL = import.meta.env.VITE_CART_SERVICE_URL || 'http://localhost:5005';
  const AUTH_SERVICE_URL = import.meta.env.VITE_EMAIL_SERVICE_URL || 'http://localhost:5004';
  const SEARCH_SERVICE_URL = import.meta.env.VITE_SEARCH_SERVICE_URL || 'http://localhost:5002';

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCart();
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
          // If signup was successful, switch to login screen
          setIsLoginMode(true);
          setAuthSuccess('Account created successfully! Please log in.');
          setAuthForm({ ...authForm, password: '' }); // keep email, clear password
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
      } else {
        console.error('Failed to search products');
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
      const response = await fetch(`${CART_SERVICE_URL}/cart/${itemId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        const updatedCart = await response.json();
        setCart(updatedCart);
      }
    } catch (error) {
      console.error('Failed to remove from cart', error);
    }
  };

  const cartTotal = Array.isArray(cart) ? cart.reduce((total, item) => total + (item.price * item.quantity), 0) : 0;
  const cartItemCount = Array.isArray(cart) ? cart.reduce((count, item) => count + item.quantity, 0) : 0;

  // Render Auth Screen if not logged in
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
                <input 
                  type="text" 
                  value={authForm.name}
                  onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                  required 
                />
              </div>
            )}
            
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={authForm.email}
                onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                required 
              />
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

  // Render Store if logged in
  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">LuminaStore</div>
        
        {/* Search Bar */}
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              🔍
            </button>
          </form>
        </div>

        <div className="nav-actions">
          <span className="welcome-text">Hi, {user.name}</span>
          <button className="cart-toggle-btn" onClick={() => setIsCartOpen(!isCartOpen)}>
            🛒 Cart
            {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
          </button>
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
                <div className="product-image" style={{ backgroundImage: `url(${product.image})` }}></div>
                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-desc">{product.description}</p>
                  <div className="product-footer">
                    <span className="product-price">${product.price.toFixed(2)}</span>
                    <button className="btn-add-cart" onClick={() => addToCart(product)}>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Shopping Cart Sidebar */}
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

      {isCartOpen && <div className="overlay" onClick={() => setIsCartOpen(false)}></div>}
    </div>
  );
}

export default App;
