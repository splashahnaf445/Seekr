import { useState } from "react";
import { S } from "../../constants/styles";
import { useTheme } from "../../constants/ThemeContext";
import { CATEGORIES } from "../../constants/categories";

function ItemForm({ initial = {}, onSave, onCancel }) {
  const { colors: C } = useTheme();
  const [form, setForm] = useState({ title: "", description: "", location: "", status: "lost", image_emoji: "📦", category: "other", tags: [], ...initial });
  const [newTag, setNewTag] = useState("");
  const emojis = ["📦", "🎒", "🪪", "⌚", "📱", "💻", "🔑", "👜", "📚", "☂️", "🧮", "👓", "🎧", "💳"];
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  
  const handleAddTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm(f => ({ ...f, tags: [...(f.tags || []), newTag.trim()] }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag) => {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  };

  const categories = Object.values(CATEGORIES);
  const selectedCategory = CATEGORIES[form.category] || CATEGORIES.other;
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={S.label}>Icon</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {emojis.map(e => <button key={e} onClick={() => setForm(f => ({ ...f, image_emoji: e }))} style={{ fontSize: 20, background: form.image_emoji === e ? `${C.accent}30` : C.surface, border: `1px solid ${form.image_emoji === e ? C.accent : C.border}`, borderRadius: 8, padding: "4px 8px", cursor: "pointer" }}>{e}</button>)}
        </div>
      </div>
      {[["title", "Item Title"], ["location", "Location Found/Lost"]].map(([k, lbl]) => (
        <div key={k}>
          <label style={S.label}>{lbl}</label>
          <input style={S.input} value={form[k]} onChange={set(k)} placeholder={lbl} />
        </div>
      ))}
      <div>
        <label style={S.label}>Description</label>
        <textarea style={{ ...S.input, height: 80, resize: "vertical" }} value={form.description} onChange={set("description")} placeholder="Detailed description..." />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={S.label}>Status</label>
          <select style={{ ...S.input }} value={form.status} onChange={set("status")}>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </div>
        <div>
          <label style={S.label}>Category</label>
          <select style={{ ...S.input }} value={form.category} onChange={set("category")}>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label style={S.label}>Tags (Optional)</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            style={{ ...S.input, flex: 1 }}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add a tag and press Enter..."
          />
          <button style={S.btn("ghost")} onClick={handleAddTag}>+</button>
        </div>
        {form.tags && form.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {form.tags.map(tag => (
              <div key={tag} style={{ display: "flex", alignItems: "center", gap: 6, background: selectedCategory.bg, border: `1px solid ${selectedCategory.color}`, borderRadius: 12, padding: "4px 10px", fontSize: 12 }}>
                <span style={{ color: selectedCategory.color }}>{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  style={{
                    background: "none",
                    border: "none",
                    color: selectedCategory.color,
                    cursor: "pointer",
                    fontSize: 12,
                    padding: 0
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
        <button style={S.btn("ghost")} onClick={onCancel}>Cancel</button>
        <button style={S.btn()} onClick={() => { if (form.title && form.location) onSave(form); }}>Save Item</button>
      </div>
    </div>
  );
}

export default ItemForm;
