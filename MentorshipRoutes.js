const express = require('express');
const router = express.Router();
const MentorshipRequest = require('./models/MentorshipRequest');
const UserProfile = require('./models/UserProfile');


router.post('/mentorship/request', async (req, res) => {
  const { requestor, acceptor } = req.body;

  if (!requestor || !acceptor) {
    return res.status(400).json({ error: 'Requestor and Acceptor IDs are required.' });
  }

  try {
    const requestorProfile = await UserProfile.findById(requestor);
    const acceptorProfile = await UserProfile.findById(acceptor);

    if (!requestorProfile || !acceptorProfile) {
      return res.status(404).json({ error: 'One or both users not found.' });
    }
    const existingRequest = await MentorshipRequest.findOne({ requestor, acceptor });
    if (existingRequest) {
      return res.status(400).json({ error: 'A request between these users already exists.' });
    }

    const newRequest = new MentorshipRequest({
      requestor,
      acceptor,
    });

    await newRequest.save();

    res.status(201).json({ message: 'Mentorship request created successfully.', request: newRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating the mentorship request.' });
  }
});

router.get('/mentorship/request/status', async (req, res) => {
  const { requestor, acceptor } = req.query;

  if (!requestor || !acceptor) {
    return res.status(400).json({ error: 'Requestor and Acceptor IDs are required.' });
  }

  try {
    const request = await MentorshipRequest.findOne({ requestor, acceptor });

    if (!request) {
      return res.status(404).json({ error: 'No mentorship request found between these users.' });
    }

    res.status(200).json({
      requestor: request.requestor,
      acceptor: request.acceptor,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while retrieving the request status.' });
  }
});


module.exports = router;
