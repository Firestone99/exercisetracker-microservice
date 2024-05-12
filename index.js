const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/exercise-tracker');

// User model
const User = mongoose.model('User', {
  username: String
});

// Exercise model
const Exercise = mongoose.model('Exercise', {
  userId: String,
  description: String,
  duration: Number,
  date: { type: Date, default: Date.now }
});

// Home route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Create a new user
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    const user = new User({ username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const userId = req.params._id;
    const exercise = new Exercise({ userId, description, duration, date: date || new Date() });
    await exercise.save();
    res.json({
      username: exercise.userId,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: exercise.userId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add exercise' });
  }
});

// Get exercise log of a user
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const userId = req.params._id;
    const { from, to, limit } = req.query;
    let query = { userId };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }
    let exercises = await Exercise.find(query).limit(parseInt(limit) || null);
    const user = await User.findById(userId);
    const log = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }));
    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exercise log' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Your app is listening on port ${PORT}`);
});
