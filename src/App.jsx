import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, X, Check, LogOut, Edit2, Trash2, Upload } from "lucide-react";
import { CldUploadWidget } from 'cloudinary-react';
import { db } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

const SHOP_OWNER_PHONE = "917299731118";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

/* ===============================
   ADMIN LOGIN
================================ */
function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '16px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: 'clamp(24px, 5vw, 32px)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxWidth: '400px', width: '100%' }}>
        <h1 style={{ fontSize: 'clamp(24px, 6vw, 28px)', fontWeight: 'bold', textAlign: 'center', marginBottom: '24px', marginTop: 0 }}>Admin Login</h1>
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          onKeyPress={(e) => e.key === 'Enter' && (password === ADMIN_PASSWORD ? onLogin() : setError("Invalid password"))}
          style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box', marginBottom: '12px', fontSize: '16px', minHeight: '44px' }}
        />
        {error && <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '12px' }}>{error}</p>}
        <button
          onClick={() => password === ADMIN_PASSWORD ? onLogin() : setError("Invalid password")}
          style={{ width: '100%', backgroundColor: '#f43f5e', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '16px', minHeight: '48px' }}
        >
          Login
        </button>
      </div>
    </div>
  );
}

/* ===============================
   ADMIN DASHBOARD
================================ */
function AdminDashboard({ onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', category: '', description: '', image: null, imagePreview: '' });
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.category || !formData.description) {
      alert("Please fill all fields");
      return;
    }

    if (!editingId && !formData.imagePreview) {
      alert("Please select an image");
      return;
    }

    setUploading(true);

    try {
      // imagePreview is already set from Cloudinary widget
      const imageUrl = formData.imagePreview;

      const productData = {
        name: formData.name,
        price: Number(formData.price),
        category: formData.category,
        description: formData.description,
        image: imageUrl,
        updatedAt: new Date(),
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
        setMessage("✓ Product updated!");
      } else {
        await addDoc(collection(db, "products"), productData);
        setMessage("✓ Product added!");
      }

      setShowForm(false);
      setFormData({ name: '', price: '', category: '', description: '', image: null, imagePreview: '' });
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving product:", error);
      setMessage("✗ Error: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, imageUrl) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      setMessage("✓ Deleted!");
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      setMessage("✗ Error: " + error.message);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description,
      image: null,
      imagePreview: product.image,
    });
    setShowForm(true);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Admin Dashboard</h1>
        <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', minHeight: '44px' }}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', paddingBottom: '32px' }}>
        {message && <div style={{ backgroundColor: message.includes('✓') ? '#dcfce7' : '#fee2e2', color: message.includes('✓') ? '#22c55e' : '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>{message}</div>}

        <button
          onClick={() => { setEditingId(null); setFormData({ name: '', price: '', category: '', description: '', image: null, imagePreview: '' }); setShowForm(true); }}
          style={{ width: '100%', backgroundColor: '#f43f5e', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginBottom: '24px', fontSize: '16px', minHeight: '48px' }}
        >
          + Add Product
        </button>

        {loading && <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>Loading products...</div>}

        {showForm && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '500px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>{editingId ? 'Edit' : 'Add'} Product</h2>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', minHeight: '44px', minWidth: '44px' }}>×</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder="Product Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box', fontSize: '16px', minHeight: '44px' }} />
                <input type="number" placeholder="Price (₹)" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} style={{ padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box', fontSize: '16px', minHeight: '44px' }} />
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box', fontSize: '16px', minHeight: '44px' }}>
                  <option value="">Select Category</option>
                  <option>Cakes</option>
                  <option>Cupcakes</option>
                  <option>Pastries</option>
                </select>
                <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', minHeight: '100px', boxSizing: 'border-box', fontSize: '16px', fontFamily: 'inherit' }} />

                <CldUploadWidget
                  cloudName={CLOUDINARY_CLOUD_NAME}
                  uploadPreset="little_patisserie"
                  onSuccess={(result) => {
                    setFormData({
                      ...formData,
                      imagePreview: result.event.info.secure_url,
                    });
                  }}
                >
                  {({ open }) => (
                    <div>
                      <button
                        type="button"
                        onClick={() => open()}
                        style={{ width: '100%', border: '2px dashed #e5e7eb', borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px', minHeight: '120px' }}
                      >
                        <Upload size={32} style={{ color: '#6b7280' }} />
                        <div style={{ fontWeight: '500', color: '#374151' }}>Click to upload image</div>
                        <div style={{ fontSize: '13px', color: '#9ca3af' }}>PNG, JPG (auto-compressed)</div>
                      </button>
                    </div>
                  )}
                </CldUploadWidget>

                {formData.imagePreview && <img src={formData.imagePreview} alt="Preview" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px' }} />}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontWeight: '600', minHeight: '48px', fontSize: '16px' }}>Cancel</button>
                  <button onClick={handleSave} disabled={uploading} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: uploading ? '#9ca3af' : '#f43f5e', color: 'white', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 'bold', minHeight: '48px', fontSize: '16px' }}>
                    {uploading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {products.map(p => (
              <div key={p.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <img src={p.image} alt={p.name} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{p.name}</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>{p.category}</p>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#f43f5e', margin: '0 0 14px 0' }}>₹{p.price}</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(p)} style={{ flex: 1, padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '14px', minHeight: '44px' }}><Edit2 size={16} /> Edit</button>
                    <button onClick={() => handleDelete(p.id, p.image)} style={{ flex: 1, padding: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '14px', minHeight: '44px' }}><Trash2 size={16} /> Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===============================
   USER SHOP (MOBILE-FIRST OPTIMIZED)
================================ */
function UserShop({ onAdminClick }) {
  const [cart, setCart] = useState({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [placed, setPlaced] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdminBtn, setShowAdminBtn] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addToCart = (id) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeFromCart = (id) => setCart(prev => { const copy = { ...prev }; copy[id] > 1 ? copy[id]-- : delete copy[id]; return copy; });
  const deleteFromCart = (id) => setCart(prev => { const copy = { ...prev }; delete copy[id]; return copy; });

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = Object.entries(cart).reduce((sum, [id, qty]) => sum + (products.find(i => i.id === id)?.price || 0) * qty, 0);

  const placeOrder = () => {
    if (!name || !phone || !/^\d{10}$/.test(phone) || Object.keys(cart).length === 0) {
      alert("Please fill all fields correctly and add items");
      return;
    }
    let message = `*New Order*%0A%0AName: ${name}%0APhone: ${phone}%0A%0A*Items:*%0A`;
    Object.entries(cart).forEach(([id, qty]) => {
      const item = products.find(i => i.id === id);
      if (item) message += `- ${item.name} x${qty} (₹${item.price * qty})%0A`;
    });
    message += `%0A*Total:* ₹${total}`;
    setCart({}); setName(""); setPhone(""); setPlaced(true); setShowCart(false);
    setTimeout(() => { setPlaced(false); window.open(`https://wa.me/${SHOP_OWNER_PHONE}?text=${message}`, "_blank"); }, 1500);
  };

  const categories = ["All", ...new Set(products.map(i => i.category))];
  const filtered = selectedCategory === "All" ? products : products.filter(i => i.category === selectedCategory);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <p style={{ color: '#6b7280' }}>Loading menu...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 'bold', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>The Little Patisserie</h1>
            <p style={{ fontSize: 'clamp(11px, 3vw, 13px)', color: '#6b7280', margin: '2px 0 0 0', cursor: 'pointer' }} onClick={() => setShowAdminBtn(!showAdminBtn)}>Handcrafted with love</p>
          </div>
          {showAdminBtn && (
            <button onClick={() => onAdminClick()} style={{ fontSize: '12px', padding: '6px 10px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', minHeight: '40px', whiteSpace: 'nowrap' }}>Admin</button>
          )}
          <button onClick={() => setShowCart(true)} style={{ position: 'relative', backgroundColor: '#f43f5e', color: 'white', padding: 'clamp(8px, 2vw, 12px)', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', minHeight: '44px', minWidth: '44px' }}>
            <ShoppingCart size={20} />
            {cartCount > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#f97316', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{cartCount}</span>}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '100%', margin: '0 auto', padding: 'clamp(12px, 4vw, 20px)' }}>
        <div style={{ marginBottom: 'clamp(16px, 4vw, 24px)', overflowX: 'auto', paddingBottom: '8px', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', gap: '8px', minWidth: 'fit-content', paddingRight: '16px' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)', borderRadius: '20px', whiteSpace: 'nowrap', border: selectedCategory === cat ? 'none' : '1px solid #e5e7eb', backgroundColor: selectedCategory === cat ? '#f43f5e' : 'white', color: selectedCategory === cat ? 'white' : '#374151', cursor: 'pointer', fontWeight: '500', fontSize: 'clamp(12px, 3vw, 14px)', minHeight: '40px', transition: 'all 0.2s' }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'clamp(12px, 3vw, 16px)', paddingBottom: '120px' }}>
          {filtered.map(item => (
            <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <img src={item.image} alt={item.name} style={{ width: '100%', height: 'clamp(100px, 25vw, 130px)', objectFit: 'cover' }} />
              <div style={{ padding: 'clamp(10px, 2vw, 12px)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: '600', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h3>
                <p style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: '#6b7280', margin: 'clamp(4px, 1vw, 6px) 0 auto 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'clamp(8px, 2vw, 10px)', gap: '8px' }}>
                  <span style={{ fontSize: 'clamp(13px, 3vw, 15px)', fontWeight: 'bold' }}>₹{item.price}</span>
                  {cart[item.id] ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#f43f5e', color: 'white', borderRadius: '6px', padding: '4px 6px' }}>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', display: 'flex', minHeight: '32px', minWidth: '32px', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '18px', textAlign: 'center' }}>{cart[item.id]}</span>
                      <button onClick={() => addToCart(item.id)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', display: 'flex', minHeight: '32px', minWidth: '32px', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item.id)} style={{ backgroundColor: 'white', color: '#f43f5e', border: '1.5px solid #f43f5e', padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 14px)', borderRadius: '6px', fontWeight: '600', fontSize: 'clamp(11px, 2.5vw, 13px)', cursor: 'pointer', minHeight: '36px', transition: 'all 0.2s' }}>Add</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 'clamp(12px, 3vw, 16px)', background: 'linear-gradient(to top, white 70%, transparent)', zIndex: 30 }}>
          <button onClick={() => setShowCart(true)} style={{ width: '100%', backgroundColor: '#f43f5e', color: 'white', padding: 'clamp(12px, 3vw, 14px)', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', cursor: 'pointer', fontSize: 'clamp(13px, 3vw, 15px)', minHeight: '48px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShoppingCart size={18} /> {cartCount} {cartCount === 1 ? "item" : "items"}</span>
            <span>₹{total}</span>
          </button>
        </div>
      )}

      {showCart && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', width: '100%', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ backgroundColor: '#f43f5e', color: 'white', padding: 'clamp(14px, 3vw, 16px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><h2 style={{ margin: 0, fontSize: 'clamp(18px, 4vw, 20px)' }}>Your Cart</h2><p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>{cartCount} items</p></div>
              <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(12px, 3vw, 16px)' }}>
              {cartCount === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>
                  <ShoppingCart size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                  <p>Cart is empty</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(cart).map(([id, qty]) => {
                    const item = products.find(i => i.id === id);
                    return item ? (
                      <div key={id} style={{ display: 'flex', gap: '10px', backgroundColor: '#f9fafb', borderRadius: '10px', padding: '10px', border: '1px solid #e5e7eb' }}>
                        <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: '600', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h3>
                          <p style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 'bold', color: '#f43f5e', margin: 0 }}>₹{item.price}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'white', borderRadius: '6px', padding: '3px 6px', border: '1px solid #e5e7eb' }}>
                            <button onClick={() => removeFromCart(id)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px', display: 'flex', minHeight: '32px', minWidth: '32px', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '14px', textAlign: 'center' }}>{qty}</span>
                            <button onClick={() => addToCart(id)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px', display: 'flex', minHeight: '32px', minWidth: '32px', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                          </div>
                          <button onClick={() => deleteFromCart(id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', fontWeight: '500', minHeight: '32px' }}>Remove</button>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {cartCount > 0 && (
              <div style={{ borderTop: '1px solid #e5e7eb', backgroundColor: 'white', padding: 'clamp(12px, 3vw, 16px)', display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2vw, 12px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 'clamp(14px, 3vw, 16px)', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                  <span>Total</span>
                  <span style={{ color: '#f43f5e' }}>₹{total}</span>
                </div>
                <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box', fontSize: '16px', minHeight: '44px' }} />
                <input type="tel" placeholder="Phone (10 digits)" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength="10" style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box', fontSize: '16px', minHeight: '44px' }} />
                <button onClick={placeOrder} style={{ width: '100%', backgroundColor: '#f43f5e', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '16px', minHeight: '48px' }}>Order via WhatsApp</button>
              </div>
            )}
          </div>
        </div>
      )}

      {placed && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: 'clamp(24px, 5vw, 32px)', textAlign: 'center', maxWidth: '350px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Check size={28} style={{ color: '#22c55e' }} /></div>
            <h3 style={{ fontSize: 'clamp(18px, 4vw, 20px)', fontWeight: 'bold', margin: '0 0 8px 0' }}>Order Placed!</h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: 'clamp(13px, 3vw, 15px)' }}>Redirecting to WhatsApp...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('shop');
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  if (page === 'admin') {
    if (!adminLoggedIn) {
      return <AdminLogin onLogin={() => setAdminLoggedIn(true)} />;
    }
    return <AdminDashboard onLogout={() => { setAdminLoggedIn(false); setPage('shop'); }} />;
  }

  return <UserShop onAdminClick={() => setPage('admin')} />;
}