const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  media: {
    type: String, // URL to image/video
    default: ''
  },
  type: {
    type: String,
    enum: ['post', 'reel'],
    default: 'post'
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  music: {
    title: String,
    artist: String,
    url: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
