import { useState, useEffect, useRef } from "react";
import { S } from "../../constants/styles";
import { useTheme } from "../../constants/ThemeContext";
import { messagesAPI, usersAPI } from "../../utils/api";
import { onWebSocketEvent, removeWebSocketListener } from "../../utils/websocket";

function ConversationView({ currentUser, otherUserId, onSendMessage, onClose }) {
  const { colors: C } = useTheme();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [moderationWarning, setModerationWarning] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const data = await messagesAPI.getMessages(currentUser.id, otherUserId);
      setMessages(data || []);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherUser = async () => {
    try {
      const users = await usersAPI.getAll();
      const user = users.find(u => u.id === otherUserId);
      setOtherUser(user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    fetchOtherUser();
    fetchMessages();

    // Listen for new messages
    const handleMessageCreated = (newMsg) => {
      if ((newMsg.sender_id === currentUser.id && newMsg.receiver_id === otherUserId) ||
          (newMsg.sender_id === otherUserId && newMsg.receiver_id === currentUser.id)) {
        setMessages(prev => [...prev, newMsg]);
        scrollToBottom();
      }
    };

    onWebSocketEvent('message_created', handleMessageCreated);

    return () => {
      removeWebSocketListener('message_created', handleMessageCreated);
    };
  }, [currentUser.id, otherUserId]);

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      try {
        setModerationWarning(null);
        await messagesAPI.send({
          sender_id: currentUser.id,
          receiver_id: otherUserId,
          message_text: newMessage,
          item_id: null
        });
        
        setNewMessage("");
        // Messages will be added via WebSocket listener
        
        // Call parent handler (if needed)
        if (onSendMessage) {
          onSendMessage(otherUserId, newMessage);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  return (
    <div style={{ ...S.card, display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
            👤
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{otherUser?.name || "User"}</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>Active now</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            color: C.textMuted
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Moderation Warning Alert */}
        {moderationWarning && (
          <div style={{
            background: moderationWarning.type === 'warning' ? '#fff3cd' : '#d1ecf1',
            border: `1px solid ${moderationWarning.type === 'warning' ? '#ffc107' : '#bee5eb'}`,
            borderRadius: 6,
            padding: 10,
            fontSize: 12,
            color: moderationWarning.type === 'warning' ? '#856404' : '#0c5460',
            marginBottom: 8
          }}>
            {moderationWarning.message}
          </div>
        )}

        {/* Messages List */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.textMuted }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.textMuted }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(msg => {
            const isFlagged = msg.is_flagged;
            return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: msg.sender_id === currentUser.id ? "flex-end" : "flex-start",
                gap: 8,
                flexDirection: msg.sender_id === currentUser.id ? "row-reverse" : "row",
                alignItems: "flex-end"
              }}
            >
              <div
                style={{
                  maxWidth: "60%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: isFlagged ? '#fff3cd' : (msg.sender_id === currentUser.id ? C.accent : C.surface),
                  color: isFlagged ? '#856404' : (msg.sender_id === currentUser.id ? "#fff" : C.text),
                  fontSize: 13,
                  lineHeight: 1.5,
                  borderBottomLeftRadius: msg.sender_id === currentUser.id ? 12 : 4,
                  borderBottomRightRadius: msg.sender_id === currentUser.id ? 4 : 12,
                  border: isFlagged ? '1px solid #ffc107' : 'none',
                  opacity: isFlagged ? 0.85 : 1
                }}
              >
                {msg.item_id && (
                  <div style={{
                    fontSize: 11,
                    opacity: 0.8,
                    marginBottom: 6,
                    fontStyle: "italic",
                    borderBottom: `1px solid ${isFlagged ? '#ffc107' : (msg.sender_id === currentUser.id ? "rgba(255,255,255,0.3)" : C.border)}`,
                    paddingBottom: 6
                  }}>
                    📌 {msg.item_title || "Item"}
                  </div>
                )}
                {msg.message_text}
                {isFlagged && (
                  <div style={{
                    fontSize: 10,
                    opacity: 0.7,
                    marginTop: 6,
                    paddingTop: 6,
                    borderTop: `1px solid #ffc107`,
                    fontStyle: 'italic'
                  }}>
                    ⚠️ Filtered
                  </div>
                )}
                <div style={{
                  fontSize: 10,
                  opacity: 0.6,
                  marginTop: 4,
                  textAlign: "right"
                }}>
                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "now"}
                </div>
              </div>
            </div>
          );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, display: "flex", gap: 10, flexDirection: "column" }}>
        {moderationWarning && (
          <div style={{
            background: moderationWarning.type === 'warning' ? '#fff3cd' : '#d1ecf1',
            border: `1px solid ${moderationWarning.type === 'warning' ? '#ffc107' : '#bee5eb'}`,
            borderRadius: 6,
            padding: 10,
            fontSize: 12,
            color: moderationWarning.type === 'warning' ? '#856404' : '#0c5460'
          }}>
            {moderationWarning.message}
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message... (Shift+Enter for new line)"
            style={{
              ...S.input,
              flex: 1,
              resize: "vertical",
              minHeight: 50,
              maxHeight: 120,
              fontFamily: "inherit"
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            style={{
              ...S.btn("primary"),
              alignSelf: "flex-end",
              minHeight: 50,
              opacity: newMessage.trim() ? 1 : 0.5,
              cursor: newMessage.trim() ? "pointer" : "not-allowed"
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConversationView;
