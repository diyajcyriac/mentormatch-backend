const mongoose = require('mongoose');
const Post = require('./Post');

const UserProfileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['mentor', 'mentee'], default: 'mentee', required: true },
  skills: [String],
  interests: [String],
  bio: { type: String, default: '' },
  picture: { type: String, default: 'uploads/image.jpg' },
});



const UserProfile = mongoose.model('UserProfile', UserProfileSchema);

module.exports = UserProfile;
