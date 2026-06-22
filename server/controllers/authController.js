const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  try {
    let { username, email, password } = req.body;
    
    // Validate username format (lowercase, numbers, underscore only)
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ message: 'Username must contain only lowercase letters, numbers, and underscores' });
    }
    
    // Add @ symbol to username
    const displayUsername = `@${username}`;
    
    // If email not provided, generate a temporary one
    if (!email) {
      email = `${username}@aura.social`;
    }
    
    const userExists = await User.findOne({ $or: [{ email }, { username: displayUsername }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ username: displayUsername, email, password });
    
    res.status(201).json({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      bio: user.bio,
      isAdmin: user.isAdmin,
      profilePicture: user.profilePicture,
      followers: user.followers,
      following: user.following,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // identifier can be email or username (with or without @)
    if (!identifier) return res.status(400).json({ message: 'Email or username required' });

    let user = null;
    if (identifier.startsWith('@')) {
      user = await User.findOne({ username: identifier });
    } else {
      user = await User.findOne({ email: identifier });
      if (!user) {
        // try username without @ by prepending
        user = await User.findOne({ username: `@${identifier}` });
      }
    }

    if (user) {
      // Automatic unban check
      if (user.isBanned && user.banUntil && new Date() >= new Date(user.banUntil)) {
        user.isBanned = false;
        user.banUntil = null;
        user.needsTermsAcceptance = true;
        await user.save();
      }

      if (await user.comparePassword(password)) {
        // Check if user is still banned
        if (user.isBanned && user.banUntil && new Date() < new Date(user.banUntil)) {
          return res.status(403).json({ 
            message: `You have been banned from this platform till ${new Date(user.banUntil).toLocaleString()}`,
            isBanned: true,
            banUntil: user.banUntil
          });
        }

        res.json({
          _id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          bio: user.bio,
          isAdmin: user.isAdmin,
          needsTermsAcceptance: user.needsTermsAcceptance,
          profilePicture: user.profilePicture,
          followers: user.followers,
          following: user.following,
          token: generateToken(user._id)
        });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
