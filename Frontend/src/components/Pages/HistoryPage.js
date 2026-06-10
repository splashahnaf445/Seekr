import { S } from "../../constants/styles";
import { DB } from "../../constants/db";
import { useTheme } from "../../constants/ThemeContext";

function HistoryPage({ user }) {
  const { theme, colors: C, statusConfig: STATUS_CONFIG } = useTheme();
  const myClaims = DB.claims.filter(c => c.claimer_id === user.id).map(c => ({ ...c, item: DB.items.find(i => i.id === c.item_id) }));
  const myPosts = DB.items.filter(i => i.posted_by === user.id);

  return (
    <div>
      <div style={S.pageTitle}>My History</div>
      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 28 }}>All your activity on the portal</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14, color: C.teal }}>📋 Items I Posted ({myPosts.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {myPosts.length === 0 && <div style={{ color: C.textMuted, fontSize: 13 }}>No items posted yet.</div>}
            {myPosts.map(item => {
              const cfg = STATUS_CONFIG[item.status];
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.surface, borderRadius: 10 }}>
                  <span style={{ fontSize: 20 }}>{item.image}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{item.date} · {item.location}</div>
                  </div>
                  <span style={S.badge(cfg.color, cfg.bg)}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14, color: C.purple }}>🙋 Claims I Made ({myClaims.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {myClaims.length === 0 && <div style={{ color: C.textMuted, fontSize: 13 }}>No claims made yet.</div>}
            {myClaims.map(c => (
                <div key={c.claim_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.surface, borderRadius: 10 }}>
                <span style={{ fontSize: 20 }}>{c.item?.image || "📦"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.item?.title || "Item deleted"}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>Claimed: {c.date}</div>
                </div>
                <span style={S.badge(C.amber, theme === "dark" ? "#1A140A" : "#FEFCE8")}>✓ {c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryPage;
