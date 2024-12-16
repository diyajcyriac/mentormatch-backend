const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const fs = require("fs");
const UserProfile = require("./models/UserProfile");
const Post = require("./models/Post"); 
const mentorshipRoutes = require('./MentorshipRoutes');
const MentorshipRequest = require('./models/MentorshipRequest');
require('dotenv').config();

const app = express();
const uploadMiddleware = multer({ dest: "uploads/" });
const salt = bcrypt.genSaltSync(10);
const secret = process.env.JWT_SECRET || "asdfe45we45w345wegw345werjktjwertkj";

// Middleware setup
app.use(cors({ credentials: true, origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI
);

// Token verification middleware
const verifyToken = (req, res, next) => {
  const { token } = req.cookies;
  if (!token)
    return res.status(401).json({ error: "Unauthorized: No token provided" });

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};


app.use('/api', mentorshipRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/hi', (req, res) => {
  res.send('Mentorship API');
});



// Register Step 1
app.post("/register-step-1", async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res
      .status(400)
      .json({ error: "Username, password, and role are required" });
  }

  try {
    const existingUser = await UserProfile.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const hashedPassword = bcrypt.hashSync(password, salt);
    const userDoc = await UserProfile.create({
      username,
      password: hashedPassword,
      role,
    });

    res.status(201).json({ _id: userDoc._id, username: userDoc.username });
  } catch (e) {
    console.error("Error registering user:", e);
    res
      .status(400)
      .json({ error: "Error registering user", details: e.message });
  }
});

app.post("/register-step-2", async (req, res) => {
  const { userId, skills, interests, bio } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const userDoc = await UserProfile.findByIdAndUpdate(
      userId,
      { skills, interests, bio },
      { new: true }
    );
    if (!userDoc) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(userDoc); 
  } catch (e) {
    console.error("Error updating user profile:", e);
    res
      .status(400)
      .json({ error: "Error updating profile", details: e.message });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await UserProfile.findOne({ username });
    if (!userDoc) return res.status(404).json({ error: "User not found" });

    const isPasswordValid = bcrypt.compareSync(password, userDoc.password);
    if (!isPasswordValid)
      return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: userDoc._id, username }, secret, {
      expiresIn: "1h",
    });
    res.cookie("token", token).json({ id: userDoc._id, username });
  } catch (e) {
    res.status(400).json({ error: "Login failed", details: e.message });
  }
});

app.get("/users", async (req, res) => {
  console.log(req.query);
  const { role, skills, interests } = req.query;

  const filter = {};
  if (role) filter.role = role;

  if (skills) {
    const skillsRegex = skills.split(",").map((skill) => ({
      skills: { $regex: skill.trim(), $options: "i" },
    }));
    filter.$or = skillsRegex;
  }

  if (interests) {
    const interestsRegex = interests.split(",").map((interest) => ({
      interests: { $regex: interest.trim(), $options: "i" },
    }));
    filter.$or = filter.$or
      ? [...filter.$or, ...interestsRegex]
      : interestsRegex;
  }

  try {
    const users = await UserProfile.find(
      filter,
      "username role skills interests bio picture"
    );
    res.json(users);
  } catch (e) {
    console.error("Error fetching users:", e);
    res.status(500).json({ error: "Error fetching users", details: e.message });
  }
});

// Fetch post by ID
app.get("/user/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const userProfile = await UserProfile.findById(id).populate(
      "role",
      "username skills interests bio picture"
    );

    if (!userProfile) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(userProfile);
  } catch (e) {
    res.status(400).json({ error: "Error fetching user", details: e.message });
  }
});

app.put("/profile", uploadMiddleware.single("file"), async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    const { username, bio, skills, interests, role } = req.body;
    let newPath = null;

    if (req.file) {
      const { originalname, path } = req.file;
      const parts = originalname.split(".");
      const ext = parts[parts.length - 1];
      newPath = path + "." + ext;
      fs.renameSync(path, newPath);
    }

    try {
      const userDoc = await UserProfile.findById(info.id);
      if (!userDoc) {
        return res.status(404).json({ message: "User not found" });
      }

      userDoc.username = username || userDoc.username;
      userDoc.bio = bio || userDoc.bio;

      if (skills) {
        userDoc.skills = skills.split(",").map((skill) => skill.trim());
      }
      if (interests) {
        userDoc.interests = interests
          .split(",")
          .map((interest) => interest.trim());
      }

      if (role) {
        userDoc.role = role; 
      }

      userDoc.picture = newPath || userDoc.picture;

      await userDoc.save();
      res.json(userDoc);
    } catch (e) {
      console.log(e);
      res
        .status(400)
        .json({ message: "Error updating profile", error: e.message });
    }
  });
});

app.delete("/profile", async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    try {
      const userDoc = await UserProfile.findById(info.id);
      if (!userDoc) {
        return res.status(404).json({ message: "User not found" });
      }


      await UserProfile.findByIdAndDelete(info.id);

      res.clearCookie("token");
      res.json({ message: "Profile deleted and session cleared" });
    } catch (e) {
      console.error(e);
      res
        .status(400)
        .json({ message: "Error deleting profile", error: e.message });
    }
  });
});


// Profile
app.get("/profile", verifyToken, (req, res) => {
  res.json(req.user);
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie("token").json({ message: "Logged out successfully" });
});

// Create a post
app.post(
  "/post",
  [verifyToken, uploadMiddleware.single("file")],
  async (req, res) => {
    const { originalname, path } = req.file;
    const ext = originalname.split(".").pop();
    const newPath = `${path}.${ext}`;
    fs.renameSync(path, newPath);

    const { title, summary, content } = req.body;
    try {
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: newPath,
        author: req.user.id,
      });
      res.status(201).json(postDoc);
    } catch (e) {
      res
        .status(400)
        .json({ error: "Error creating post", details: e.message });
    }
  }
);

// Update a post 
app.put(
  "/post",
  [verifyToken, uploadMiddleware.single("file")],
  async (req, res) => {
    let newPath = null;
    if (req.file) {
      const { originalname, path } = req.file;
      const ext = originalname.split(".").pop();
      newPath = `${path}.${ext}`;
      fs.renameSync(path, newPath);
    }

    const { id, title, summary, content } = req.body;
    try {
      const postDoc = await Post.findById(id);
      if (!postDoc) return res.status(404).json({ error: "Post not found" });
      if (postDoc.author.toString() !== req.user.id) {
        return res.status(403).json({ error: "You are not the author" });
      }

      postDoc.title = title;
      postDoc.summary = summary;
      postDoc.content = content;
      postDoc.cover = newPath || postDoc.cover;
      await postDoc.save();

      res.json(postDoc);
    } catch (e) {
      res
        .status(400)
        .json({ error: "Error updating post", details: e.message });
    }
  }
);

// Fetch posts
app.get("/post", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(posts);
  } catch (e) {
    res.status(400).json({ error: "Error fetching posts", details: e.message });
  }
});

// Fetch post by ID
app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const postDoc = await Post.findById(id).populate("author", "username");
    if (!postDoc) return res.status(404).json({ error: "Post not found" });
    res.json(postDoc);
  } catch (e) {
    res.status(400).json({ error: "Error fetching post", details: e.message });
  }
});

const calculateMatchScore = (user1, user2) => {
  const matchingSkills = user1.skills.filter((skill) =>
    user2.skills.includes(skill)
  );
  const matchingInterests = user1.interests.filter((interest) =>
    user2.interests.includes(interest)
  );
  const score = matchingSkills.length + matchingInterests.length;

  console.log(
    `Matching Skills between ${user1.username} and ${user2.username}:`,
    matchingSkills
  );
  console.log(
    `Matching Interests between ${user1.username} and ${user2.username}:`,
    matchingInterests
  );

  return { score, matchingSkills, matchingInterests };
};

app.get("/matchmaking", verifyToken, async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const user = await UserProfile.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const targetRole = user.role === "mentee" ? "mentor" : "mentee";

    const potentialMatches = await UserProfile.find(
      {
        _id: { $ne: userId },
        role: targetRole,
      },
      "id username role skills interests bio picture"
    );

    const matches = potentialMatches
      .map((match) => {
        const { score, matchingSkills, matchingInterests } =
          calculateMatchScore(user, match);

        if (score > 0) {
          return {
            match,
            score,
            matchingSkills,
            matchingInterests,
          };
        }
        return null;
      })
      .filter((match) => match !== null);

    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, 5).map((match) => ({
      id: match.match.id,
      username: match.match.username,
      role: match.match.role,
      skills: match.match.skills,
      interests: match.match.interests,
      bio: match.match.bio,
      score: match.score,
      matchingSkills: match.matchingSkills,
      matchingInterests: match.matchingInterests,
      picture: match.match.picture,
    }));

    res.json(topMatches);
  } catch (e) {
    console.error("Error fetching matches:", e);
    res
      .status(400)
      .json({ error: "Error fetching matches", details: e.message });
  }
});

app.get("/api/mentorship/requests", verifyToken, async (req, res) => {
  const userId = req.user.id; 
  console.log(req.query.requestor);
  console.log(userId);

  try {
    const requests = await MentorshipRequest.find({
      acceptor: userId,
    }).populate("requestor", "username picture role skills ");

    if (requests.length === 0) {
      return res.status(404).json({ message: "No requests found" });
    }
    res.status(200).json({ requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching requests." });
  }
});

app.patch("/api/mentorship/request/accept/:requestId", verifyToken, async (req, res) => {
  const requestId = req.params.requestId;
  console.log("request",requestId)
  const userId = req.user.id; 

  try {
    const request = await MentorshipRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status === "accepted") {
      return res.status(400).json({ message: "Request already accepted" });
    }

    if (request.acceptor.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to accept this request" });
    }

    request.status = "accepted";
    await request.save();

    res.status(200).json({ message: "Request accepted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while accepting the request" });
  }
});

app.patch("/api/mentorship/request/decline/:requestId", verifyToken, async (req, res) => {
  const requestId = req.params.requestId;
  console.log("request", requestId);
  const userId = req.user.id; 

  try {
    const request = await MentorshipRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status === "accepted") {
      return res.status(400).json({ message: "Request has already been accepted" });
    }
    if (request.status === "declined") {
      return res.status(400).json({ message: "Request has already been declined" });
    }

    if (request.acceptor.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to decline this request" });
    }

    request.status = "declined";
    await request.save();

    res.status(200).json({ message: "Request declined successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while declining the request" });
  }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
