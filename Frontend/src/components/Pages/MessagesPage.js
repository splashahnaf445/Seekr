import { useState, useEffect } from "react";
import { S } from "../../constants/styles";
import { useTheme } from "../../constants/ThemeContext";
import { messagesAPI } from "../../utils/api";
import { onWebSocketEvent, removeWebSocketListener } from "../../utils/websocket";
import ConversationView from "./ConversationView";

function MessagesPage({ user }) {
  const { colors: C } = useTheme();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const data = await messagesAPI.getConversations(user.id);
      if (data && data.length > 0) {
        // Transform API response to match UI structure and fetch last message text
        const transformedConvs = await Promise.all(data.map(async (conv) => {
          const messages = await messagesAPI.getMessages(user.id, conv.other_user_id);
          const lastMsg = messages?.[messages.length - 1];
          return {
            otherUserId: conv.other_user_id,
            otherUser: conv.other_user,
            lastMessage: lastMsg?.message_text || "No messages",
            lastMessageTime: lastMsg?.created_at ? new Date(lastMsg.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "now",
            lastMessageDate: lastMsg?.created_at ? new Date(lastMsg.created_at).toISOString().split("T")[0] : "today",
            unreadCount: conv.unread_count || 0,
            messageCount: messages?.length || 0
          };
        }));
        setConversations(transformedConvs);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Listen for new messages
    const handleMessageCreated = () => {
      fetchConversations();
    };

    onWebSocketEvent('message_created', handleMessageCreated);

    return () => {
      removeWebSocketListener('message_created', handleMessageCreated);
    };
  }, [user.id]);

  const handleSendMessage = (otherUserId, messageText, itemId) => {
    // Message will be sent by ConversationView via API, just refresh
    setTimeout(() => fetchConversations(), 500);
  };

  const markConversationAsRead = async (otherUserId) => {
    // Conversations will be marked as read by ConversationView
  };

  return (
    <div style={{ display: "flex", gap: 20, minHeight: "calc(100vh - 120px)" }}>
      {/* Conversations List */}
      <div style={{ width: 300, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 16, borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 14 }}>💬 Conversations</div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 16, textAlign: "center", color: C.textMuted, fontSize: 12 }}>No conversations yet</div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.otherUserId}
                onClick={() => {
                  setSelectedConversation(conv.otherUserId);
                  markConversationAsRead(conv.otherUserId);
                }}
                style={{
                  padding: 12,
                  borderBottom: `1px solid ${C.border}`,
                  cursor: "pointer",
                  background: selectedConversation === conv.otherUserId ? `${C.accent}20` : "transparent",
                  transition: "background 0.2s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontWeight: conv.unreadCount > 0 ? 700 : 500, fontSize: 13, color: C.text }}>
                    {conv.otherUser?.name}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span style={{ background: C.red, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "2px 6px" }}>
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {conv.lastMessage}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>{conv.lastMessageDate} {conv.lastMessageTime}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conversation View */}
      <div style={{ flex: 1 }}>
        {selectedConversation ? (
          <ConversationView
            currentUser={user}
            otherUserId={selectedConversation}
            onSendMessage={handleSendMessage}
            onClose={() => setSelectedConversation(null)}
          />
        ) : (
          <div style={{ ...S.card, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.textMuted }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div>Select a conversation to start messaging</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagesPage;
