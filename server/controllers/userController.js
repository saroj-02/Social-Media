const User = require('../models/User');
const Notification = require('../models/Notification');

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture');
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow || !currentUser) return res.status(404).json({ message: 'User not found' });

    const isFollowing = currentUser.following.some(id => id.equals(userToFollow._id));

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => !id.equals(userToFollow._id));
      userToFollow.followers = userToFollow.followers.filter(id => !id.equals(currentUser._id));
    } else {
      // Follow
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);

      // Create notification
      await Notification.create({
        recipient: userToFollow._id,
        sender: currentUser._id,
        type: 'follow'
      });
    }

    await currentUser.save();
    await userToFollow.save();

    res.json({ 
      message: 'Success',
      following: currentUser.following 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      // Check if username is being changed and if it's already taken
      if (req.body.username && req.body.username !== user.username) {
        const usernameExists = await User.findOne({ username: req.body.username });
        if (usernameExists) {
          return res.status(400).json({ message: 'Username is already taken' });
        }
        user.username = req.body.username;
      }

      user.fullName = req.body.fullName || user.fullName;
      user.bio = req.body.bio || user.bio;
      user.profilePicture = req.body.profilePicture || user.profilePicture;
      
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        bio: updatedUser.bio,
        isAdmin: updatedUser.isAdmin,
        profilePicture: updatedUser.profilePicture
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSuggestions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    // Get users that are NOT the current user AND NOT already followed
    const suggestions = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        { _id: { $nin: currentUser.following } }
      ]
    })
    .limit(20) // Increased limit to show more accounts
    .select('username fullName profilePicture followers bio');
    
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username fullName profilePicture followers bio')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.q;
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('username fullName profilePicture bio followers');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin Controller Methods
exports.getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserFullDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { userId, durationType, durationValue } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.isAdmin) return res.status(400).json({ message: 'Cannot ban an admin' });

    console.log(`Banning user ${userId} for ${durationValue} ${durationType}`);
    
    let banUntil = new Date();
    if (durationType === 'months') {
      banUntil.setMonth(banUntil.getMonth() + parseInt(durationValue));
    } else if (durationType === 'years') {
      banUntil.setFullYear(banUntil.getFullYear() + parseInt(durationValue));
    }

    user.isBanned = true;
    user.banUntil = banUntil;
    await user.save();
    console.log(`User ${userId} banned until ${banUntil}`);

    // Send notification
    try {
      await Notification.create({
        recipient: user._id,
        sender: req.user._id,
        type: 'system',
        content: `banned your account until ${banUntil.toLocaleString()} for community safety.`
      });
      console.log('Ban notification sent');
    } catch (notifError) {
      console.error('Failed to send ban notification:', notifError);
      // We don't fail the whole request if notification fails, 
      // but the user is still banned.
    }

    res.json({ message: 'User banned successfully', banUntil });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBanned = false;
    user.banUntil = null;
    user.needsTermsAcceptance = true;
    await user.save();

    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acceptTerms = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.needsTermsAcceptance = false;
    await user.save();

    res.json({ message: 'Terms accepted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
