import { useState, useEffect } from "react";
import { S } from "../../constants/styles";
import { useTheme } from "../../constants/ThemeContext";
import { CATEGORIES } from "../../constants/categories";
import Modal from "../UI/Modal";
import ItemCard from "../UI/ItemCard";
import ItemForm from "../Forms/ItemForm";
import { itemsAPI, claimsAPI, messagesAPI } from "../../utils/api";
import { onWebSocketEvent, removeWebSocketListener } from "../../utils/websocket";

function ItemsPage({ user, filter }) {
  const { colors: C } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [claimTarget, setClaimTarget] = useState(null);
  const [messageTarget, setMessageTarget] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch items from API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await itemsAPI.getAll();
        setItems(data);
      } catch (error) {
        console.error('Failed to fetch items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Listen to real-time WebSocket events
  useEffect(() => {
    const handleItemCreated = (data) => setItems(prev => [data, ...prev]);
    const handleClaimCreated = (data) => {
      // Update item status when claimed
      setItems(prev => prev.map(item => 
        item.id === data.item_id ? { ...item, status: 'claimed' } : item
      ));
    };

    onWebSocketEvent('item_created', handleItemCreated);
    onWebSocketEvent('claim_created', handleClaimCreated);

    return () => {
      removeWebSocketListener('item_created', handleItemCreated);
      removeWebSocketListener('claim_created', handleClaimCreated);
    };
  }, []);

  const filtered = items.filter(i => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) || i.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    const matchCategory = categoryFilter === "all" || i.category === categoryFilter;
    const matchFilter = filter === "mine" ? i.posted_by === user.id : true;
    return matchSearch && matchStatus && matchCategory && matchFilter;
  });

  const handleSave = async (form) => {
    try {
      const newItem = await itemsAPI.create({
        ...form,
        posted_by: user.id,
      });
      // Item will be added via WebSocket broadcast, but add immediately for UX
      setItems(prev => [newItem, ...prev]);
      setShowForm(false);
      setEditing(null);
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await itemsAPI.delete(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleClaim = async (item) => {
    try {
      await claimsAPI.create({
        claimer_id: user.id,
        item_id: item.id
      });
      // Update local state (server will broadcast via WebSocket)
      setItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, status: 'claimed' } : i
      ));
      setClaimTarget(null);
    } catch (error) {
      console.error('Failed to claim item:', error);
    }
  };

  const handleMessage = (item) => {
    setMessageTarget(item);
    setMessageText(`Hi! I'm interested in your "${item.title}". `);
  };

  const handleSendMessage = async () => {
    if (messageText.trim() && messageTarget) {
      try {
        await messagesAPI.send({
          sender_id: user.id,
          receiver_id: messageTarget.posted_by,
          message_text: messageText,
          item_id: messageTarget.id
        });
        setMessageTarget(null);
        setMessageText("");
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={S.pageTitle}>{filter === "mine" ? "My Items" : "All Items"}</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>{filtered.length} items found</div>
        </div>
        <button style={S.btn()} onClick={() => { setEditing(null); setShowForm(true); }}>+ Report Item</button>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <input style={{ ...S.input, flex: 1 }} placeholder="Search items or locations..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>Status:</span>
          {["all", "lost", "found", "claimed"].map(s => (
            <button key={s} style={{ ...S.btn(statusFilter === s ? "primary" : "ghost"), textTransform: "capitalize", fontSize: 12 }} onClick={() => setStatusFilter(s)}>{s}</button>
          ))}
        </div>
        <div style={{ borderLeft: `1px solid ${C.border}`, height: 30 }}></div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>Category:</span>
          <button key="all" style={{ ...S.btn(categoryFilter === "all" ? "primary" : "ghost"), fontSize: 12 }} onClick={() => setCategoryFilter("all")}>All</button>
          {Object.values(CATEGORIES).map(cat => {
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                style={{
                  background: isSelected ? cat.color : "transparent",
                  color: isSelected ? "#fff" : cat.color,
                  border: `1px solid ${cat.color}`,
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontWeight: isSelected ? 600 : 400
                }}
              >
                {cat.icon} {cat.name}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {loading ? <div style={{ gridColumn: "1/-1", textAlign: "center", color: C.textMuted, padding: 40 }}>Loading items...</div> : filtered.length === 0 ? <div style={{ gridColumn: "1/-1", textAlign: "center", color: C.textMuted, padding: 40 }}>No items found.</div> : filtered.map(item => <ItemCard key={item.id} item={item} currentUser={user} onEdit={i => { setEditing(i); setShowForm(true); }} onDelete={handleDelete} onClaim={setClaimTarget} onMessage={handleMessage} showOwner={filter !== "mine"} />)}
      </div>
      {showForm && <Modal title={editing ? "Edit Item" : "Report Item"} onClose={() => { setShowForm(false); setEditing(null); }}>
        <ItemForm initial={editing || {}} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
      </Modal>}
      {claimTarget && <Modal title="Confirm Claim" onClose={() => setClaimTarget(null)}>
        <div style={{ fontSize: 14, color: C.textSub, marginBottom: 20 }}>
          Are you sure you want to claim <strong style={{ color: C.text }}>{claimTarget.title}</strong>? The founder will be notified to coordinate handover.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button style={S.btn("ghost")} onClick={() => setClaimTarget(null)}>Cancel</button>
          <button style={S.btn("success")} onClick={() => handleClaim(claimTarget)}>Yes, Claim It</button>
        </div>
      </Modal>}
      {messageTarget && <Modal title={`Message to ${messageTarget.posted_by_name || 'User'}`} onClose={() => setMessageTarget(null)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ padding: 12, background: C.surface, borderRadius: 8, borderLeft: `3px solid ${C.accent}` }}>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>About:</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{messageTarget.title}</div>
          </div>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            style={{ ...S.input, minHeight: 80, fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={S.btn("ghost")} onClick={() => setMessageTarget(null)}>Cancel</button>
            <button style={S.btn("primary")} onClick={handleSendMessage} disabled={!messageText.trim()}>Send Message</button>
          </div>
        </div>
      </Modal>}
    </div>
  );
}

export default ItemsPage;
