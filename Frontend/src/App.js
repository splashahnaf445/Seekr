import { useState, useEffect, useCallback } from "react";
import { FONT } from "./constants/theme";
import { S } from "./constants/styles";
import { NAV } from "./constants/config";
import { ThemeProvider, useTheme } from "./constants/ThemeContext";
import Auth from "./components/Auth/Auth";
import Dashboard from "./components/Pages/Dashboard";
import ItemsPage from "./components/Pages/ItemsPage";
import HistoryPage from "./components/Pages/HistoryPage";
import MessagesPage from "./components/Pages/MessagesPage";
import NotificationsPage from "./components/Pages/NotificationsPage";
import AdminPage from "./components/Pages/AdminPage";
import AccountProfile from "./components/Pages/AccountProfile";
import { initWebSocket, closeWebSocket } from "./utils/websocket";

function AppContent() {
  const { theme, setTheme, colors: C } = useTheme();
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [unread, setUnread] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showAccountProfile, setShowAccountProfile] = useState(false);

  // Initialize WebSocket on mount
  useEffect(() => {
    if (user) {
      initWebSocket()
        .then(() => console.log('✓ WebSocket initialized'))
        .catch(error => console.error('✗ WebSocket initialization failed:', error));

      return () => closeWebSocket();
    }
  }, [user]);

  const refreshUnread = useCallback(() => {
    if (user) {
      // TODO: Fetch unread notifications and messages from API
      setUnread(0);
      setUnreadMessages(0);
    }
  }, [user]);

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => { refreshUnread(); }, [user, refreshUnread]);

  if (!user) return <Auth onLogin={(u) => { setUser(u); localStorage.setItem("user", JSON.stringify(u)); refreshUnread(); }} />;

  const navItems = NAV.filter(n => !n.adminOnly || user.is_admin);

  return (
    <div style={S.app}>
      <style>{FONT}</style>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoText}>🔍 Lost & Found</div>
          <div style={S.logoSub}>University Portal</div>
        </div>
        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          {navItems.map(n => (
            <div key={n.id} style={S.navItem(page === n.id)} onClick={() => { setPage(n.id); if (n.id === "notifications" || n.id === "messages") setTimeout(refreshUnread, 300); }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              <span>{n.label}</span>
              {n.id === "notifications" && unread > 0 && <span style={{ marginLeft: "auto", background: C.red, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "1px 7px" }}>{unread}</span>}
              {n.id === "messages" && unreadMessages > 0 && <span style={{ marginLeft: "auto", background: C.red, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "1px 7px" }}>{unreadMessages}</span>}
            </div>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 12,
              padding: "10px 12px",
              background: `${C.accent}15`,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => e.target.style.background = `${C.accent}25`}
            onMouseLeave={(e) => e.target.style.background = `${C.accent}15`}
          >
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>
          <button 
            onClick={() => setShowAccountProfile(true)}
            style={{ 
              width: "100%",
              display: "flex",
              alignItems: "center", 
              gap: 10, 
              marginBottom: 12,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: 8,
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => e.target.style.background = `${C.border}40`}
            onMouseLeave={(e) => e.target.style.background = "transparent"}
          >
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${C.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.accentGlow }}>
              {user.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{user.uni_id}</div>
            </div>
            <span style={{ fontSize: 12, color: C.textMuted }}>👤</span>
          </button>
          <button style={{ ...S.btn("ghost"), width: "100%", fontSize: 12 }} onClick={() => { setUser(null); localStorage.removeItem("user"); }}>Sign Out</button>
        </div>
      </div>
      {/* Main */}
      <div style={S.main}>
        {page === "dashboard" && <Dashboard user={user} />}
        {page === "items" && <ItemsPage key="all" user={user} filter="all" />}
        {page === "mine" && <ItemsPage key="mine" user={user} filter="mine" />}
        {page === "history" && <HistoryPage user={user} />}
        {page === "messages" && <MessagesPage user={user} />}
        {page === "notifications" && <NotificationsPage user={user} onRead={refreshUnread} />}
        {page === "admin" && <AdminPage user={user} />}
      </div>

      {/* Account Profile Modal */}
      {showAccountProfile && (
        <AccountProfile 
          user={user} 
          onClose={() => setShowAccountProfile(false)}
          onUpdate={handleUpdateUser}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}