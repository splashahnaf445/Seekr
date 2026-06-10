import { useState, useEffect } from "react";
import { S } from "../../constants/styles";
import { useTheme } from "../../constants/ThemeContext";
import { commentsAPI, usersAPI } from "../../utils/api";
import { onWebSocketEvent, removeWebSocketListener } from "../../utils/websocket";

function Comments({ itemId, currentUser }) {
  const { colors: C } = useTheme();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState({});
  const [moderationWarning, setModerationWarning] = useState(null);

  // Fetch comments and users on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commentsData, usersData] = await Promise.all([
          commentsAPI.getByItem(itemId),
          usersAPI.getAll()
        ]);
        setComments(commentsData);
        // Create user map for quick lookup
        const map = {};
        usersData.forEach(u => map[u.id] = u);
        setUserMap(map);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      }
    };
    fetchData();
  }, [itemId]);

  // Listen for new comments
  useEffect(() => {
    const handleCommentCreated = (data) => {
      if (data.item_id === itemId) {
        setComments(prev => [...prev, data]);
      }
    };
    onWebSocketEvent('comment_created', handleCommentCreated);
    return () => removeWebSocketListener('comment_created', handleCommentCreated);
  }, [itemId]);

  const handleAddComment = async () => {
    if (newComment.trim()) {
      setLoading(true);
      setModerationWarning(null);
      try {
        const response = await commentsAPI.create({
          item_id: itemId,
          user_id: currentUser.id,
          comment_text: newComment
        });
        
        // Display moderation warning if content was flagged
        if (response.moderation?.flagged) {
          setModerationWarning({
            type: 'warning',
            message: response.moderation.message || '⚠️ Your comment contained language that was automatically filtered.'
          });
        } else if (response.moderation?.message) {
          setModerationWarning({
            type: 'info',
            message: '✓ Comment posted successfully'
          });
        }
        
        setNewComment("");
      } catch (error) {
        console.error('Failed to post comment:', error);
        setModerationWarning({
          type: 'error',
          message: 'Failed to post comment. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentsAPI.delete(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <div style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
      {/* Comments Toggle Button */}
      <button
        style={{
          background: "none",
          border: "none",
          color: C.primary,
          cursor: "pointer",
          fontSize: 12,
          textDecoration: "underline",
          padding: 0,
          marginBottom: 12
        }}
        onClick={() => setShowComments(!showComments)}
      >
        💬 {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
      </button>

      {/* Comments Section */}
      {showComments && (
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: 12, marginTop: 12 }}>
          {/* Moderation Warning Alert */}
          {moderationWarning && (
            <div style={{
              background: moderationWarning.type === 'warning' ? '#fff3cd' : (moderationWarning.type === 'error' ? '#f8d7da' : '#d1ecf1'),
              border: `1px solid ${moderationWarning.type === 'warning' ? '#ffc107' : (moderationWarning.type === 'error' ? '#f5c6cb' : '#bee5eb')}`,
              borderRadius: 4,
              padding: 10,
              marginBottom: 12,
              fontSize: 12,
              color: moderationWarning.type === 'warning' ? '#856404' : (moderationWarning.type === 'error' ? '#721c24' : '#0c5460')
            }}>
              {moderationWarning.message}
            </div>
          )}

          {/* New Comment Input */}
          <div style={{ marginBottom: 12 }}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              style={{
                ...S.input,
                resize: "vertical",
                minHeight: 60,
                fontFamily: "inherit"
              }}
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || loading}
              style={{
                ...S.btn("primary"),
                marginTop: 8,
                opacity: newComment.trim() && !loading ? 1 : 0.5,
                cursor: newComment.trim() && !loading ? "pointer" : "not-allowed"
              }}
            >
              {loading ? "Posting..." : "Post Comment"}
            </button>
          </div>

          {/* Comments List */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
            {comments.length === 0 ? (
              <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: 12 }}>
                No comments yet. Be the first to comment!
              </div>
            ) : (
              comments.map(comment => {
                const commentUser = userMap[comment.user_id] || { name: "Unknown User" };
                const isCommentOwner = currentUser.id === comment.user_id;
                const isFlagged = comment.is_flagged;

                return (
                  <div
                    key={comment.id}
                    style={{
                      background: isFlagged ? '#fff3cd' : C.border,
                      borderRadius: 4,
                      padding: 10,
                      marginBottom: 8,
                      borderLeft: `3px solid ${isFlagged ? '#ffc107' : C.primary}`,
                      opacity: isFlagged ? 0.8 : 1
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                            {commentUser.name}
                          </div>
                          {isFlagged && (
                            <span style={{
                              fontSize: 11,
                              background: '#ffc107',
                              color: '#856404',
                              padding: '2px 6px',
                              borderRadius: 3,
                              fontWeight: 600
                            }}>
                              ⚠️ Filtered
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>
                          {comment.created_at ? new Date(comment.created_at).toLocaleString() : "Unknown time"}
                        </div>
                        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
                          {comment.comment_text}
                        </div>
                        {isFlagged && comment.moderation?.reason && (
                          <div style={{ fontSize: 11, color: '#856404', marginTop: 6, fontStyle: 'italic' }}>
                            Reason: {comment.moderation.reason}
                          </div>
                        )}
                      </div>
                      {isCommentOwner && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: C.danger,
                            cursor: "pointer",
                            fontSize: 14,
                            padding: "0 4px",
                            marginLeft: 8
                          }}
                          title="Delete comment"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Comments;
