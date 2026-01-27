import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, X, Check, LogOut, Edit2, Trash2, Upload } from "lucide-react";
import { db, storage } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const SHOP_OWNER_PHONE = "917299731118";
const ADMIN_PASSWORD = "admin123";

/* ===============================
   ADMIN LOGIN
================================ */
function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '16px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxWidth: '400px', width: '100%' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', textAlign: 'center', marginBottom: '24px', marginTop: 0 }}>Admin Login</h1>
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          onKeyPress={(e) => e.key === 'Enter' && (password === ADMIN_PASSWORD ? onLogin() : setError("Invalid password"))}
          style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box', marginBottom: '12px', fontSize: '16px' }}
        />
        {error && <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '12px' }}>{error}</p>}
        <button
          onClick={() => password === ADMIN_PASSWORD ? onLogin() : setError("Invalid password")}
          style={{ width: '100%', backgroundColor: '#f43f5e', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '16px' }}
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

  // Real-time listener for products from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, image: file, imagePreview: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.category || !formData.description) {
      alert("Please fill all fields");
      return;
    }

    if (!editingId && !formData.image) {
      alert("Please select an image");
      return;
    }

    setUploading(true);
    let imageUrl = formData.imagePreview;

    try {
      if (formData.image) {
        const storageRef = ref(storage, `products/${Date.now()}_${formData.image.name}`);
        await uploadBytes(storageRef, formData.image);
        imageUrl = await getDownloadURL(storageRef);
      }

      const productData = {
        name: formData.name,
        price: Number(formData.price),
        category: formData.category,
        description: formData.description,
        image: imageUrl,
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
      if (imageUrl && imageUrl.includes("firebasestorage")) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (e) {
          console.log("Image delete error");
        }
      }
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
        <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', paddingBottom: '32px' }}>
        {message && <div style={{ backgroundColor: message.includes('✓') ? '#dcfce7' : '#fee2e2', color: message.includes('✓') ? '#22c55e' : '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>{message}</div>}

        <button
          onClick={() => { setEditingId(null); setFormData({ name: '', price: '', category: '', description: '', image: null, imagePreview: '' }); setShowForm(true); }}
          style={{ width: '100%', backgroundColor: '#f43f5e', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginBottom: '24px', fontSize: '16px' }}
        >
          + Add Product
        </button>

        {loading && <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>Loading products...</div>}

        {showForm && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '500px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>{editingId ? 'Edit' : 'Add'} Product</h2>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>×</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder="Product Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box', fontSize: '14px' }} />
                <input type="number" placeholder="Price (₹)" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} style={{ padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box', fontSize: '14px' }} />
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box', fontSize: '14px' }}>
                  <option value="">Select Category</option>
                  <option>Cakes</option>
                  <option>Cupcakes</option>
                  <option>Pastries</option>
                </select>
                <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', minHeight: '80px', boxSizing: 'border-box', fontSize: '14px', fontFamily: 'inherit' }} />

                <label style={{ border: '2px dashed #e5e7eb', borderRadius: '8px', padding: '20px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f9fafb' }}>
                  <Upload size={28} style={{ marginBottom: '8px', color: '#6b7280' }} />
                  <div style={{ fontWeight: '500', color: '#374151' }}>Click to upload image</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>PNG, JPG up to 5MB</div>
                  <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                </label>

                {formData.imagePreview && <img src={formData.imagePreview} alt="Preview" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                  <button onClick={handleSave} disabled={uploading} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: uploading ? '#9ca3af' : '#f43f5e', color: 'white', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                    {uploading ? 'Uploading...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {products.map(p => (
              <div key={p.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <img src={p.image} alt={p.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                <div style={{ padding: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>{p.name}</h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0' }}>{p.category}</p>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#f43f5e', margin: '0 0 12px 0' }}>₹{p.price}</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(p)} style={{ flex: 1, padding: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px' }}><Edit2 size={14} /> Edit</button>
                    <button onClick={() => handleDelete(p.id, p.image)} style={{ flex: 1, padding: '8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px' }}><Trash2 size={14} /> Delete</button>
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
   USER SHOP (MOBILE OPTIMIZED)
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

  // Real-time listener for products from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
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
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>The Little Patisserie</h1>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0', cursor: 'pointer' }} onClick={() => setShowAdminBtn(!showAdminBtn)}>Handcrafted with love</p>
          </div>
          {showAdminBtn && (
            <button onClick={() => onAdminClick()} style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Admin</button>
          )}
          <button onClick={() => setShowCart(true)} style={{ position: 'relative', backgroundColor: '#f43f5e', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer' }}>
            <ShoppingCart size={18} />
            {cartCount > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#f97316', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{cartCount}</span>}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
        <div style={{ marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap', border: selectedCategory === cat ? 'none' : '1px solid #e5e7eb', backgroundColor: selectedCategory === cat ? '#f43f5e' : 'white', color: selectedCategory === cat ? 'white' : '#374151', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', paddingBottom: '100px' }}>
          {filtered.map(item => (
            <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <img src={item.image} alt={item.name} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
              <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '600', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h3>
                <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 auto 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>₹{item.price}</span>
                  {cart[item.id] ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f43f5e', color: 'white', borderRadius: '6px', padding: '3px 6px' }}>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '1px' }}><Minus size={12} /></button>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>{cart[item.id]}</span>
                      <button onClick={() => addToCart(item.id)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '1px' }}><Plus size={12} /></button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item.id)} style={{ backgroundColor: 'white', color: '#f43f5e', border: '1.5px solid #f43f5e', padding: '4px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '11px', cursor: 'pointer' }}>Add</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px', background: 'linear-gradient(to top, white, white, transparent)', zIndex: 30 }}>
          <button onClick={() => setShowCart(true)} style={{ width: '100%', backgroundColor: '#f43f5e', color: 'white', padding: '12px', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShoppingCart size={16} /> {cartCount} items</span>
            <span>₹{total}</span>
          </button>
        </div>
      )}

      {showCart && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ backgroundColor: 'white', width: '100%', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ backgroundColor: '#f43f5e', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><h2 style={{ margin: 0, fontSize: '18px' }}>Your Cart</h2><p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>{cartCount} items</p></div>
              <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
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
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>{item.name}</h3>
                          <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#f43f5e', margin: 0 }}>₹{item.price}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'white', borderRadius: '6px', padding: '3px 6px', border: '1px solid #e5e7eb' }}>
                            <button onClick={() => removeFromCart(id)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '2px' }}><Minus size={12} /></button>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '14px', textAlign: 'center' }}>{qty}</span>
                            <button onClick={() => addToCart(id)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '2px' }}><Plus size={12} /></button>
                          </div>
                          <button onClick={() => deleteFromCart(id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>Remove</button>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {cartCount > 0 && (
              <div style={{ borderTop: '1px solid #e5e7eb', backgroundColor: 'white', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                  <span>Total</span>
                  <span style={{ color: '#f43f5e' }}>₹{total}</span>
                </div>
                <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box' }} />
                <input type="tel" placeholder="Phone (10 digits)" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength="10" style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box' }} />
                <button onClick={placeOrder} style={{ width: '100%', backgroundColor: '#f43f5e', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Order via WhatsApp</button>
              </div>
            )}
          </div>
        </div>
      )}

      {placed && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', maxWidth: '350px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Check size={28} style={{ color: '#22c55e' }} /></div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Order Placed!</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Redirecting to WhatsApp...</p>
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