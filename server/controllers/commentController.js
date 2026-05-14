const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.addComment = async (req, res) => {
  try {
    const { content, postId } = req.body;
    const comment = await Comment.create({
      author: req.user._id,
      post: postId,
      content
    });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    post.comments.push(comment._id);
    await post.save();

    await comment.populate('author', 'username profilePicture');
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const post = await Post.findById(comment.post);
    post.comments = post.comments.filter(id => id.toString() !== comment._id.toString());
    await post.save();

    await comment.deleteOne();
    res.json({ message: 'Comment removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
