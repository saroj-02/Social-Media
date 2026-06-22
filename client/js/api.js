const getApiUrl = () => {
  const { protocol, hostname, port } = window.location;
  
  // If running via file protocol
  if (protocol === 'file:') {
    return 'http://localhost:5001/api';
  }
  
  // If running locally (localhost or 127.0.0.1)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // If not served by backend (5001) or Vite proxy (5173)
    if (port !== '5001' && port !== '5173') {
      return 'http://localhost:5001/api';
    }
  }
  
  // Default to relative path for same-origin (production or local server/proxy)
  return '/api';
};

const API_URL = getApiUrl();

window.api = {
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Upload failed');
    return result.url;
  },

  async request(endpoint, method = 'GET', data = null, isProtected = false) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (isProtected) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const config = {
      method,
      headers
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 403 && result.isBanned) {
          window.dispatchEvent(new CustomEvent('user-banned', { detail: result }));
        }
        throw new Error(result.message || 'Something went wrong');
      }
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Auth
  login(credentials) {
    return this.request('/auth/login', 'POST', credentials);
  },
  register(userData) {
    return this.request('/auth/register', 'POST', userData);
  },

  // Posts
  getPosts() {
    return this.request('/posts');
  },
  createPost(postData) {
    return this.request('/posts', 'POST', postData, true);
  },
  likePost(postId) {
    return this.request(`/posts/${postId}/like`, 'POST', null, true);
  },
  updatePost(postId, postData) {
    return this.request(`/posts/${postId}`, 'PUT', postData, true);
  },
  deletePost(postId) {
    return this.request(`/posts/${postId}`, 'DELETE', null, true);
  },
  getRecommendedReels() {
    return this.request('/posts/reels/recommended', 'GET', null, true);
  },

  // Users
  getUserProfile(userId) {
    return this.request(`/users/profile/${userId}`);
  },
  updateProfile(profileData) {
    return this.request('/users/update', 'PUT', profileData, true);
  },
  followUser(userId) {
    return this.request(`/users/follow/${userId}`, 'POST', null, true);
  },
  getSuggestions() {
    return this.request('/users/suggestions', 'GET', null, true);
  },
  searchUsers(query) {
    return this.request(`/users/search?q=${query}`);
  },
  getAllUsers() {
    return this.request('/users/all', 'GET', null, true);
  },

  // Comments
  addComment(commentData) {
    return this.request('/comments', 'POST', commentData, true);
  },
  deleteComment(commentId) {
    return this.request(`/comments/${commentId}`, 'DELETE', null, true);
  },

  // Search Posts
  searchPosts(query) {
    return this.request(`/posts/search?q=${query}`);
  },

  // Notifications
  getNotifications() {
    return this.request('/notifications', 'GET', null, true);
  },
  markNotificationsRead() {
    return this.request('/notifications/read', 'PUT', null, true);
  },
  
  // Admin APIs
  adminGetAllUsers() {
    return this.request('/users/admin/users', 'GET', null, true);
  },
  adminGetUserDetails(userId) {
    return this.request(`/users/admin/users/${userId}`, 'GET', null, true);
  },
  adminDeleteUser(userId) {
    return this.request(`/users/admin/users/${userId}`, 'DELETE', null, true);
  },
  adminBanUser(data) {
    return this.request('/users/admin/users/ban', 'POST', data, true);
  },
  adminUnbanUser(userId) {
    return this.request(`/users/admin/users/unban/${userId}`, 'POST', null, true);
  },
  acceptTerms() {
    return this.request('/users/accept-terms', 'POST', null, true);
  }
};
