const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ username, email, password });
    
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
    const { email, password } = req.body;
    const user = await User.findOne({ email });

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
        res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
