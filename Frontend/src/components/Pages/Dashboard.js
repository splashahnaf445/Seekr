import { useState, useEffect } from "react";
import { S } from "../../constants/styles";
import { useTheme } from "../../constants/ThemeContext";
import { itemsAPI, claimsAPI } from "../../utils/api";
import { onWebSocketEvent, removeWebSocketListener } from "../../utils/websocket";

function Dashboard({ user }) {
  const { colors: C, statusConfig: STATUS_CONFIG } = useTheme();
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsData, claimsData] = await Promise.all([
          itemsAPI.getAll(),
          claimsAPI.getByUser(user.id),
        ]);
        setItems(itemsData);
        setClaims(claimsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  // Listen to real-time WebSocket events
  useEffect(() => {
    const handleItemCreated = (data) => setItems(prev => [data, ...prev]);
    const handleClaimCreated = (data) => {
      setClaims(prev => [...prev, data]);
      // Update item status if it's a claim
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

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  const myItems = items.filter(i => i.posted_by === user.id);
  const myClaims = claims.filter(c => c.claimer_id === user.id);
  const lostCount = items.filter(i => i.status === "lost").length;
  const foundCount = items.filter(i => i.status === "found").length;
  const claimedCount = items.filter(i => i.status === "claimed").length;
  const statusPriority = { lost: 0, found: 1, claimed: 2 };
  const recentItems = items.slice().sort((a, b) => {
    if (statusPriority[a.status] !== statusPriority[b.status]) {
      return statusPriority[a.status] - statusPriority[b.status];
    }
    return new Date(b.date_posted) - new Date(a.date_posted);
  }).slice(0, 3);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Welcome back, {user.name.split(" ")[0]} 👋</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>University Lost & Found Portal · {user.uni_id}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total Items", val: items.length, color: C.accent },
          { label: "Lost Items", val: lostCount, color: C.red },
          { label: "Found Items", val: foundCount, color: C.green },
          { label: "Claimed", val: claimedCount, color: C.amber },
        ].map(s => (
          <div key={s.label} style={{ ...S.stat, borderLeft: `3px solid ${s.color}` }}>
            <div style={{ ...S.statNum, color: s.color }}>{s.val}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Recent Activity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentItems.map(item => {
              const cfg = STATUS_CONFIG[item.status];
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 22 }}>{item.image_emoji || '📦'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>📍 {item.location}</div>
                  </div>
                  <span style={S.badge(cfg.color, cfg.bg)}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Your Activity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Items Posted", val: myItems.length, icon: "📋" },
              { label: "Claims Made", val: myClaims.length, icon: "🙋" },
              { label: "Joined", val: user.join_date, icon: "📅" },
              { label: "Role", val: user.is_admin ? "Admin" : "Student", icon: "👤" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, color: C.textSub }}>{r.icon} {r.label}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
