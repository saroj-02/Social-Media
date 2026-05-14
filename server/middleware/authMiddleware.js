const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Check if user is banned
      if (req.user.isBanned && req.user.banUntil && new Date() < new Date(req.user.banUntil)) {
        return res.status(403).json({ 
          message: `Your account has been banned until ${new Date(req.user.banUntil).toLocaleString()}`,
          isBanned: true,
          banUntil: req.user.banUntil
        });
      }
      
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
