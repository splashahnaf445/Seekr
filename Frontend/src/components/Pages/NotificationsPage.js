import { useState, useEffect } from "react";
import { S } from "../../constants/styles";
import { DB } from "../../constants/db";
import { useTheme } from "../../constants/ThemeContext";

function NotificationsPage({ user, onRead }) {
  const { colors: C } = useTheme();
  const [notifs, setNotifs] = useState([]);
  useEffect(() => {
    setNotifs(DB.notifications.filter(n => n.user_id === user.id).sort((a, b) => b.date.localeCompare(a.date)));
  }, [user]);

  const markRead = (id) => {
    const n = DB.notifications.find(n => n.id === id);
    if (n) n.read = true;
    setNotifs([...DB.notifications.filter(n => n.user_id === user.id)]);
    onRead();
  };

  const markAll = () => {
    DB.notifications.filter(n => n.user_id === user.id).forEach(n => n.read = true);
    setNotifs([...DB.notifications.filter(n => n.user_id === user.id)]);
    onRead();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={S.pageTitle}>Notifications</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>{notifs.filter(n => !n.read).length} unread</div>
        </div>
        {notifs.some(n => !n.read) && <button style={S.btn("ghost")} onClick={markAll}>Mark all read</button>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {notifs.length === 0 && <div style={{ ...S.card, textAlign: "center", color: C.textMuted, padding: 40 }}>🔔 No notifications yet.</div>}
        {notifs.map(n => (
          <div key={n.id} style={{ ...S.card, borderLeft: `3px solid ${n.read ? C.border : C.accent}`, opacity: n.read ? 0.7 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20, marginTop: 2 }}>{n.read ? "🔕" : "🔔"}</span>
                <div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: n.read ? C.textSub : C.text }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{n.date}</div>
                </div>
              </div>
              {!n.read && <button style={S.btn("ghost")} onClick={() => markRead(n.id)} >✓</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotificationsPage;
