import { useState, useEffect } from "react";
import { S } from "../../constants/styles";
import { DB } from "../../constants/db";
import { useTheme } from "../../constants/ThemeContext";
import { usersAPI } from "../../utils/api";

function AdminPage({ user }) {
  const { theme, colors: C } = useTheme();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all users from API on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await usersAPI.getAll();
        setAllUsers(data || []);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (!user.is_admin) return <div style={{ color: C.textMuted, padding: 40 }}>Access denied.</div>;
  
  return (
    <div>
      <div style={S.pageTitle}>Admin Panel</div>
      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 28 }}>Manage all users, items and claims</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14, color: C.accent }}>👥 All Users ({allUsers.length})</div>
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center", color: C.textMuted }}>Loading users...</div>
          ) : allUsers.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: C.textMuted }}>No users found</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr>{["Name", "Email", "Joined", "Role"].map(h => <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: C.textMuted, borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
              <tbody>{allUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 12px", fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: "10px 12px", color: C.textSub }}>{u.email}</td>
                  <td style={{ padding: "10px 12px", color: C.textMuted }}>{u.join_date}</td>
                  <td style={{ padding: "10px 12px" }}><span style={S.badge(u.is_admin ? C.purple : C.teal, u.is_admin ? (theme === "dark" ? "#12091A" : "#F3E8FF") : (theme === "dark" ? "#091A18" : "#ECFDF5"))}>{u.is_admin ? "Admin" : "Student"}</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14, color: C.amber }}>📋 All Claims ({DB.claims.length})</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["Claim ID", "Claimer", "Item", "Date", "Status"].map(h => <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: C.textMuted, borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
            <tbody>{DB.claims.map(c => {
              const claimer = allUsers.find(u => u.id === c.claimer_id);
              const item = DB.items.find(i => i.id === c.item_id);
              return (
                <tr key={c.claim_id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 12px" }}><span style={S.tag}>{c.claim_id}</span></td>
                  <td style={{ padding: "10px 12px", fontWeight: 500 }}>{claimer?.name || "—"}</td>
                  <td style={{ padding: "10px 12px", color: C.textSub }}>{item?.title || "Deleted"}</td>
                  <td style={{ padding: "10px 12px", color: C.textMuted }}>{c.date}</td>
                  <td style={{ padding: "10px 12px" }}><span style={S.badge(C.green, theme === "dark" ? "#0A1A10" : "#DCFCE7")}>{c.status}</span></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
