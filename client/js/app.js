window.app = {
  user: null,
  currentPage: 'home',
  currentProfileId: null,
  posts: [], // Cache for optimistic updates

  async init() {
    this.checkAuth();
    this.bindEvents();
    this.bindModalEvents();
    this.bindPostMediaEvents(); // New helper
    if (this.user) {
      this.loadFeed();
      this.loadSuggestions();
      this.loadTrending();
    }

    window.addEventListener('user-banned', (e) => {
      const { message } = e.detail;
      const banHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 4rem; color: #ff4757; margin-bottom: 20px;">
            <i class="fas fa-user-slash"></i>
          </div>
          <h2 style="color: #eee; margin-bottom: 16px;">Account Suspended</h2>
          <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 24px;">${message}</p>
          <button class="btn btn-primary" onclick="localStorage.clear(); location.reload();" style="width: 100%; padding: 12px;">Understood</button>
        </div>
      `;
      this.showModal('Notice', banHTML);
      // Hide modal footer and close buttons to force attention
      document.querySelector('.modal-footer').style.display = 'none';
      document.getElementById('modal-close').style.display = 'none';
      
      // Auto-logout after 5 seconds if they don't click
      setTimeout(() => {
        localStorage.clear();
        location.reload();
      }, 8000);
    });
  },

  checkAuth() {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
      // Ensure following/followers arrays exist
      if (!this.user.following) this.user.following = [];
      if (!this.user.followers) this.user.followers = [];
      
      document.getElementById('auth-screen').style.display = 'none';
      document.getElementById('app').style.display = 'grid';
      this.updateUserInfo();
      if (this.user.isAdmin) {
        document.getElementById('admin-nav').style.display = 'flex';
      }
      this.handleTermsCheck();
    }
  },

  handleTermsCheck() {
    if (this.user && this.user.needsTermsAcceptance) {
      this.showTermsModal();
    }
  },

  showTermsModal() {
    const termsHTML = `
      <div style="max-height: 550px; overflow-y: auto; padding: 10px; color: #eee; font-size: 0.9rem; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 80px; height: 80px; background: var(--gradient); border-radius: 22px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 10px 20px rgba(0,0,0,0.3);">
            <i class="fas fa-shield-alt" style="font-size: 2.5rem; color: white;"></i>
          </div>
          <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700;">Community Guidelines</h2>
          <p style="color: var(--text-muted); margin-top: 8px;">We want to keep this platform a safe and inspiring place for everyone. By continuing, you agree to follow these rules.</p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <section>
            <h4 style="color: white; margin: 0 0 8px 0; display: flex; align-items: center; gap: 10px;">
              <i class="fas fa-camera" style="color: var(--primary); width: 20px;"></i> Share only what you own
            </h4>
            <p style="margin: 0; color: var(--text-muted); font-size: 0.85rem;">Post only photos and videos that you’ve taken or have the right to share. Do not post anything you've copied or collected from the internet that you don't have the right to post.</p>
          </section>

          <section>
            <h4 style="color: white; margin: 0 0 8px 0; display: flex; align-items: center; gap: 10px;">
              <i class="fas fa-users" style="color: var(--primary); width: 20px;"></i> Post appropriate content
            </h4>
            <p style="margin: 0; color: var(--text-muted); font-size: 0.85rem;">We want our platform to be appropriate for a diverse audience. This means we don't allow nudity, violence, or content that is sexually suggestive.</p>
          </section>

          <section>
            <h4 style="color: white; margin: 0 0 8px 0; display: flex; align-items: center; gap: 10px;">
              <i class="fas fa-handshake" style="color: var(--primary); width: 20px;"></i> Foster genuine interactions
            </h4>
            <p style="margin: 0; color: var(--text-muted); font-size: 0.85rem;">Help us stay spam-free by not artificially collecting likes, followers, or shares. Do not post repetitive comments or content, or repeatedly contact people for commercial purposes without their consent.</p>
          </section>

          <section>
            <h4 style="color: white; margin: 0 0 8px 0; display: flex; align-items: center; gap: 10px;">
              <i class="fas fa-balance-scale" style="color: var(--primary); width: 20px;"></i> Follow the law
            </h4>
            <p style="margin: 0; color: var(--text-muted); font-size: 0.85rem;">We don't allow support or praise for terrorism, organized crime, or hate groups. Offering sexual services and buying or selling illegal or prescription drugs is also strictly prohibited.</p>
          </section>

          <section>
            <h4 style="color: white; margin: 0 0 8px 0; display: flex; align-items: center; gap: 10px;">
              <i class="fas fa-heart" style="color: var(--primary); width: 20px;"></i> Respect our community
            </h4>
            <p style="margin: 0; color: var(--text-muted); font-size: 0.85rem;">We remove content that contains credible threats or hate speech, and content that targets private individuals to degrade or shame them. We do not tolerate bullying or harassment.</p>
          </section>

          <div class="glass" style="padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);">
            <p style="margin: 0; font-size: 0.8rem; color: #aaa; text-align: center;">
              Failure to follow these guidelines may result in deleted content, disabled accounts, or other restrictions. 
              <strong>Your account is currently under review status.</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    this.showModal('Rules & Regulations', termsHTML, async () => {
      try {
        await api.acceptTerms();
        this.user.needsTermsAcceptance = false;
        localStorage.setItem('user', JSON.stringify(this.user));
        ui.showToast('Guidelines accepted. Welcome back!');
        return true;
      } catch (error) {
        ui.showToast(error.message, 'error');
        return false;
      }
    });

    const submitBtn = document.getElementById('modal-submit');
    submitBtn.textContent = 'Accept Guidelines';
    submitBtn.style.padding = '12px 24px';
    submitBtn.style.fontWeight = 'bold';
    document.getElementById('modal-close').style.display = 'none';
  },

  updateUserInfo() {
    const avatars = document.querySelectorAll('.current-user-avatar');
    const avatarUrl = this.user.profilePicture || `https://ui-avatars.com/api/?name=${this.user.username}&background=random`;
    avatars.forEach(img => img.src = avatarUrl);
  },

  bindEvents() {
    // Auth Toggles
    const authToggle = document.getElementById('auth-toggle');
    if (authToggle) {
      authToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isLogin = document.getElementById('auth-btn-text').textContent === 'Login';
        document.getElementById('auth-title').textContent = isLogin ? 'Create an account' : 'Welcome back! Please login.';
        document.getElementById('auth-btn-text').textContent = isLogin ? 'Sign Up' : 'Login';
        document.getElementById('auth-toggle-text').textContent = isLogin ? 'Already have an account?' : "Don't have an account?";
        authToggle.textContent = isLogin ? 'Login' : 'Sign up';
        document.getElementById('username-group').style.display = isLogin ? 'block' : 'none';
      });
    }

    // Auth Form
    const authForm = document.getElementById('auth-form');
    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isLogin = document.getElementById('auth-btn-text').textContent === 'Login';
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const username = document.getElementById('username').value;

        try {
          let result;
          if (isLogin) {
            result = await api.login({ email, password });
          } else {
            const usernameRegex = /^@[a-zA-Z0-9_]+$/;
            if (!usernameRegex.test(username)) {
              ui.showToast('Username must start with @ and contain only letters, numbers, or underscores (no spaces)', 'error');
              return;
            }
            result = await api.register({ username, email, password });
          }
          
          localStorage.setItem('user', JSON.stringify(result));
          localStorage.setItem('token', result.token);
          this.user = result;
          ui.showToast(`Welcome, ${result.username}!`);
          location.reload();
        } catch (error) {
          ui.showToast(error.message, 'error');
        }
      });
    }

    // Post Submission
    const submitPost = document.getElementById('submit-post');
    if (submitPost) {
      submitPost.addEventListener('click', async () => {
        const content = document.getElementById('post-input').value;
        const type = document.getElementById('post-type').value;
        const mediaInput = document.getElementById('post-media-input');
        const mediaFile = mediaInput.files[0];
        
        if (!content.trim() && !mediaFile) return;

        try {
          submitPost.disabled = true;
          submitPost.textContent = 'Posting...';
          
          let mediaUrl = '';
          if (mediaFile) {
            ui.showToast('Uploading media...', 'info');
            mediaUrl = await api.uploadFile(mediaFile);
          }

          const post = await api.createPost({ content, type, media: mediaUrl });
          
          // Clear inputs
          document.getElementById('post-input').value = '';
          mediaInput.value = '';
          document.getElementById('media-preview-container').style.display = 'none';
          document.getElementById('media-preview-content').innerHTML = '';
          
          ui.showToast('Post created!');
          this.loadFeed();
        } catch (error) {
          ui.showToast(error.message, 'error');
        } finally {
          submitPost.disabled = false;
          submitPost.textContent = 'Post';
        }
      });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        location.reload();
      });
    }

    // Navigation
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        this.navigateTo(page);
      });
    });

    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }

    // Explore Tabs
    document.querySelectorAll('.explore-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.explore-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.loadExplore(tab.getAttribute('data-type'));
      });
    });

    // Profile Tabs
    document.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.loadProfile(this.currentProfileId, tab.getAttribute('data-tab'));
      });
    });

    // Edit Profile
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => this.handleEditProfile());
    }

    // Sidebar User Search
    const sidebarSearch = document.getElementById('sidebar-user-search');
    if (sidebarSearch) {
      sidebarSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        this.filterSuggestions(query);
      });
    }

    // Profile Stat Clicks
    const statFollowers = document.getElementById('stat-followers');
    if (statFollowers) {
      statFollowers.onclick = () => this.handleShowUserList('followers');
    }
    const statFollowing = document.getElementById('stat-following');
    if (statFollowing) {
      statFollowing.onclick = () => this.handleShowUserList('following');
    }

    // Sidebar Create Post
    const sidebarCreateBtn = document.getElementById('btn-create-post-sidebar');
    if (sidebarCreateBtn) {
      sidebarCreateBtn.onclick = () => this.handleCreatePostModal();
    }
  },

  bindPostMediaEvents() {
    const mediaInput = document.getElementById('post-media-input');
    const previewContainer = document.getElementById('media-preview-container');
    const previewContent = document.getElementById('media-preview-content');
    const removeBtn = document.getElementById('remove-media');

    if (mediaInput) {
      mediaInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          previewContainer.style.display = 'block';
          if (file.type.startsWith('image/')) {
            previewContent.innerHTML = `<img src="${e.target.result}" style="width: 100%; border-radius: 12px; display: block;">`;
          } else if (file.type.startsWith('video/')) {
            previewContent.innerHTML = `<video src="${e.target.result}" style="width: 100%; border-radius: 12px; display: block;" controls></video>`;
          }
        };
        reader.readAsDataURL(file);
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        mediaInput.value = '';
        previewContainer.style.display = 'none';
        previewContent.innerHTML = '';
      });
    }
  },

  async filterSuggestions(query) {
    if (!this.allSuggestions) {
      this.allSuggestions = await api.getSuggestions();
    }

    const filtered = this.allSuggestions.filter(u => 
      u.username.toLowerCase().includes(query) || 
      (u.fullName && u.fullName.toLowerCase().includes(query))
    );
    this.renderSuggestions(filtered);
  },

  bindModalEvents() {
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('modal-cancel');
    
    const close = () => {
      overlay.style.display = 'none';
      document.body.style.overflow = 'auto';
    };

    closeBtn.onclick = close;
    cancelBtn.onclick = close;
    overlay.onclick = (e) => {
      if (e.target === overlay) close();
    };
  },

  showModal(title, bodyHTML, onConfirm, isWide = false) {
    const overlay = document.getElementById('modal-overlay');
    const card = document.getElementById('modal-card');
    
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    
    // Adjust size
    if (isWide) {
      card.style.maxWidth = '900px';
      card.style.padding = '0';
      document.querySelector('.modal-header').style.padding = '12px 24px';
      document.querySelector('.modal-footer').style.padding = '12px 24px';
    } else {
      card.style.maxWidth = '500px';
      card.style.padding = '32px';
      document.querySelector('.modal-header').style.padding = '0 0 24px 0';
      document.querySelector('.modal-footer').style.padding = '24px 0 0 0';
    }

    const submitBtn = document.getElementById('modal-submit');
    submitBtn.textContent = 'Share';
    submitBtn.onclick = async () => {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sharing...';
      const success = await onConfirm();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Share';
      if (success) {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    };

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  },

  async loadFeed() {
    try {
      const posts = await api.getPosts();
      this.posts = posts;
      this.renderPosts('feed-container', posts);
    } catch (error) {
      console.error('Failed to load feed:', error);
    }
  },

  renderPosts(containerId, posts) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = posts.map(post => ui.renderPost(post, this.user)).join('');
  },

  // Optimistic Updates Logic
  async handleLike(postId) {
    if (!this.user) return ui.showToast('Please login to like posts', 'error');
    
    // Optimistic UI
    const btn = document.getElementById(`like-btn-${postId}`);
    const icon = btn.querySelector('i');
    const count = btn.querySelector('.like-count');
    const isLiked = btn.classList.contains('liked');
    
    btn.classList.toggle('liked');
    icon.className = isLiked ? 'far fa-heart' : 'fas fa-heart';
    count.textContent = parseInt(count.textContent) + (isLiked ? -1 : 1);

    try {
      await api.likePost(postId);
      // Backend handles the toggle, no need for full refresh if optimistic worked
    } catch (error) {
      // Revert on error
      btn.classList.toggle('liked');
      icon.className = !isLiked ? 'far fa-heart' : 'fas fa-heart';
      count.textContent = parseInt(count.textContent) + (!isLiked ? -1 : 1);
      ui.showToast(error.message, 'error');
    }
  },

  async handleDeletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    // Optimistic UI
    const postEl = document.getElementById(`post-${postId}`);
    postEl.style.opacity = '0.5';
    postEl.style.pointerEvents = 'none';

    try {
      await api.deletePost(postId);
      postEl.remove();
      ui.showToast('Post deleted');
    } catch (error) {
      postEl.style.opacity = '1';
      postEl.style.pointerEvents = 'auto';
      ui.showToast(error.message, 'error');
    }
  },

  async handleAddComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value;
    if (!content.trim()) return;

    input.value = '';
    
    try {
      const comment = await api.addComment({ content, postId });
      // Professional way: Append to list instead of full reload
      const list = document.getElementById(`comments-list-${postId}`);
      const div = document.createElement('div');
      div.innerHTML = ui.renderComment(comment, this.user);
      list.appendChild(div.firstElementChild);
      
      // Update comment count
      const countEl = document.querySelector(`#post-${postId} .fa-comment + span`);
      if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
    } catch (error) {
      ui.showToast(error.message, 'error');
    }
  },

  async handleDeleteComment(commentId, postId) {
    if (!confirm('Delete this comment?')) return;
    
    try {
      await api.deleteComment(commentId);
      document.getElementById(`comment-${commentId}`).remove();
      
      // Update comment count
      const countEl = document.querySelector(`#post-${postId} .fa-comment + span`);
      if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
    } catch (error) {
      ui.showToast(error.message, 'error');
    }
  },

  handleCreatePostModal() {
    const bodyHTML = `
      <div class="create-modal-body">
        <div class="create-media-section" id="create-media-dropzone">
          <input type="file" id="create-post-media" accept="image/*,video/*" style="display: none;">
          <div class="media-upload-placeholder" id="upload-placeholder">
            <i class="fas fa-images"></i>
            <p>Drag photos and videos here</p>
            <button class="btn btn-primary" onclick="document.getElementById('create-post-media').click()">Select from computer</button>
          </div>
          <div id="create-media-preview" style="width: 100%; height: 100%; display: none;">
            <!-- Media will be here -->
          </div>
        </div>
        <div class="create-details-section">
          <div class="create-post-header">
            <div class="avatar">
              <img src="${this.user.profilePicture || `https://ui-avatars.com/api/?name=${this.user.username}&background=random`}" alt="${this.user.username}">
            </div>
            <h5>${this.user.username}</h5>
          </div>
          
          <textarea class="caption-textarea" id="create-caption" placeholder="Write a caption..." rows="8"></textarea>
          
          <div class="create-options">
            <div class="create-option-item">
              <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fas fa-map-marker-alt"></i>
                <input type="text" id="create-location" placeholder="Add location" style="background: transparent; border: none; padding: 0; color: white; width: 100%;">
              </div>
            </div>
            
            <div class="create-option-item">
              <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                <i class="fas fa-tag"></i>
                <select id="create-post-type" class="glass" style="background: transparent; border: none; padding: 0; color: white; width: 100%; font-size: 0.95rem;">
                  <option value="post" style="background: var(--bg-card);">Standard Post</option>
                  <option value="reel" style="background: var(--bg-card);">Reel (Vertical Video)</option>
                </select>
              </div>
            </div>

            <div class="create-option-item" id="add-music-btn">
              <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                <i class="fas fa-music"></i>
                <div id="selected-music-info" style="flex: 1;">
                  <span style="display: block;">Add music</span>
                </div>
                <i class="fas fa-chevron-right" id="music-chevron"></i>
              </div>
            </div>

            <div class="create-option-item">
          </div>
        </div>
      </div>
    `;

    let selectedMusic = null;

    this.showModal('Create new post', bodyHTML, async () => {
      const content = document.getElementById('create-caption').value;
      const location = document.getElementById('create-location').value;
      const type = document.getElementById('create-post-type').value;
      const mediaInput = document.getElementById('create-post-media');
      const mediaFile = mediaInput.files[0];

      if (!content.trim() && !mediaFile) {
        ui.showToast('Please add some content or media', 'error');
        return false;
      }

      try {
        let mediaUrl = '';
        if (mediaFile) {
          ui.showToast('Uploading...', 'info');
          mediaUrl = await api.uploadFile(mediaFile);
        }

        // Combine content and location for now (as the backend might not support location field yet)
        const finalContent = location ? `${content}\n\n📍 ${location}` : content;

        await api.createPost({ 
          content: finalContent, 
          type, 
          media: mediaUrl,
          music: selectedMusic 
        });
        ui.showToast('Post shared successfully!');
        this.loadFeed();
        return true;
      } catch (error) {
        ui.showToast(error.message, 'error');
        return false;
      }
    }, true);

    // Bind preview event for the new modal
    const modalMediaInput = document.getElementById('create-post-media');
    const modalPreview = document.getElementById('create-media-preview');
    const modalPlaceholder = document.getElementById('upload-placeholder');
    const musicBtn = document.getElementById('add-music-btn');

    musicBtn.onclick = () => {
      this.handleMusicSearch((song) => {
        selectedMusic = song;
        const info = document.getElementById('selected-music-info');
        info.innerHTML = `
          <strong style="color: var(--primary); font-size: 0.9rem;">${song.title}</strong>
          <span style="display: block; font-size: 0.75rem; color: var(--text-muted);">${song.artist}</span>
        `;
        document.getElementById('music-chevron').className = 'fas fa-times';
        document.getElementById('music-chevron').onclick = (e) => {
          e.stopPropagation();
          selectedMusic = null;
          info.innerHTML = '<span style="display: block;">Add music</span>';
          document.getElementById('music-chevron').className = 'fas fa-chevron-right';
          document.getElementById('music-chevron').onclick = null;
        };
      });
    };

    modalMediaInput.onchange = (e) => {
      const file = e.target.files[0];
      this.handleMediaPreview(file, modalPlaceholder, modalPreview);
    };

    // Drag and drop
    const dropzone = document.getElementById('create-media-dropzone');
    dropzone.ondragover = (e) => {
      e.preventDefault();
      dropzone.style.background = 'rgba(138, 43, 226, 0.1)';
    };
    dropzone.ondragleave = () => {
      dropzone.style.background = '#000';
    };
    dropzone.ondrop = (e) => {
      e.preventDefault();
      dropzone.style.background = '#000';
      const file = e.dataTransfer.files[0];
      if (file) {
        modalMediaInput.files = e.dataTransfer.files;
        this.handleMediaPreview(file, modalPlaceholder, modalPreview);
      }
    };
  },

  handleMediaPreview(file, placeholder, preview) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      placeholder.style.display = 'none';
      preview.style.display = 'flex';
      preview.style.alignItems = 'center';
      preview.style.justifyContent = 'center';
      
      if (file.type.startsWith('image/')) {
        preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
      } else {
        preview.innerHTML = `<video src="${e.target.result}" style="max-width: 100%; max-height: 100%; object-fit: contain;" controls autoplay muted loop></video>`;
      }
    };
    reader.readAsDataURL(file);
  },

  handleMusicSearch(onSelect) {
    const songs = [
      { title: 'Blinding Lights', artist: 'The Weeknd' },
      { title: 'Levitating', artist: 'Dua Lipa' },
      { title: 'Stay', artist: 'The Kid LAROI & Justin Bieber' },
      { title: 'Peaches', artist: 'Justin Bieber' },
      { title: 'Good 4 U', artist: 'Olivia Rodrigo' },
      { title: 'Montero', artist: 'Lil Nas X' },
      { title: 'Save Your Tears', artist: 'The Weeknd' },
      { title: 'Kiss Me More', artist: 'Doja Cat' }
    ];

    const bodyHTML = `
      <div class="search-container glass" style="margin-bottom: 16px;">
        <i class="fas fa-search"></i>
        <input type="text" id="music-search-input" placeholder="Search for music...">
      </div>
      <div id="music-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto;">
        ${songs.map(song => `
          <div class="create-option-item music-item" data-title="${song.title}" data-artist="${song.artist}" style="padding: 12px; border-radius: 8px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="glass" style="width: 40px; height: 40px; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: var(--gradient);">
                <i class="fas fa-music" style="color: white;"></i>
              </div>
              <div>
                <strong style="display: block; font-size: 0.95rem;">${song.title}</strong>
                <span style="font-size: 0.8rem; color: var(--text-muted);">${song.artist}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // We use showModal again, but need to be careful with nested modals.
    // Instagram actually replaces the content or pushes a new view.
    // For simplicity, we'll store the current modal state and restore it, or just use a overlay inside the current modal.
    
    // Let's create a temporary sub-modal or overlay.
    const createModalBody = document.querySelector('.create-modal-body');
    const musicOverlay = document.createElement('div');
    musicOverlay.id = 'music-search-overlay';
    musicOverlay.style = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--bg-card);
      z-index: 10;
      padding: 24px;
      display: flex;
      flex-direction: column;
      animation: fadeIn 0.3s ease;
    `;
    musicOverlay.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
        <button class="action-btn" id="close-music-search"><i class="fas fa-arrow-left"></i></button>
        <h3 style="margin: 0; font-size: 1.2rem;">Choose Music</h3>
      </div>
      ${bodyHTML}
    `;
    createModalBody.appendChild(musicOverlay);

    document.getElementById('close-music-search').onclick = () => musicOverlay.remove();

    const items = musicOverlay.querySelectorAll('.music-item');
    items.forEach(item => {
      item.onclick = () => {
        onSelect({
          title: item.getAttribute('data-title'),
          artist: item.getAttribute('data-artist'),
          url: '#' // Placeholder
        });
        musicOverlay.remove();
      };
    });

    const searchInput = document.getElementById('music-search-input');
    searchInput.oninput = (e) => {
      const query = e.target.value.toLowerCase();
      items.forEach(item => {
        const title = item.getAttribute('data-title').toLowerCase();
        const artist = item.getAttribute('data-artist').toLowerCase();
        item.style.display = (title.includes(query) || artist.includes(query)) ? 'flex' : 'none';
      });
    };
  },

  refreshCurrentPage() {
    if (this.currentPage === 'home') {
      this.loadFeed();
    } else if (this.currentPage === 'profile' && this.currentProfileId) {
      this.loadProfile(this.currentProfileId);
    }
  },

  navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
      targetPage.style.display = 'flex';
      targetPage.style.flexDirection = 'column';
    }
    
    const navLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (navLink) navLink.classList.add('active');
    this.currentPage = page;

    if (page === 'profile') {
      this.loadProfile(this.user._id);
    } else if (page === 'notifications') {
      this.loadNotifications();
    } else if (page === 'explore') {
      this.loadExplore('posts');
    } else if (page === 'reels') {
      this.loadReels();
    } else if (page === 'admin') {
      this.loadAdmin();
    }
  },

  async navigateToProfile(userId) {
    this.navigateTo('profile');
    this.loadProfile(userId);
  },

  async loadProfile(userId, tab = 'posts') {
    try {
      this.currentProfileId = userId;
      const profile = await api.getUserProfile(userId);
      this.currentProfileData = profile; // Store for list viewing
      
      document.getElementById('profile-full-name').textContent = profile.fullName || profile.username;
      document.getElementById('profile-username').textContent = `@${profile.username}`;
      document.getElementById('profile-bio').textContent = profile.bio || 'No bio yet.';
      document.getElementById('profile-img').src = profile.profilePicture || `https://ui-avatars.com/api/?name=${profile.username}&background=random`;
      
      document.getElementById('count-followers').textContent = profile.followers.length;
      document.getElementById('count-following').textContent = profile.following.length;
      
      // Filter posts for this user and tab type
      if (this.posts.length === 0) {
        this.posts = await api.getPosts();
      }
      const userPosts = this.posts.filter(p => {
        const authorId = p.author._id || p.author;
        const matchesType = tab === 'reels' ? p.type === 'reel' : p.type === 'post';
        return authorId === userId && matchesType;
      });
      
      document.getElementById('count-posts').textContent = this.posts.filter(p => (p.author._id || p.author) === userId).length;
      
      const container = document.getElementById('user-posts-container');
      if (tab === 'reels') {
        container.className = 'instagram-grid';
        container.innerHTML = userPosts.map(p => ui.renderGridItem(p)).join('');
      } else {
        container.className = 'main-content'; // Feed style
        container.innerHTML = userPosts.map(p => ui.renderPost(p, this.user)).join('');
      }
      
      // Follow button logic
      const followBtn = document.getElementById('follow-btn');
      if (this.user && this.user._id !== userId) {
        followBtn.style.display = 'block';
        const isFollowing = profile.followers.some(f => (f._id || f) === this.user._id);
        followBtn.textContent = isFollowing ? 'Unfollow' : 'Follow';
        followBtn.className = isFollowing ? 'btn btn-outline' : 'btn btn-primary';
        followBtn.onclick = () => this.handleFollow(userId);
      } else {
        followBtn.style.display = 'none';
      }
    } catch (error) {
      ui.showToast(error.message, 'error');
    }
  },

  async handleFollow(userId) {
    // Optimistic UI Update: Find all buttons for this user and update them instantly
    const buttons = document.querySelectorAll(`button[onclick*="'${userId}'"]`);
    const isCurrentlyFollowing = this.user && this.user.following.some(id => (id._id || id) === userId);

    buttons.forEach(btn => {
      // Toggle logic for button appearance
      const nextState = isCurrentlyFollowing ? 'Follow' : 'Following';
      btn.textContent = nextState;
      btn.className = nextState === 'Following' ? 'btn btn-outline btn-pop' : 'btn btn-primary btn-pop';
      
      // Remove animation class after it finishes
      setTimeout(() => btn.classList.remove('btn-pop'), 3000);
    });

    try {
      const result = await api.followUser(userId);
      
      // Update local user state
      if (this.user && result.following) {
        this.user.following = result.following;
        localStorage.setItem('user', JSON.stringify(this.user));
      }

      if (isCurrentlyFollowing) {
        ui.showToast('Unfollowed', 'info');
      } else {
        ui.showToast('Following');
      }

      // Refresh views to be safe
      this.loadSuggestions();
      this.loadTrending();
    } catch (error) {
      ui.showToast(error.message, 'error');
      // Revert optimistic update
      buttons.forEach(btn => {
        const nextState = isCurrentlyFollowing ? 'Following' : 'Follow';
        btn.textContent = nextState;
        btn.className = nextState === 'Following' ? 'btn btn-outline' : 'btn btn-primary';
      });
    }
  },

  async handleEditProfile() {
    const bodyHTML = `
      <div class="form-group">
        <label>Name</label>
        <input type="text" id="edit-name" placeholder="Full Name" value="${this.user.fullName || ''}">
      </div>
      <div class="form-group">
        <label>User ID (@username)</label>
        <input type="text" id="edit-username" placeholder="username" value="${this.user.username || ''}">
      </div>
      <div class="form-group">
        <label>Bio</label>
        <textarea id="edit-bio" rows="3" placeholder="Tell us about yourself...">${this.user.bio || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Profile Picture</label>
        <input type="file" id="edit-avatar-file" accept="image/*">
        <p style="font-size: 0.75rem; color: var(--text-muted);">Leave empty to keep current</p>
      </div>
    `;

    this.showModal('Edit Profile', bodyHTML, async () => {
      const fullName = document.getElementById('edit-name').value;
      const username = document.getElementById('edit-username').value;
      const bio = document.getElementById('edit-bio').value;
      const avatarFile = document.getElementById('edit-avatar-file').files[0];

      try {
        let profilePicture = this.user.profilePicture;
        if (avatarFile) {
          ui.showToast('Uploading image...', 'info');
          profilePicture = await api.uploadFile(avatarFile);
        }

        const usernameRegex = /^@[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
          ui.showToast('Username must start with @ and contain only letters, numbers, or underscores (no spaces)', 'error');
          return false;
        }

        const updatedUser = await api.updateProfile({ fullName, username, bio, profilePicture });
        const token = localStorage.getItem('token');
        this.user = { ...updatedUser, token };
        localStorage.setItem('user', JSON.stringify(this.user));
        
        ui.showToast('Profile updated!');
        this.updateUserInfo();
        this.loadProfile(this.user._id);
        return true;
      } catch (error) {
        ui.showToast(error.message, 'error');
        return false;
      }
    });
  },

  async loadSuggestions() {
    try {
      const users = await api.getAllUsers();
      this.allSuggestions = users;
      this.renderSuggestions(users);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  },

  renderSuggestions(suggestions) {
    const container = document.getElementById('suggestions-container');
    if (!container) return;

    if (suggestions.length === 0) {
      container.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 10px;">No users found.</p>';
      return;
    }

    container.innerHTML = suggestions.map(user => {
      const isFollowing = this.user && this.user.following.some(id => (id._id || id) === user._id);
      return `
        <div class="follow-item">
          <div style="display: flex; gap: 12px; align-items: center; cursor: pointer;" onclick="app.navigateToProfile('${user._id}')">
            <div class="avatar" style="width: 40px; height: 40px;">
              <img src="${user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}" alt="${user.username}">
            </div>
            <div style="max-width: 120px; overflow: hidden;">
              <h5 style="font-size: 0.9rem; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${user.username}</h5>
              <span style="font-size: 0.7rem; color: var(--text-muted); display: block; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${user.followers.length} followers</span>
            </div>
          </div>
          <button class="btn ${isFollowing ? 'btn-outline' : 'btn-primary'} btn-pop" style="padding: 6px 10px; font-size: 0.75rem;" onclick="app.handleFollow('${user._id}')">
            ${isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      `;
    }).join('');
  },

  async loadNotifications() {
    try {
      const notifications = await api.getNotifications();
      const container = document.getElementById('notifications-container');
      container.innerHTML = notifications.length 
        ? notifications.map(n => ui.renderNotification(n, this.user)).join('')
        : '<p style="text-align: center; color: var(--text-muted);">No notifications yet.</p>';
      
      api.markNotificationsRead();
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  },

  async handleSearch(query) {
    if (!query.trim()) return this.loadExplore('posts');
    
    try {
      const [users, posts] = await Promise.all([
        api.searchUsers(query),
        api.searchPosts(query)
      ]);
      
      const container = document.getElementById('explore-grid');
      container.className = 'main-content'; // Linear style for search results
      
      const usersHTML = users.map(user => `
        <div class="glass" style="padding: 16px; display: flex; align-items: center; gap: 12px; cursor: pointer;" onclick="app.navigateToProfile('${user._id}')">
          <img src="${user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}" class="avatar" style="width: 40px; height: 40px;">
          <div>
            <strong style="display: block;">${user.username}</strong>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${user.followers.length} followers</span>
          </div>
        </div>
      `).join('');
      
      const postsHTML = posts.map(post => ui.renderPost(post, this.user)).join('');
      container.innerHTML = usersHTML + postsHTML;
    } catch (error) {
      console.error('Search failed:', error);
    }
  },

  async loadExplore(type) {
    try {
      const container = document.getElementById('explore-grid');
      if (type === 'reels' && container) container.innerHTML = ui.renderReelSkeleton();
      
      const posts = await api.getPosts();
      
      if (type === 'people') {
        container.className = 'main-content';
        const users = await api.getAllUsers();
        this.renderSuggestions(users);
        return;
      }

      const filtered = posts.filter(p => type === 'reels' ? p.type === 'reel' : p.type === 'post');
      container.className = 'instagram-grid';
      container.innerHTML = filtered.map(p => ui.renderGridItem(p)).join('');
    } catch (error) {
      console.error('Failed to load explore:', error);
    }
  },

  async showPostDetail(postId) {
    // Show post in modal or navigate
    const post = this.posts.find(p => p._id === postId);
    if (post) {
      this.showModal('Post Details', ui.renderPost(post, this.user), () => true);
    }
  },

  handleShowUserList(type) {
    if (!this.currentProfileData) return;
    
    const users = this.currentProfileData[type];
    const title = type.charAt(0).toUpperCase() + type.slice(1);
    
    if (!users || users.length === 0) {
      ui.showToast(`No ${type} yet.`, 'info');
      return;
    }

    const bodyHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px; max-height: 400px; overflow-y: auto;">
        ${users.map(user => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid var(--glass-border);">
            <div style="display: flex; gap: 12px; align-items: center; cursor: pointer;" onclick="document.getElementById('modal-close').click(); app.navigateToProfile('${user._id}')">
              <img src="${user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}" style="width: 40px; height: 40px; border-radius: 50%;">
              <div>
                <div style="font-weight: 600;">${user.username}</div>
              </div>
            </div>
            ${this.user && user._id !== this.user._id ? `
              <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="app.handleFollow('${user._id}')">
                ${this.user.following.some(id => (id._id || id) === user._id) ? 'Unfollow' : 'Follow'}
              </button>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;

    this.showModal(title, bodyHTML, () => true);
    // Hide footer buttons for this simple list
    document.querySelector('.modal-footer').style.display = 'none';
    
    // Re-enable footer on close
    const oldClose = document.getElementById('modal-close').onclick;
    document.getElementById('modal-close').onclick = () => {
      document.querySelector('.modal-footer').style.display = 'flex';
      oldClose();
      document.getElementById('modal-close').onclick = oldClose;
    };
  },

  async handleEditPost(postId) {
    const post = this.posts.find(p => p._id === postId);
    if (!post) return;

    let selectedMusic = post.music || null;

    const bodyHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="form-group">
          <label>Caption & Hashtags</label>
          <textarea id="edit-post-content" class="glass" style="width: 100%; min-height: 120px; padding: 12px; border-radius: 12px; resize: none; border: 1px solid var(--glass-border);">${post.content || ''}</textarea>
        </div>
        
        <div id="edit-music-section">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Background Music</label>
          <div id="edit-music-display" class="glass" style="padding: 12px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--glass-border);">
            ${selectedMusic ? `
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="background: var(--primary); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                  <i class="fas fa-music"></i>
                </div>
                <div>
                  <div style="font-weight: 600; font-size: 0.9rem;">${selectedMusic.title}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${selectedMusic.artist}</div>
                </div>
              </div>
              <i class="fas fa-times" id="remove-edit-music" style="cursor: pointer; color: var(--text-muted);"></i>
            ` : `
              <span style="color: var(--text-muted); font-size: 0.9rem;">No music selected</span>
              <button class="btn btn-primary" id="change-edit-music" style="padding: 6px 12px; font-size: 0.8rem;">Add Music</button>
            `}
          </div>
        </div>

        <p style="font-size: 0.8rem; color: var(--text-muted); text-align: center;">Note: Media (photos/videos) and Post Type cannot be changed after posting.</p>
      </div>
    `;

    this.showModal('Edit Post', bodyHTML, async () => {
      const content = document.getElementById('edit-post-content').value;
      
      try {
        ui.showToast('Saving changes...', 'info');
        const updatedPost = await api.updatePost(postId, { content, music: selectedMusic });
        
        // Update local cache
        const index = this.posts.findIndex(p => p._id === postId);
        if (index !== -1) this.posts[index] = updatedPost;
        
        ui.showToast('Post updated successfully!');
        this.refreshCurrentPage();
        return true;
      } catch (error) {
        ui.showToast(error.message, 'error');
        return false;
      }
    });

    // Handle Music interaction in Edit Modal
    const updateMusicUI = () => {
      const display = document.getElementById('edit-music-display');
      if (selectedMusic) {
        display.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="background: var(--primary); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
              <i class="fas fa-music"></i>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 0.9rem;">${selectedMusic.title}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${selectedMusic.artist}</div>
            </div>
          </div>
          <i class="fas fa-times" id="remove-edit-music" style="cursor: pointer; color: var(--text-muted);"></i>
        `;
        document.getElementById('remove-edit-music').onclick = () => {
          selectedMusic = null;
          updateMusicUI();
        };
      } else {
        display.innerHTML = `
          <span style="color: var(--text-muted); font-size: 0.9rem;">No music selected</span>
          <button class="btn btn-primary" id="change-edit-music" style="padding: 6px 12px; font-size: 0.8rem;">Add Music</button>
        `;
        document.getElementById('change-edit-music').onclick = () => {
          this.handleMusicSearch((music) => {
            selectedMusic = music;
            updateMusicUI();
          });
        };
      }
    };

    if (selectedMusic) {
      document.getElementById('remove-edit-music').onclick = () => {
        selectedMusic = null;
        updateMusicUI();
      };
    } else {
      document.getElementById('change-edit-music').onclick = () => {
        this.handleMusicSearch((music) => {
          selectedMusic = music;
          updateMusicUI();
        });
      };
    }
  },

  async loadReels() {
    try {
      const container = document.getElementById('reels-container');
      if (container) container.innerHTML = ui.renderReelSkeleton();
      
      const reels = await api.getRecommendedReels();
      this.posts = [...this.posts, ...reels]; // Add to cache
      
      if (reels.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No reels found yet. Be the first to create one!</p>';
        return;
      }
      
      container.innerHTML = reels.map(reel => ui.renderGridItem(reel)).join('');
    } catch (error) {
      console.error('Failed to load reels:', error);
      ui.showToast('Failed to load reels', 'error');
    }
  },

  async loadTrending() {
    try {
      const posts = await api.getPosts();
      const hashtags = {};
      
      posts.forEach(post => {
        if (!post.content) return;
        // Regex to capture hashtags including letters, numbers, underscores and some international chars
        const matches = post.content.match(/#[a-zA-Z0-9_\u0900-\u097F]+/gi);
        if (matches) {
          matches.forEach(tag => {
            const normalized = tag.toLowerCase();
            hashtags[normalized] = (hashtags[normalized] || 0) + 1;
          });
        }
      });

      const trendingList = Object.entries(hashtags)
        .sort((a, b) => b[1] - a[1]) // Sort by frequency
        .slice(0, 7); // Show exactly top 7

      const container = document.getElementById('trending-container');
      if (!container) return;

      if (trendingList.length === 0) {
        container.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted);">No trending tags yet.</p>';
        return;
      }

      container.innerHTML = trendingList.map(([tag, count]) => `
        <div class="trending-item" style="cursor: pointer;" onclick="app.handleHashtagClick('${tag}')">
          <span>Trending Tag</span>
          <h5>${tag}</h5>
          <span>${count} ${count === 1 ? 'post' : 'posts'}</span>
        </div>
      `).join('');
    } catch (error) {
      console.error('Failed to load trending:', error);
    }
  },

  async handleHashtagClick(tag) {
    this.navigateTo('explore');
    document.getElementById('search-input').value = tag;
    this.handleSearch(tag);
  },

  async loadAdmin() {
    try {
      const users = await api.adminGetAllUsers();
      document.getElementById('admin-user-count').textContent = `${users.length} Users`;
      const container = document.getElementById('admin-users-list');
      
      container.innerHTML = users.map(user => `
        <tr style="border-bottom: 1px solid var(--glass-border);">
          <td style="padding: 12px; display: flex; align-items: center; gap: 12px;">
            <img src="${user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}" style="width: 32px; height: 32px; border-radius: 50%;">
            <div>
              <div style="font-weight: 600;">${user.username}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${user.fullName || ''}</div>
            </div>
          </td>
          <td style="padding: 12px; font-size: 0.85rem;">${user.email}</td>
          <td style="padding: 12px; font-size: 0.85rem;">${new Date(user.createdAt).toLocaleDateString()}</td>
          <td style="padding: 12px; text-align: right;">
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button class="btn btn-primary btn-sm" onclick="app.handleAdminViewDetails('${user._id}')" style="padding: 4px 8px; font-size: 0.7rem;">Details</button>
              ${user.isBanned ? 
                `<button class="btn btn-outline btn-sm" onclick="app.handleAdminUnbanUser('${user._id}')" style="padding: 4px 8px; font-size: 0.7rem; color: #2ecc71;">Unban</button>` :
                `<button class="btn btn-outline btn-sm" onclick="app.handleAdminBanUserModal('${user._id}')" style="padding: 4px 8px; font-size: 0.7rem; color: #f1c40f;">Ban</button>`
              }
              <button class="btn btn-outline btn-sm" onclick="app.handleAdminDeleteUser('${user._id}')" style="padding: 4px 8px; font-size: 0.7rem; color: #ff4757;">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      ui.showToast(error.message, 'error');
    }
  },

  async handleAdminDeleteUser(userId) {
    if (!confirm('Are you absolutely sure? This will permanently delete the user.')) return;
    try {
      await api.adminDeleteUser(userId);
      ui.showToast('User deleted successfully');
      this.loadAdmin();
    } catch (error) {
      ui.showToast(error.message, 'error');
    }
  },

  async handleAdminViewDetails(userId) {
    try {
      const user = await api.adminGetUserDetails(userId);
      const detailsHTML = `
        <div style="text-align: left; display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
            <img src="${user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}" style="width: 80px; height: 80px; border-radius: 50%;">
            <div>
              <h3 style="margin: 0;">${user.fullName || user.username}</h3>
              <p style="color: var(--primary); margin: 0;">@${user.username}</p>
            </div>
          </div>
          <div class="glass" style="padding: 16px; border-radius: 12px;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>ID:</strong> ${user._id}</p>
            <p><strong>Joined:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
            <p><strong>Bio:</strong> ${user.bio || 'None'}</p>
            <p><strong>Is Admin:</strong> ${user.isAdmin ? 'Yes' : 'No'}</p>
            <p><strong>Followers:</strong> ${user.followers.length}</p>
            <p><strong>Following:</strong> ${user.following.length}</p>
            ${user.isBanned ? `<p style="color: #ff4757;"><strong>Banned Until:</strong> ${new Date(user.banUntil).toLocaleString()}</p>` : ''}
          </div>
        </div>
      `;
      this.showModal('User Details', detailsHTML);
    } catch (error) {
      ui.showToast(error.message, 'error');
    }
  },

  async handleAdminBanUserModal(userId) {
    const bodyHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px; color: #eee;">
        <p style="font-size: 0.9rem; color: var(--text-muted);">Select the suspension period. The user will be instantly logged out and prevented from re-entering until the ban expires.</p>
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="flex: 1;">
            <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px;">Duration</label>
            <input type="number" id="ban-duration-value" value="1" min="1" class="glass" 
              style="padding: 12px; width: 100%; color: white; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
          </div>
          <div style="flex: 1;">
            <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px;">Unit</label>
            <select id="ban-duration-type" class="glass" 
              style="padding: 12px; width: 100%; color: white; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
              <option value="months" style="background: #1a1a1a;">Months</option>
              <option value="years" style="background: #1a1a1a;">Years</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary" onclick="app.handleAdminBanUserSubmit('${userId}')" style="padding: 14px; margin-top: 8px; font-weight: 600;">Confirm Suspension</button>
      </div>
    `;
    this.showModal('Admin Action: Ban User', bodyHTML);
  },

  async handleAdminBanUserSubmit(userId) {
    const durationType = document.getElementById('ban-duration-type').value;
    const durationValue = document.getElementById('ban-duration-value').value;
    
    try {
      await api.adminBanUser({ userId, durationType, durationValue });
      ui.showToast('User banned successfully');
      this.closeModal();
      this.loadAdmin();
    } catch (error) {
      ui.showToast(error.message, 'error');
    }
  },

  async handleAdminUnbanUser(userId) {
    try {
      await api.adminUnbanUser(userId);
      ui.showToast('User unbanned successfully');
      this.loadAdmin();
    } catch (error) {
      ui.showToast(error.message, 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());
