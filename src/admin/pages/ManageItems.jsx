import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import AdminNavbar from "../components/AdminNavbar";
import { Plus, Edit, Trash2, Menu } from "lucide-react";
import { broadcastMenuUpdate } from "../utils/BroadCastHelper";

/* Same shell as other pages — only items-grid uses 280px so more cards fit */
const SHARED = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .admin-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    width:100vw;
    background: #f5f5f5;
    font-family: 'Poppins', sans-serif;
  }
  .page-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.75rem 2rem;
    -webkit-overflow-scrolling: touch;
  }
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.1rem;
    width: 100%;
  }
  .a-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 5px rgba(0,0,0,.08);
    overflow: hidden;
    transition: box-shadow .2s;
  }
  .a-card:hover {
    box-shadow: 0 4px 18px rgba(0,0,0,.13);
  }
  .empty-state {
    grid-column: 1/-1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    color: #ccc;
    gap: .75rem;
  }
  .empty-state p {
    color: #aaa;
    font-size: .92rem;
  }
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.48);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 500;
    padding: 1rem;
  }
  .modal-box {
    background: #fff;
    border-radius: 14px;
    padding: 1.65rem;
    width: 100%;
    max-width: 450px;
    max-height: 92vh;
    overflow-y: auto;
  }
  .modal-box h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
  .cat-box {
    background: #fff;
    border-radius: 14px;
    padding: 1.65rem;
    width: 100%;
    max-width: 340px;
    max-height: 70vh;
    overflow-y: auto;
  }
  .cat-box h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: .9rem;
  }
  .cat-list {
    display: flex;
    flex-direction: column;
    gap: .48rem;
  }
  .cat-item {
    padding: .75rem .9rem;
    border: 2px solid #e5e5e5;
    border-radius: 8px;
    cursor: pointer;
    font-size: .85rem;
    font-weight: 500;
    transition: all .18s;
  }
  .cat-item:hover {
    border-color: #000;
    background: #fafafa;
  }
  .cat-item.active {
    border-color: #000;
    background: #000;
    color: #fff;
  }
  .item-form {
    display: flex;
    flex-direction: column;
    gap: .75rem;
  }
  .item-form input,
  .item-form textarea,
  .item-form select {
    padding: .65rem .85rem;
    border: 1.5px solid #e5e5e5;
    border-radius: 8px;
    font-family: inherit;
    font-size: .875rem;
    background: #fafafa;
    width: 100%;
    transition: border-color .2s, background .2s;
  }
  .item-form input:focus,
  .item-form textarea:focus,
  .item-form select:focus {
    outline: none;
    border-color: #000;
    background: #fff;
  }
  .item-form textarea {
    resize: vertical;
    min-height: 66px;
  }
  .file-lbl {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .38rem;
    padding: .65rem;
    border: 1.5px dashed #ddd;
    border-radius: 8px;
    background: #fafafa;
    cursor: pointer;
    font-size: .83rem;
    color: #777;
    transition: all .2s;
  }
  .file-lbl:hover {
    border-color: #000;
    background: #f0f0f0;
  }
  .file-lbl.got-file {
    border-color: #4caf50;
    background: #f0fdf4;
    color: #16a34a;
  }
  .img-prev {
    width: 100%;
    height: 125px;
    object-fit: cover;
    border-radius: 8px;
  }
  .chk-lbl {
    display: flex;
    align-items: center;
    gap: .45rem;
    font-size: .83rem;
    cursor: pointer;
  }
  .form-actions {
    display: flex;
    gap: .65rem;
  }
  .btn-c,
  .btn-k {
    flex: 1;
    padding: .7rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-family: inherit;
    font-size: .875rem;
    transition: all .2s;
  }
  .btn-c {
    background: #f0f0f0;
  }
  .btn-c:hover {
    background: #e0e0e0;
  }
  .btn-k {
    background: #000;
    color: #fff;
  }
  .btn-k:hover {
    background: #222;
  }
  .btn-k:disabled {
    background: #999;
    cursor: not-allowed;
  }
  @media (max-width: 768px) {
    .page-body {
      padding: 1rem;
    }
    .cards-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const ManageItems = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category_id: "",
    image_url: "",
    avaliable: true,
  });

  useEffect(() => {
    fetchCategories();
    fetchItems();
    const ch = supabase
      .channel("items-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        fetchItems,
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  useEffect(() => {
     const checkAuth = async () => {
       const { data: { user }, error } = await supabase.auth.getUser();
       console.log('Current user:', user);
       console.log('Auth error:', error);
     };
     checkAuth();
   }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true });
    setCategories(data || []);
    setSelectedCategory((p) => p ?? data?.[0] ?? null);
  };

  const fetchItems = async () => {
    const { data } = await supabase
      .from("items")
      .select("*, categories(name)")
      .order("created_at", { ascending: true });
    setItems(data || []);
  };

  const filteredItems = selectedCategory
    ? items.filter((i) => i.category_id === selectedCategory.id)
    : [];

  const handleToggle = async (id, val) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, avaliable: val } : i)));
    const { error } = await supabase
      .from("items")
      .update({ avaliable: val })
      .eq("id", id);
    if (!error) await broadcastMenuUpdate();
    else
      setItems((p) =>
        p.map((i) => (i.id === id ? { ...i, avaliable: !val } : i)),
      );
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    if (imagePreviewUrl.startsWith("blob:"))
      URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category_id) {
      alert("Please select a category.");
      return;
    }
    setUploading(true);
    try {
      let imageUrl = formData.image_url;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `items/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("food-images")
          .upload(path, imageFile);
        if (upErr) throw upErr;
        imageUrl = supabase.storage.from("food-images").getPublicUrl(path)
          .data.publicUrl;
      }
      const payload = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim() || null,
        category_id: formData.category_id,
        image_url: imageUrl || null,
        avaliable: formData.avaliable,
      };
      if (editingItem) {
        const { error } = await supabase
          .from("items")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("items").insert([payload]);
        if (error) throw error;
      }
      await broadcastMenuUpdate();
      resetForm();
      fetchItems();
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    setItems((p) => p.filter((i) => i.id !== id));
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (!error) await broadcastMenuUpdate();
    else fetchItems();
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setImageFile(null);
    setImagePreviewUrl(item.image_url || "");
    setFormData({
      name: item.name || "",
      price: item.price ?? "",
      description: item.description || "",
      category_id: item.category_id || "",
      image_url: item.image_url || "",
      avaliable: item.avaliable ?? true,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    if (imagePreviewUrl.startsWith("blob:"))
      URL.revokeObjectURL(imagePreviewUrl);
    setFormData({
      name: "",
      price: "",
      description: "",
      category_id: "",
      image_url: "",
      avaliable: true,
    });
    setImageFile(null);
    setImagePreviewUrl("");
    setEditingItem(null);
    setShowForm(false);
  };

  return (
    <>
      <style>
        {SHARED}
        {`
        /* ── Item card layout (unique to this page) ── */
        .item-card-inner {
          padding: .85rem;
          display: flex;
          gap: .75rem;
          align-items: center;
        }
        .item-img {
          width: 64px;
          height: 64px;
          object-fit: cover;
          border-radius: 8px;
          flex-shrink: 0;
          background: #f0f0f0;
        }
        .item-info {
          flex: 1;
          min-width: 0;
        }
        .item-name {
          font-size: .875rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: .18rem;
        }
        .item-name.dim {
          color: #c0c0c0;
        }
        .item-price {
          font-size: .8rem;
          color: #555;
          font-weight: 600;
        }
        .item-actions {
          display: flex;
          gap: .38rem;
          align-items: center;
          flex-shrink: 0;
        }
        .toggle-sw {
          position: relative;
          width: 42px;
          height: 22px;
        }
        .toggle-sw input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .tog-track {
          position: absolute;
          inset: 0;
          background: #d1d5db;
          border-radius: 999px;
          cursor: pointer;
          transition: background .28s;
        }
        .tog-track:before {
          content: "";
          position: absolute;
          width: 14px;
          height: 14px;
          top: 4px;
          left: 4px;
          background: #fff;
          border-radius: 50%;
          transition: transform .28s;
        }
        .toggle-sw input:checked + .tog-track {
          background: #4caf50;
        }
        .toggle-sw input:checked + .tog-track:before {
          transform: translateX(20px);
        }
        .icon-btn {
          background: #f0f0f0;
          border: none;
          padding: .4rem;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: #333;
          transition: background .18s, color .18s;
        }
        .icon-btn:hover {
          background: #e0e0e0;
        }
        .icon-btn.del:hover {
          background: #fee2e2;
          color: #dc2626;
        }
        /* page header */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: .75rem;
        }
        .page-header h2 {
          font-size: 1.15rem;
          font-weight: 600;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: .65rem;
          flex-wrap: wrap;
        }
        .cat-badge {
          background: #000;
          color: #fff;
          padding: .32rem .85rem;
          border-radius: 20px;
          font-size: .75rem;
          font-weight: 500;
        }
        .btn-add {
          background: #000;
          color: #fff;
          border: none;
          padding: .58rem 1.05rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: .35rem;
          cursor: pointer;
          font-weight: 500;
          font-family: inherit;
          font-size: .82rem;
          white-space: nowrap;
          transition: background .2s;
        }
        .btn-add:hover {
          background: #222;
        }
        /* floating category button */
        .fab {
          position: fixed;
          bottom: 1.75rem;
          right: 1.75rem;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #000;
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0,0,0,.2);
          z-index: 100;
          transition: transform .2s, background .2s;
        }
        .fab:hover {
          transform: scale(1.07);
          background: #222;
        }
      `}
      </style>

      <div className="admin-page">
        <AdminNavbar currentPage="stock" />
        <div className="page-body">
          <div className="page-header">
            <h2>Menu Management</h2>
            <div className="header-right">
              {selectedCategory && (
                <span className="cat-badge">{selectedCategory.name}</span>
              )}
              <button
                className="btn-add"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                <Plus size={15} /> Add Item
              </button>
            </div>
          </div>

          <div className="cards-grid">
            {filteredItems.length === 0 ? (
              <div className="empty-state">
                <Menu size={50} />
                <p>No items in this category</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="a-card">
                  <div className="item-card-inner">
                    <img
                      src={item.image_url || "./food-img.svg"}
                      alt={item.name}
                      className="item-img"
                      onError={(e) => {
                        e.target.src = "./food-img.svg";
                      }}
                    />
                    <div className="item-info">
                      <p
                        className={`item-name ${!item.avaliable ? "dim" : ""}`}
                      >
                        {item.name}
                      </p>
                      <p className="item-price">₹{item.price}</p>
                    </div>
                    <div className="item-actions">
                      <label className="toggle-sw">
                        <input
                          type="checkbox"
                          checked={!!item.avaliable}
                          onChange={() =>
                            handleToggle(item.id, !item.avaliable)
                          }
                        />
                        <span className="tog-track" />
                      </label>
                      <button
                        className="icon-btn"
                        onClick={() => startEdit(item)}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="icon-btn del"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <button className="fab" onClick={() => setShowCategoryMenu(true)}>
        <Menu size={19} />
      </button>

      {showCategoryMenu && (
        <div className="overlay" onClick={() => setShowCategoryMenu(false)}>
          <div className="cat-box" onClick={(e) => e.stopPropagation()}>
            <h3>Select Category</h3>
            <div className="cat-list">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`cat-item ${selectedCategory?.id === cat.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setShowCategoryMenu(false);
                  }}
                >
                  {cat.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="overlay" onClick={resetForm}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? "Edit Item" : "Add New Item"}</h3>
            <form className="item-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Item name *"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <input
                type="number"
                placeholder="Price (₹) *"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
                step="0.01"
                min="0"
              />
              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <select
                value={formData.category_id}
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
                required
              >
                <option value="">Select a category *</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div>
                <label
                  htmlFor="img-up"
                  className={`file-lbl ${imageFile || formData.image_url ? "got-file" : ""}`}
                >
                  {imageFile
                    ? `📷 ${imageFile.name}`
                    : formData.image_url
                      ? "📷 Image saved — click to change"
                      : "📷 Choose image (optional)"}
                </label>
                <input
                  id="img-up"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </div>
              {imagePreviewUrl && (
                <img src={imagePreviewUrl} alt="Preview" className="img-prev" />
              )}
              <label className="chk-lbl">
                <input
                  type="checkbox"
                  checked={formData.avaliable}
                  onChange={(e) =>
                    setFormData({ ...formData, avaliable: e.target.checked })
                  }
                />
                Available in stock
              </label>
              <div className="form-actions">
                <button type="button" className="btn-c" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-k" disabled={uploading}>
                  {uploading
                    ? "Saving…"
                    : editingItem
                      ? "Update Item"
                      : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageItems;
