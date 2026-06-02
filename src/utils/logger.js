// Centralized Asynchronous Activity Logging Utility for TerraTrace Portal

const getCurrentUser = () => {
  try {
    const userJson = localStorage.getItem('terratrace-auth-storage');
    if (userJson) {
      const parsed = JSON.parse(userJson);
      return parsed?.state?.user || null;
    }
  } catch (err) {
    console.error("Failed to parse auth storage:", err);
  }
  return null;
};

/**
 * logActivity - Capture and record user action logs.
 * Asynchronously sends logs to the backend `/logs` endpoint and caches them locally
 * in localStorage for instant frontend fallback retrieval and offline resilience.
 * 
 * @param {string} actionType - 'Auth' | 'Create' | 'Update' | 'Delete' | 'Read'
 * @param {string} description - Detailed log content string
 * @param {boolean} success - Success status of the operation
 */
export const logActivity = async (actionType, description, success = true) => {
  try {
    const currentUser = getCurrentUser();
    const userId = currentUser?._id || currentUser?.id || 'anonymous';
    const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Anonymous User';
    const userRole = currentUser?.role || 'Guest';
    
    const mockIp = '192.168.1.105'; // Simulated client node IP
    
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      userName,
      userRole,
      action_type: actionType,
      description,
      timestamp: new Date().toISOString(),
      ip: mockIp,
      success
    };

    // 1. Sync cache to localStorage (Premium local-first design)
    const existingLogsJson = localStorage.getItem('terratrace_activity_logs');
    const existingLogs = existingLogsJson ? JSON.parse(existingLogsJson) : [];
    existingLogs.unshift(logEntry);
    localStorage.setItem('terratrace_activity_logs', JSON.stringify(existingLogs));

    // 2. Background fire-and-forget AJAX call to /logs endpoint
    // Uses raw fetch to avoid triggering interceptors recursively
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const baseURL = hostname !== 'localhost' && hostname !== '127.0.0.1' ? `http://${hostname}:5001/api` : 'http://localhost:5001/api';
    
    fetch(`${baseURL}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(logEntry)
    }).catch(() => {
      // Fail silently to prevent background logger connection errors from affecting frontend performance
    });

    // Dispatch custom event to notify active settings logs views reactively
    window.dispatchEvent(new CustomEvent('new-activity-log', { detail: logEntry }));
  } catch (err) {
    console.error("Activity logging failed:", err);
  }
};
