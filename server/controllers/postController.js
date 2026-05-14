const Post = require('../models/Post');
const Notification = require('../models/Notification');

exports.createPost = async (req, res) => {
  console.log('Create Post Request Body:', req.body);
  try {
    const { content, media, type, music } = req.body;
    
    // Validation: Post must have either content or media
    if (!content && !media) {
      return res.status(400).json({ message: 'Post must have either content or media' });
    }

    const post = await Post.create({
      author: req.user._id,
      content: content || '',
      media,
      type: type || 'post',
      music
    });
    await post.populate('author', 'username profilePicture');
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username profilePicture')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username' }
      });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.likes.some(id => id.equals(req.user._id))) {
      post.likes = post.likes.filter(id => !id.equals(req.user._id));
    } else {
      post.likes.push(req.user._id);
      
      // Create notification (if not liking own post)
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          post: post._id
        });
      }
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await post.deleteOne();
    res.json({ message: 'Post removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const query = req.query.q;
    const posts = await Post.find({
      content: { $regex: query, $options: 'i' }
    })
      .sort({ createdAt: -1 })
      .populate('author', 'username profilePicture');
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecommendedReels = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    
    // Basic "Algorithm": 
    // 1. Get reels (type: 'reel')
    // 2. Exclude current user's own reels if logged in
    // 3. Sort by number of likes (desc) and then by date (desc)
    
    let query = { type: 'reel' };
    if (userId) {
      query.author = { $ne: userId };
    }

    const reels = await Post.find(query)
      .populate('author', 'username profilePicture')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username' }
      });

    // Sort by likes length descending, then by createdAt descending
    reels.sort((a, b) => {
      if (b.likes.length !== a.likes.length) {
        return b.likes.length - a.likes.length;
      }
      return b.createdAt - a.createdAt;
    });

    res.json(reels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Only allow updating content and music
    post.content = req.body.content || post.content;
    post.music = req.body.music || post.music;

    await post.save();
    await post.populate('author', 'username profilePicture');
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
