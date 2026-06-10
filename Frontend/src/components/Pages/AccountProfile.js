import { useState } from "react";
import { S } from "../../constants/styles";
import Modal from "../UI/Modal.js";
import { useTheme } from "../../constants/ThemeContext";

function AccountProfile({ user, onClose, onUpdate }) {
  const { theme, colors: C } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user.name,
    email: user.email,
    uni_id: user.uni_id,
  });

  const handleChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate({ ...user, ...editData });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: user.name,
      email: user.email,
      uni_id: user.uni_id,
    });
    setIsEditing(false);
  };

  return (
    <Modal title="Account Details" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* User Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: `${C.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: C.accentGlow }}>
            {user.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Account ID: {user.id}</div>
          </div>
        </div>

        {/* Account Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: C.textMuted }}>Personal Information</div>

          {/* Full Name */}
          <div>
            <label style={{ display: "block", fontSize: 12, color: C.textSub, marginBottom: 6, fontWeight: 600 }}>Full Name</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.text,
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            ) : (
              <div style={{ padding: "10px 12px", background: C.surface, borderRadius: 8, color: C.text, fontSize: 13 }}>
                {user.name}
              </div>
            )}
          </div>

          {/* University ID */}
          <div>
            <label style={{ display: "block", fontSize: 12, color: C.textSub, marginBottom: 6, fontWeight: 600 }}>University ID</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.uni_id}
                onChange={(e) => handleChange('uni_id', e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.text,
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            ) : (
              <div style={{ padding: "10px 12px", background: C.surface, borderRadius: 8, color: C.text, fontSize: 13 }}>
                <span style={S.tag}>{user.uni_id}</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: 12, color: C.textSub, marginBottom: 6, fontWeight: 600 }}>Email Address</label>
            {isEditing ? (
              <input
                type="email"
                value={editData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.text,
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            ) : (
              <div style={{ padding: "10px 12px", background: C.surface, borderRadius: 8, color: C.text, fontSize: 13 }}>
                {user.email}
              </div>
            )}
          </div>
        </div>

        {/* Account Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: C.textMuted }}>Account Information</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: 12, background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>Member Since</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user.join_date}</div>
            </div>
            <div style={{ padding: 12, background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>Account Type</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                <span style={S.badge(user.is_admin ? C.purple : C.teal, user.is_admin ? (theme === "dark" ? "#12091A" : "#F3E8FF") : (theme === "dark" ? "#091A18" : "#ECFDF5"))}>
                  {user.is_admin ? "👤 Admin" : "🎓 Student"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  ...S.btn("primary"),
                  flex: 1,
                  fontSize: 13,
                }}
              >
                ✏️ Edit Profile
              </button>
              <button
                onClick={onClose}
                style={{
                  ...S.btn("ghost"),
                  flex: 1,
                  fontSize: 13,
                }}
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                style={{
                  ...S.btn("primary"),
                  flex: 1,
                  fontSize: 13,
                }}
              >
                ✓ Save Changes
              </button>
              <button
                onClick={handleCancel}
                style={{
                  ...S.btn("ghost"),
                  flex: 1,
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>

        {isEditing && (
          <div style={{ padding: 12, background: "#1A140A", border: `1px solid ${C.amber}40`, borderRadius: 8, fontSize: 12, color: C.amber }}>
            ⚠️ Changes will be updated in your account profile.
          </div>
        )}
      </div>
    </Modal>
  );
}

export default AccountProfile;
