// WebSocket utility for real-time updates
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;
let listeners = {};

const WS_URL = process.env.REACT_APP_WS_URL || `ws://${window.location.hostname}:5000`;

export const initWebSocket = (onMessage) => {
  return new Promise((resolve, reject) => {
    try {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('✓ WebSocket connected');
        reconnectAttempts = 0;
        resolve();
      };

      ws.onmessage = (event) => {
        const { event: eventType, data } = JSON.parse(event.data);
        console.log(`📨 WebSocket event: ${eventType}`, data);
        
        // Call registered listeners
        if (listeners[eventType]) {
          listeners[eventType].forEach(callback => callback(data));
        }
        
        if (onMessage) onMessage(eventType, data);
      };

      ws.onerror = (error) => {
        console.error('✗ WebSocket error:', error);
        reject(error);
      };

      ws.onclose = () => {
        console.log('✗ WebSocket disconnected');
        attemptReconnect();
      };
    } catch (error) {
      console.error('✗ Failed to initialize WebSocket:', error);
      reject(error);
    }
  });
};

const attemptReconnect = () => {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(`🔄 Attempting reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
    setTimeout(() => {
      initWebSocket().catch(() => {});
    }, RECONNECT_INTERVAL);
  }
};

export const isWebSocketConnected = () => {
  return ws && ws.readyState === WebSocket.OPEN;
};

export const onWebSocketEvent = (eventType, callback) => {
  if (!listeners[eventType]) {
    listeners[eventType] = [];
  }
  listeners[eventType].push(callback);
};

export const removeWebSocketListener = (eventType, callback) => {
  if (listeners[eventType]) {
    listeners[eventType] = listeners[eventType].filter(cb => cb !== callback);
  }
};

export const closeWebSocket = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
};
