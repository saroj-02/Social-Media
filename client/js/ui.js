window.ui = {
  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'success' ? 'var(--gradient)' : '#ff4757';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
      toast.style.transform = 'translateY(150%)';
    }, 3000);
  },

  formatContent(content) {
    if (!content) return '';
    // Regex matches # followed by alphanumeric/underscore/hindi characters
    return content.replace(/#[a-zA-Z0-9_\u0900-\u097F]+/g, (tag) => {
      return `<span class="hashtag" onclick="event.stopPropagation(); app.handleHashtagClick('${tag}')" style="color: var(--primary); cursor: pointer; font-weight: 600;">${tag}</span>`;
    });
  },

  getMediaUrl(mediaPath) {
    if (!mediaPath) return '';
    
    // Always upgrade any http:// to https:// to prevent mixed content errors
    if (mediaPath.startsWith('http://')) {
      return mediaPath.replace(/^http:\/\//, 'https://');
    }
    
    // If already a full HTTPS URL (Cloudinary or absolute), use directly
    if (mediaPath.startsWith('https://')) {
      return mediaPath;
    }
    
    // If it is a relative path starting with /uploads or uploads
    if (mediaPath.startsWith('/uploads') || mediaPath.startsWith('uploads')) {
      const cleanPath = mediaPath.startsWith('/') ? mediaPath : '/' + mediaPath;
      const { protocol, hostname } = window.location;
      
      // If client is running locally (file:// or localhost)
      if (protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'https://social-media-6tlu.onrender.com' + cleanPath;
      }
      
      // On the deployed server, construct absolute URL
      return window.location.origin + cleanPath;
    }
    
    return mediaPath;
  },

  renderPost(post, currentUser) {
    const isLiked = currentUser && post.likes.some(id => (id._id || id) === currentUser._id);
    const postDate = new Date(post.createdAt).toLocaleDateString();
    
    return `
      <div class="post-card glass" id="post-${post._id}" data-id="${post._id}">
        <div class="post-header">
          <div class="avatar">
            <img src="${(post.author && post.author.profilePicture) || `https://ui-avatars.com/api/?name=${(post.author && post.author.username) || 'User'}&background=random`}" alt="${(post.author && post.author.username) || 'User'}">
          </div>
          <div class="post-info">
            <h4 style="cursor: pointer;" onclick="app.navigateToProfile('${(post.author && post.author._id) || ''}')">${(post.author && post.author.username) || 'Deleted User'}</h4>
            <span>${postDate}</span>
          </div>
        </div>
        ${post.music ? `
          <div class="post-music" style="margin-bottom: 12px; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--primary); background: var(--glass); padding: 4px 12px; border-radius: 20px; width: fit-content;">
            <i class="fas fa-music"></i>
            <span>${post.music.title} • ${post.music.artist}</span>
          </div>
        ` : ''}
        <div class="post-content">
          ${this.formatContent(post.content)}
        </div>
        ${post.media ? (
          post.type === 'reel' 
            ? `<video src="${this.getMediaUrl(post.media)}" class="post-media" controls autoplay muted loop></video>`
            : `<img src="${this.getMediaUrl(post.media)}" class="post-media">`
        ) : ''}
        <div class="post-actions">
          <button class="action-btn ${isLiked ? 'liked' : ''}" id="like-btn-${post._id}" onclick="app.handleLike('${post._id}')">
            <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
            <span class="like-count">${post.likes.length}</span>
          </button>
          <button class="action-btn" onclick="ui.toggleComments('${post._id}')">
            <i class="far fa-comment"></i>
            <span>${post.comments.length}</span>
          </button>
          ${currentUser && post.author && currentUser._id === post.author._id ? `
            <div style="display: flex; gap: 12px; margin-left: auto; align-items: center;">
              <i class="fas fa-edit edit-btn" onclick="app.handleEditPost('${post._id}')" style="cursor: pointer; color: var(--primary);" title="Edit Post"></i>
              <i class="fas fa-trash delete-btn" onclick="app.handleDeletePost('${post._id}')" style="cursor: pointer; color: #ff4757;" title="Delete Post"></i>
            </div>
          ` : ''}
        </div>
        <div class="comments-section" id="comments-${post._id}" style="display: none; margin-top: 16px; border-top: 1px solid var(--glass-border); padding-top: 16px;">
          <div class="comments-list" id="comments-list-${post._id}">
            ${post.comments.map(c => this.renderComment(c, currentUser)).join('')}
          </div>
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <input type="text" placeholder="Add a comment..." id="comment-input-${post._id}" style="padding: 8px 12px; font-size: 0.9rem;">
            <button class="btn btn-primary" style="padding: 8px 16px; font-size: 0.8rem;" onclick="app.handleAddComment('${post._id}')">Send</button>
          </div>
        </div>
      </div>
    `;
  },

  renderComment(comment, currentUser) {
    const isOwner = currentUser && comment.author && (comment.author._id === currentUser._id || comment.author === currentUser._id);
    return `
      <div class="comment-item" id="comment-${comment._id}" style="margin-bottom: 12px; font-size: 0.9rem; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <strong style="color: var(--primary); cursor: pointer;" onclick="app.navigateToProfile('${(comment.author && (comment.author._id || comment.author)) || ''}')">
            ${(comment.author && comment.author.username) || 'Deleted User'}:
          </strong> 
          <span class="comment-content">${comment.content}</span>
        </div>
        ${isOwner ? `
          <button class="action-btn" style="font-size: 0.75rem; padding: 0;" onclick="app.handleDeleteComment('${comment._id}', '${comment.post}')">
            <i class="fas fa-times"></i>
          </button>
        ` : ''}
      </div>
    `;
  },

  toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    const isHidden = section.style.display === 'none';
    section.style.display = isHidden ? 'block' : 'none';
    
    if (isHidden) {
      section.style.animation = 'fadeIn 0.3s ease-out';
    }
  },

  renderGridItem(post) {
    const isReel = post.type === 'reel';
    return `
      <div class="grid-item" onclick="app.showPostDetail('${post._id}')">
        <div class="reel-badge">
          <i class="fas ${isReel ? 'fa-play' : 'fa-th'}"></i>
          ${isReel ? 'Reel' : 'Post'}
        </div>
        ${isReel 
          ? `<video src="${this.getMediaUrl(post.media)}" muted loop onmouseover="this.play()" onmouseout="this.pause(); this.currentTime=0;"></video>` 
          : `<img src="${this.getMediaUrl(post.media) || 'https://via.placeholder.com/300'}" alt="post">`
        }
        <div class="reel-info">
          <strong style="font-size: 0.9rem;">@${(post.author && post.author.username) || 'User'}</strong>
          <div style="display: flex; gap: 12px; font-size: 0.8rem;">
            <span><i class="fas fa-heart"></i> ${post.likes.length}</span>
            <span><i class="fas fa-comment"></i> ${post.comments.length}</span>
          </div>
        </div>
        <div class="overlay" style="display: none;"></div>
      </div>
    `;
  },

  renderReelSkeleton() {
    return Array(6).fill(0).map(() => `
      <div class="grid-item skeleton" style="border: none;">
        <div style="position: absolute; bottom: 20px; left: 20px; width: 60%;">
          <div class="skeleton" style="height: 12px; width: 80%; margin-bottom: 8px; background: rgba(255,255,255,0.1);"></div>
          <div class="skeleton" style="height: 10px; width: 40%; background: rgba(255,255,255,0.1);"></div>
        </div>
      </div>
    `).join('');
  },

  renderNotification(n, currentUser) {
    let actionHtml = '';
    const isFollowing = currentUser && n.sender && currentUser.following.some(id => (id._id || id) === n.sender._id);

    if (n.type === 'follow') {
      actionHtml = `
        <button class="btn ${isFollowing ? 'btn-outline' : 'btn-primary'}" onclick="app.handleFollow('${(n.sender && n.sender._id) || ''}')" style="padding: 6px 10px; font-size: 0.75rem;">
          ${isFollowing ? 'Following' : 'Follow'}
        </button>
      `;
    } else if (n.type === 'like' || n.type === 'comment') {
      if (n.post && n.post.media) {
        actionHtml = `<img src="${this.getMediaUrl(n.post.media)}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover; cursor: pointer;" onclick="app.showPostDetail('${n.post._id}')">`;
      }
    } else if (n.type === 'system') {
      actionHtml = `<i class="fas fa-info-circle" style="color: var(--primary); font-size: 1.2rem;"></i>`;
    }

    let message = '';
    if (n.type === 'follow') message = 'started following you';
    else if (n.type === 'like') message = 'liked your post';
    else if (n.type === 'comment') message = 'commented on your post';
    else if (n.type === 'system') message = n.content || 'sent you a system message';

    return `
      <div class="follow-item glass" style="margin-bottom: 8px; border: none; ${n.read ? 'opacity: 0.8;' : 'border-left: 3px solid var(--primary);'}">
        <div style="display: flex; gap: 12px; align-items: center;">
          <div class="avatar" style="width: 40px; height: 40px; cursor: pointer;" onclick="app.navigateToProfile('${(n.sender && n.sender._id) || ''}')">
            <img src="${(n.sender && n.sender.profilePicture) || `https://ui-avatars.com/api/?name=${(n.sender && n.sender.username) || 'User'}&background=random`}" alt="${(n.sender && n.sender.username) || 'User'}">
          </div>
          <div>
            <p style="font-size: 0.85rem;">
              <strong style="cursor: pointer;" onclick="app.navigateToProfile('${(n.sender && n.sender._id) || ''}')">${(n.sender && n.sender.username) || 'Deleted User'}</strong> 
              ${message}
            </p>
            <span style="font-size: 0.7rem; color: var(--text-muted);">${new Date(n.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        ${actionHtml}
      </div>
    `;
  }
};
