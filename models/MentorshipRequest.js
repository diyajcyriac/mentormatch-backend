const mongoose = require('mongoose');

const MentorshipRequestSchema = new mongoose.Schema({
  requestor: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  acceptor: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending', required: true },
  createdAt: { type: Date, default: Date.now },
});

MentorshipRequestSchema.pre('validate', async function (next) {
  const UserProfile = mongoose.model('UserProfile');
  
  const requestorProfile = await UserProfile.findById(this.requestor);
  const acceptorProfile = await UserProfile.findById(this.acceptor);

  if (!requestorProfile || !acceptorProfile) {
    return next(new Error('Invalid requestor or acceptor.'));
  }

  if (requestorProfile.role !== 'mentee') {
    return next(new Error('The requestor must be a mentee.'));
  }

  if (acceptorProfile.role !== 'mentor') {
    return next(new Error('The acceptor must be a mentor.'));
  }

  next();
});


const MentorshipRequest = mongoose.model('MentorshipRequest', MentorshipRequestSchema);

module.exports = MentorshipRequest;
