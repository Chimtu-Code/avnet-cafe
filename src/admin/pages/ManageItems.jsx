import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { Plus, Edit, Trash2, Menu } from "lucide-react";

const ManageItems = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imageFile, setImageFile] = useState(null);
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
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });
    setCategories(data || []);
    if (data && data.length > 0 && !selectedCategory) {
      setSelectedCategory(data[0]);
    }
  };

  const fetchItems = async () => {
    const { data } = await supabase
      .from("items")
      .select("*, categories(name)")
      .order("category_id", { ascending: false });
    setItems(data || []);
  };

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category_id === selectedCategory.id)
    : [];

  const handleToggleAvailability = async (itemId, available) => {
    const { error } = await supabase
      .from("items")
      .update({ avaliable: available })
      .eq("id", itemId);

    if (!error) fetchItems();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `items/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("cafeteria-images")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("cafeteria-images").getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const itemData = { ...formData, image_url: imageUrl };

      if (editingItem) {
        const { error } = await supabase
          .from("items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("items").insert([itemData]);
        if (error) throw error;
      }

      resetForm();
      fetchItems();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save item. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      const { error } = await supabase.from("items").delete().eq("id", itemId);
      if (!error) fetchItems();
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      price: item.price || "",
      description: item.description || "",
      category_id: item.category_id || "",
      image_url: item.image_url || "",
      avaliable: item.avaliable,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      description: "",
      category_id: "",
      image_url: "",
      avaliable: true,
    });
    setImageFile(null);
    setEditingItem(null);
    setShowForm(false);
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: #f5f5f5;
          font-family: 'Poppins', sans-serif;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .content-area {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .page-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
        }

        .category-badge {
          background: black;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
          max-width: 1400px;
        }

        .item-card {
          background: white;
          border-radius: 10px;
          padding: 1rem;
          display: flex;
          gap: 1rem;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .item-image {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
          flex-shrink: 0;
          background: #f0f0f0;
        }

        .item-info {
          flex: 1;
          min-width: 0;
        }

        .item-info h4 {
          margin-bottom: 0.25rem;
          font-size: 1rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-price {
          color: #666;
          font-weight: 600;
        }

        .item-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-shrink: 0;
        }

        .toggle-switch {
          position: relative;
          width: 50px;
          height: 26px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.4s;
          border-radius: 34px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }

        .toggle-switch input:checked + .toggle-slider {
          background-color: #4caf50;
        }

        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }

        .icon-btn {
          background: #f0f0f0;
          border: none;
          padding: 0.5rem;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .icon-btn:hover {
          background: #e0e0e0;
        }

        .floating-category-btn {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: black;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: all 0.3s;
          z-index: 900;
        }

        .floating-category-btn:hover {
          transform: scale(1.1);
          background: #333;
        }

        .category-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .category-menu-content {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          max-width: 400px;
          width: 90%;
          max-height: 70vh;
          overflow-y: auto;
        }

        .category-menu-content h3 {
          margin-bottom: 1.5rem;
          font-size: 1.25rem;
        }

        .category-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .category-item {
          padding: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .category-item:hover {
          border-color: black;
          background: #f9f9f9;
        }

        .category-item.active {
          border-color: black;
          background: black;
          color: white;
        }

        .btn-add {
          background: black;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          font-family: inherit;
          transition: background 0.2s;
        }

        .btn-add:hover {
          background: #333;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content h3 {
          margin-bottom: 1.5rem;
          font-size: 1.25rem;
        }

        .item-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .item-form input,
        .item-form textarea,
        .item-form select {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-family: inherit;
          font-size: 0.875rem;
        }

        .item-form textarea {
          resize: vertical;
          min-height: 80px;
        }

        .item-form input:focus,
        .item-form textarea:focus,
        .item-form select:focus {
          outline: none;
          border-color: #000;
        }

        .file-input-wrapper {
          position: relative;
          overflow: hidden;
          display: inline-block;
          width: 100%;
        }

        .file-input-label {
          padding: 0.75rem;
          border: 1px dashed #ddd;
          border-radius: 6px;
          background: #f9f9f9;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #666;
          transition: all 0.2s;
        }

        .file-input-label:hover {
          border-color: #000;
          background: #f0f0f0;
        }

        .file-input-label.has-file {
          border-color: #4caf50;
          background: #f0fdf4;
          color: #4caf50;
        }

        .file-input-wrapper input[type="file"] {
          position: absolute;
          left: -9999px;
        }

        .image-preview {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 6px;
          margin-bottom: 0.5rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .btn-cancel,
        .btn-submit {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-family: inherit;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: #f0f0f0;
        }

        .btn-submit {
          background: black;
          color: white;
        }

        .btn-cancel:hover {
          background: #e0e0e0;
        }

        .btn-submit:hover {
          background: #333;
        }

        .btn-submit:disabled {
          background: #999;
          cursor: not-allowed;
        }

        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          color: #999;
        }

        .empty-state p {
          margin-top: 1rem;
          font-size: 1.125rem;
        }

        @media (max-width: 768px) {
          .items-grid {
            grid-template-columns: 1fr;
          }

          .content-area {
            padding: 1rem;
          }

          .page-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .item-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .item-image {
            width: 100%;
            height: 150px;
          }

          .item-actions {
            width: 100%;
            justify-content: space-between;
          }

          .floating-category-btn {
            bottom: 1rem;
            right: 1rem;
          }
        }
      `}</style>

      <div className="admin-layout">
        <AdminSidebar isOpen={sidebarOpen} />
        <div className="main-content">
          <AdminNavbar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
            currentPage="stock"
          />
          <div className="content-area">
            <div className="page-header">
              <h2>Menu Management</h2>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {selectedCategory && (
                  <span className="category-badge">{selectedCategory.name}</span>
                )}
                <button
                  className="btn-add"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                >
                  <Plus size={20} /> Add Item
                </button>
              </div>
            </div>

            <div className="items-grid">
              {filteredItems.length === 0 ? (
                <div className="empty-state">
                  <Menu size={64} />
                  <p>No items in this category</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div key={item.id} className="item-card">
                    <img
                      src={item.image_url || "/api/placeholder/80/80"}
                      alt={item.name}
                      className="item-image"
                    />
                    <div className="item-info">
                      <h4>{item.name}</h4>
                      <p className="item-price">₹{item.price}</p>
                    </div>
                    <div className="item-actions">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={item.avaliable}
                          onChange={() =>
                            handleToggleAvailability(item.id, !item.avaliable)
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <button
                        className="icon-btn"
                        onClick={() => startEdit(item)}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        className="floating-category-btn"
        onClick={() => setShowCategoryMenu(true)}
      >
        <Menu size={24} />
      </button>

      {showCategoryMenu && (
        <div className="category-menu-overlay" onClick={() => setShowCategoryMenu(false)}>
          <div className="category-menu-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select Category</h3>
            <div className="category-list">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`category-item ${selectedCategory?.id === category.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(category);
                    setShowCategoryMenu(false);
                  }}
                >
                  {category.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? "Edit Item" : "Add New Item"}</h3>
            <div className="item-form">
              <input
                type="text"
                placeholder="Item Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
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
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <div className="file-input-wrapper">
                <label
                  htmlFor="image-upload"
                  className={`file-input-label ${imageFile || formData.image_url ? "has-file" : ""}`}
                >
                  {imageFile
                    ? `Selected: ${imageFile.name}`
                    : formData.image_url
                    ? "Image uploaded - Click to change"
                    : "📷 Choose Image"}
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                    }
                  }}
                />
              </div>

              {(imageFile || formData.image_url) && (
                <img
                  src={
                    imageFile
                      ? URL.createObjectURL(imageFile)
                      : formData.image_url
                  }
                  alt="Preview"
                  className="image-preview"
                />
              )}

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.avaliable}
                  onChange={(e) =>
                    setFormData({ ...formData, avaliable: e.target.checked })
                  }
                />
                Available in Stock
              </label>
              <div className="form-actions">
                <button onClick={resetForm} className="btn-cancel">
                  Cancel
                </button>
                <button onClick={handleSubmit} className="btn-submit" disabled={uploading}>
                  {uploading
                    ? "Uploading..."
                    : editingItem
                    ? "Update Item"
                    : "Add Item"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageItems;