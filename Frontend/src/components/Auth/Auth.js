import { useState } from "react";
import { FONT } from "../../constants/theme";
import { S } from "../../constants/styles";
import { useTheme } from "../../constants/ThemeContext";
import { usersAPI } from "../../utils/api";

function Auth({ onLogin }) {
  const { colors: C } = useTheme();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        // Call the login endpoint
        const response = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || "Login failed");
          setLoading(false);
          return;
        }
        
        const user = await response.json();
        onLogin(user);
      } else {
        if (!form.name || !form.email || !form.password) { 
          setError("All fields required."); 
          setLoading(false);
          return; 
        }
        try {
          const newUser = await usersAPI.create({
            name: form.name,
            email: form.email,
            password: form.password
          });
          onLogin(newUser);
        } catch (err) {
          setError(err.message || "Email already registered or invalid input.");
          setLoading(false);
        }
      }
    } catch (err) {
      setError("Authentication failed. Please try again.");
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.authWrap}>
      <style>{FONT}</style>
      <div style={S.authCard}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>Lost & Found</div>
          <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>University Portal</div>
        </div>
        <div style={{ display: "flex", background: C.surface, borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {["login", "signup"].map(m => <button key={m} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: 13, background: mode === m ? C.accent : "transparent", color: mode === m ? "#fff" : C.textMuted, transition: "all 0.15s", textTransform: "capitalize" }} onClick={() => { setMode(m); setError(""); }}>{m}</button>)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && <>
            <div><label style={S.label}>Full Name</label><input style={S.input} placeholder="Your full name" value={form.name} onChange={set("name")} /></div>
          </>}
          <div><label style={S.label}>Email</label><input style={S.input} type="email" placeholder="you@uni.edu" value={form.email} onChange={set("email")} /></div>
          <div><label style={S.label}>Password</label><input style={S.input} type="password" placeholder="••••••••" value={form.password} onChange={set("password")} /></div>
          {error && <div style={{ fontSize: 12, color: C.red, background: C.theme === "dark" ? "#1A0A0A" : "#FEE2E2", border: `1px solid ${C.red}30`, borderRadius: 8, padding: "8px 12px" }}>⚠️ {error}</div>}
          <button style={{ ...S.btn(), width: "100%", padding: "12px 0", fontSize: 14, marginTop: 4 }} onClick={handleSubmit} disabled={loading}>{loading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}</button>
        </div>
        {mode === "login" && <div style={{ marginTop: 20, padding: "14px", background: C.surface, borderRadius: 10, fontSize: 12, color: C.textMuted }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: C.textSub }}>Demo Account:</div>
          <div>admin@uni.edu / password123 (Admin)</div>
        </div>}
      </div>
    </div>
  );
}

export default Auth;
