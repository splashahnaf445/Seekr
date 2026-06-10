// API utility for backend communication
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiCall = async (method, endpoint, body = null) => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API error');
    }
    return await response.json();
  } catch (error) {
    console.error(`API ${method} ${endpoint} error:`, error);
    throw error;
  }
};

// Users API
export const usersAPI = {
  getAll: () => apiCall('GET', '/users'),
  create: (userData) => apiCall('POST', '/users', userData),
};

// Items API
export const itemsAPI = {
  getAll: () => apiCall('GET', '/items'),
  create: (itemData) => apiCall('POST', '/items', itemData),
  delete: (itemId) => apiCall('DELETE', `/items/${itemId}`),
  getByCategory: (category) => apiCall('GET', `/items/category/${category}`),
  searchByTag: (tag) => apiCall('GET', `/items/search/tags/${tag}`),
};

// Claims API
export const claimsAPI = {
  create: (claimData) => apiCall('POST', '/claims', claimData),
  getByItem: (itemId) => apiCall('GET', `/claims/item/${itemId}`),
  getByUser: (userId) => apiCall('GET', `/claims/user/${userId}`),
};

// Comments API
export const commentsAPI = {
  getByItem: (itemId) => apiCall('GET', `/comments/${itemId}`),
  create: (commentData) => apiCall('POST', '/comments', commentData),
  delete: (commentId) => apiCall('DELETE', `/comments/${commentId}`),
};

// Messages API
export const messagesAPI = {
  getConversations: (userId) => apiCall('GET', `/conversations/${userId}`),
  getMessages: (userId, otherUserId) => apiCall('GET', `/messages/${userId}/${otherUserId}`),
  send: (messageData) => apiCall('POST', '/messages', messageData),
  markAsRead: (messageId) => apiCall('PUT', `/messages/${messageId}/read`),
};

// Health check
export const healthCheck = () => apiCall('GET', '/health');
