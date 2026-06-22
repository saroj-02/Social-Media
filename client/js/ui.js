window.ui = {
  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    if (type === 'success') {
      toast.style.background = 'var(--gradient)';
    } else if (type === 'error') {
      toast.style.background = '#ff4757';
    } else if (type === 'info') {
      toast.style.background = 'linear-gradient(135deg, #1a73e8, #0d47a1)';
    }
    toast.style.transform = 'translateY(0)';
    // Info toasts stay until replaced; others auto-hide after 3s
    if (type !== 'info') {
      setTimeout(() => {
        toast.style.transform = 'translateY(150%)';
      }, 3000);
    }
  },

  hideToast() {
    const toast = document.getElementById('toast');
    if (toast) toast.style.transform = 'translateY(150%)';
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

  // Beautiful placeholder shown when media fails to load
  getMediaPlaceholderHtml(isVideo = false) {
    return `
      <div style="
        width: 100%;
        min-height: 220px;
        background: linear-gradient(135deg, rgba(138,43,226,0.12) 0%, rgba(0,128,255,0.08) 100%);
        border: 1.5px dashed rgba(138,43,226,0.35);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        color: rgba(255,255,255,0.35);
        font-size: 0.85rem;
        padding: 32px;
        margin: 12px 0;
      ">
        <i class="fas ${isVideo ? 'fa-video-slash' : 'fa-image'}" style="font-size: 2.5rem; color: rgba(138,43,226,0.45);"></i>
        <span style="font-weight: 600; color: rgba(255,255,255,0.5);">${isVideo ? 'Video unavailable' : 'Image unavailable'}</span>
        <span style="font-size: 0.73rem; text-align: center; max-width: 220px; line-height: 1.5; color: rgba(255,255,255,0.3);">This media was stored temporarily and is no longer available</span>
      </div>
    `;
  },

  renderPost(post, currentUser) {
    const isLiked = currentUser && post.likes.some(id => (id._id || id) === currentUser._id);
    const postDate = new Date(post.createdAt).toLocaleDateString();
    const authorName = (post.author && post.author.username) || 'User';
    const authorPic = (post.author && post.author.profilePicture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`;
    const mediaUrl = post.media ? this.getMediaUrl(post.media) : '';
    const isVideo = post.type === 'reel';

    // Build the media HTML with onerror fallback
    let mediaHtml = '';
    if (post.media) {
      if (isVideo) {
        mediaHtml = `
          <div class="post-media-wrapper" id="media-wrapper-${post._id}">
            <video
              src="${mediaUrl}"
              class="post-media"
              controls autoplay muted loop
              onerror="ui.handleMediaError('${post._id}', true)"
            ></video>
          </div>`;
      } else {
        mediaHtml = `
          <div class="post-media-wrapper" id="media-wrapper-${post._id}">
            <img
              src="${mediaUrl}"
              class="post-media"
              alt="Post image"
              onerror="ui.handleMediaError('${post._id}', false)"
            >
          </div>`;
      }
    }

    return `
      <div class="post-card glass" id="post-${post._id}" data-id="${post._id}">
        <div class="post-header">
          <div class="avatar">
            <img
              src="${authorPic}"
              alt="${authorName}"
              onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random'"
            >
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
        ${mediaHtml}
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

  // Called by onerror on broken post media — replaces wrapper with a styled placeholder
  handleMediaError(postId, isVideo) {
    const wrapper = document.getElementById(`media-wrapper-${postId}`);
    if (wrapper) {
      wrapper.innerHTML = this.getMediaPlaceholderHtml(isVideo);
    }
  },

  renderComment(comment, currentUser) {
    const isOwner = currentUser && comment.author && (comment.author._id === currentUser._id || comment.author === currentUser._id);
    const authorName = (comment.author && comment.author.username) || 'Deleted User';
    return `
      <div class="comment-item" id="comment-${comment._id}" style="margin-bottom: 12px; font-size: 0.9rem; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <strong style="color: var(--primary); cursor: pointer;" onclick="app.navigateToProfile('${(comment.author && (comment.author._id || comment.author)) || ''}')">
            ${authorName}:
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
    const mediaUrl = this.getMediaUrl(post.media);
    const authorName = (post.author && post.author.username) || 'Post';
    // Purple gradient placeholder thumbnail (generated as SVG data URI)
    const placeholderUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&size=300&background=8a2be2&color=fff&bold=true`;
    
    return `
      <div class="grid-item" onclick="app.showPostDetail('${post._id}')">
        <div class="reel-badge">
          <i class="fas ${isReel ? 'fa-play' : 'fa-th'}"></i>
          ${isReel ? 'Reel' : 'Post'}
        </div>
        ${isReel 
          ? `<video src="${mediaUrl}" muted loop
              onmouseover="this.play()"
              onmouseout="this.pause(); this.currentTime=0;"
              onerror="this.outerHTML='<div style=\\'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,rgba(138,43,226,0.25),rgba(0,128,255,0.15));\\'><i class=\\'fas fa-video-slash\\' style=\\'font-size:1.8rem;color:rgba(255,255,255,0.3);\\'></i><span style=\\'font-size:0.65rem;color:rgba(255,255,255,0.3);\\'>Unavailable</span></div>'"
            ></video>`
          : `<img
              src="${mediaUrl || placeholderUrl}"
              alt="post"
              onerror="this.onerror=null;this.src='${placeholderUrl}'"
            >`
        }
        <div class="reel-info">
          <strong style="font-size: 0.9rem;">@${authorName}</strong>
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
    const senderName = (n.sender && n.sender.username) || 'User';
    const senderPic = (n.sender && n.sender.profilePicture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random`;

    if (n.type === 'follow') {
      actionHtml = `
        <button class="btn ${isFollowing ? 'btn-outline' : 'btn-primary'}" onclick="app.handleFollow('${(n.sender && n.sender._id) || ''}')" style="padding: 6px 10px; font-size: 0.75rem;">
          ${isFollowing ? 'Following' : 'Follow'}
        </button>
      `;
    } else if (n.type === 'like' || n.type === 'comment') {
      if (n.post && n.post.media) {
        const mediaUrl = this.getMediaUrl(n.post.media);
        const fallbackUrl = `https://ui-avatars.com/api/?name=Post&size=40&background=8a2be2&color=fff`;
        actionHtml = `<img src="${mediaUrl}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover; cursor: pointer;" onclick="app.showPostDetail('${n.post._id}')" onerror="this.onerror=null;this.src='${fallbackUrl}'">`;
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
            <img
              src="${senderPic}"
              alt="${senderName}"
              onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random'"
            >
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
