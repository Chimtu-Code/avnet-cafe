import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Menu, FolderPlus } from "lucide-react";
import AdminNavbar from "../components/AdminNavbar";
import { broadcastMenuUpdate } from "../utils/BroadcastHelper";
import { supabase } from "../../../shared/services/supabaseClient";
import { uploadToCloudinary } from "../../../shared/utils/uploadToCloudinary";
import "../styles/ManageItems.css";

const EMPTY_FORM = {
  name: "",
  price: "",
  description: "",
  category_id: "",
  image_url: "",
  image_public_id: "",
  available: true,
};

const ManageItems = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [catSaving, setCatSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // ── Fetch ──────────────────────────────────────────────────────────
  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true });
    const cats = data ?? [];
    setCategories(cats);
    setSelectedCategory((prev) => prev ?? cats[0] ?? null);
  };

  const fetchItems = async () => {
    const { data } = await supabase
      .from("items")
      .select("*, categories(name)")
      .order("created_at", { ascending: true });
    setItems(data ?? []);
  };

  useEffect(() => {
    fetchCategories();
    fetchItems();
    const ch = supabase
      .channel("items-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "items" },
        (p) => setItems((prev) => [...prev, p.new]),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "items" },
        (p) =>
          setItems((prev) =>
            prev.map((i) => (i.id === p.new.id ? { ...i, ...p.new } : i)),
          ),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "items" },
        (p) => setItems((prev) => prev.filter((i) => i.id !== p.old.id)),
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  // ── Add Category ───────────────────────────────────────────────────
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatSaving(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([{ name: newCatName.trim() }])
        .select()
        .single();
      if (error) throw error;
      setCategories((prev) => [...prev, data]);
      setSelectedCategory(data);
      setNewCatName("");
      setShowCatForm(false);
      await broadcastMenuUpdate();
    } catch (err) {
      alert(`Failed to add category: ${err.message}`);
    } finally {
      setCatSaving(false);
    }
  };

  // ── Delete Category ────────────────────────────────────────────────
  const handleDeleteCategory = async (cat) => {
    const itemCount = items.filter((i) => i.category_id === cat.id).length;
    if (itemCount > 0) {
      alert(
        `Cannot delete "${cat.name}" — it has ${itemCount} item(s). Delete or move the items first.`,
      );
      return;
    }
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", cat.id);
    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      if (selectedCategory?.id === cat.id)
        setSelectedCategory(categories.find((c) => c.id !== cat.id) ?? null);
      await broadcastMenuUpdate();
    }
  };

  // ── Item handlers ──────────────────────────────────────────────────
  const filteredItems = selectedCategory
    ? items.filter((i) => i.category_id === selectedCategory.id)
    : [];

  const handleToggle = async (id, val) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, available: val } : i)),
    );
    const { error } = await supabase
      .from("items")
      .update({ available: val })
      .eq("id", id);
    if (error)
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, available: !val } : i)),
      );
    else await broadcastMenuUpdate();
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
    if (!formData.category_id) return alert("Please select a category.");
    setUploading(true);
    try {
      let imageUrl = formData.image_url,
        imagePublicId = formData.image_public_id;
      if (imageFile) {
        const result = await uploadToCloudinary(imageFile);
        imageUrl = result.url;
        imagePublicId = result.publicId;
      }
      const payload = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim() || null,
        category_id: formData.category_id,
        image_url: imageUrl || null,
        image_public_id: imagePublicId || null,
        available: formData.available,
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
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) fetchItems();
    else await broadcastMenuUpdate();
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
      image_public_id: item.image_public_id || "",
      available: item.available ?? true,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    if (imagePreviewUrl.startsWith("blob:"))
      URL.revokeObjectURL(imagePreviewUrl);
    setFormData(EMPTY_FORM);
    setImageFile(null);
    setImagePreviewUrl("");
    setEditingItem(null);
    setShowForm(false);
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
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
              className="btn-add-cat"
              onClick={() => {
                setNewCatName("");
                setShowCatForm(true);
              }}
            >
              <FolderPlus size={15} /> Add Category
            </button>
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
                    src={item.image_url || "/food-img.svg"}
                    alt={item.name}
                    className="item-img"
                    onError={(e) => {
                      e.target.src = "/food-img.svg";
                    }}
                  />
                  <div className="item-info">
                    <p className={`item-name ${!item.available ? "dim" : ""}`}>
                      {item.name}
                    </p>
                    <p className="item-price">₹{item.price}</p>
                  </div>
                  <div className="item-actions">
                    <label className="toggle-sw">
                      <input
                        type="checkbox"
                        checked={!!item.available}
                        onChange={() => handleToggle(item.id, !item.available)}
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

      {/* FAB — category picker */}
      <button className="fab" onClick={() => setShowCategoryMenu(true)}>
        <Menu size={19} />
      </button>

      {/* Category picker modal */}
      {showCategoryMenu && (
        <div className="overlay" onClick={() => setShowCategoryMenu(false)}>
          <div className="cat-box" onClick={(e) => e.stopPropagation()}>
            <h3>Categories</h3>
            <div className="cat-list">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`cat-item ${selectedCategory?.id === cat.id ? "active" : ""}`}
                >
                  <span
                    onClick={() => {
                      setSelectedCategory(cat);
                      setShowCategoryMenu(false);
                    }}
                    style={{ flex: 1 }}
                  >
                    {cat.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color:
                        selectedCategory?.id === cat.id ? "#fff" : "#dc2626",
                      padding: "0 4px",
                      fontSize: "16px",
                      textAlign: "right",
                    }}
                    title="Delete category"
                  >
                    <img
                      src="/image.png"
                      alt="x"
                      className="cat-delete-icon"
                      style={{ width: "16px", height: "16px" }}
                    />
                  </button>
                </div>
              ))}
              {categories.length === 0 && (
                <p
                  style={{
                    color: "#aaa",
                    fontSize: ".85rem",
                    textAlign: "center",
                    padding: "1rem",
                  }}
                >
                  No categories yet
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {showCatForm && (
        <div className="overlay" onClick={() => setShowCatForm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Add Category</h3>
            <form className="item-form" onSubmit={handleAddCategory}>
              <input
                type="text"
                placeholder="Category name *"
                value={newCatName}
                required
                autoFocus
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-c"
                  onClick={() => setShowCatForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-k" disabled={catSaving}>
                  {catSaving ? "Adding…" : "Add Category"}
                </button>
              </div>
            </form>
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
                required
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Price (₹) *"
                value={formData.price}
                required
                step="0.01"
                min="0"
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
                required
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
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
                  checked={formData.available}
                  onChange={(e) =>
                    setFormData({ ...formData, available: e.target.checked })
                  }
                />
                <p>Available in stock</p>
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
    </div>
  );
};

export default ManageItems;
