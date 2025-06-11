// apiRoutes.js
const express = require('express');
const router = express.Router();
const Concert = require('../model/concert');
const User = require('../model/user');
const Booking = require('../model/booking_details');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const { validationResult, check } = require('express-validator');
const session = require('express-session');
const { title } = require('process');

// Setup multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = './public/images';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// User Registration
router.post('/signup', [
  check('username').isAlpha().withMessage('Username must be letters only'),
  check('email').isEmail().withMessage('Invalid email'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password, confirmpassword } = req.body;
  if (password !== confirmpassword) return res.status(400).json({ message: 'Passwords must match' });

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ message: 'Email already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, email, password: hashedPassword, role: 'User' });
  await newUser.save();
  res.status(201).json({ message: 'User registered successfully' });
});

// User Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid email' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'incorrect password' });

  req.session.email = user.email;
  req.session.username = user.username;
  req.session.role = user.role;

  res.status(200).json({ message: 'Login successful', user: { username: user.username, role: user.role ,title} });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out' });
  });
});

// Create Concert
router.post('/api/concerts', upload.single('image'), async (req, res) => {
  const { eventName, eventPlace, date, time, available_ticket, amount } = req.body;
  const imagePath = req.file ? `/images/${req.file.filename}` : null;
  const concert = new Concert({ eventName, eventPlace, date, time, available_ticket, amount, image: imagePath });
  await concert.save();
  res.status(201).json(concert);
});

// Get Concerts
router.get('/concerts', async (req, res) => {
  const concerts = await Concert.find();
  res.status(200).json({concert:concerts});
});

// Update Concert
router.put('concerts/:id', upload.single('image'), async (req, res) => {
  const updateData = { ...req.body };
  if (req.file) updateData.image = `/images/${req.file.filename}`;
  const concert = await Concert.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.status(200).json(concert);
});

// Delete Concert
router.delete('/concerts/:id', async (req, res) => {
  await Concert.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// Book Concert
router.post('/bookings/:concertId', async (req, res) => {
  const concert = await Concert.findById(req.params.concertId);
  concert.available_ticket -= Number(req.body.ticketQuantity);
  await concert.save();

  const booking = new Booking({
    username: req.body.username,
    email: req.body.email,
    ticketQuantity: Number(req.body.ticketQuantity),
    total_amount: Number(req.body.totalAmount),
    concertId: concert._id
  });

  await booking.save();
  res.status(201).json(booking);
});

// Get Bookings
router.get('/bookings', async (req, res) => {
  const bookings = await Booking.find().populate('concertId');
  res.status(200).json(bookings);
});

router.get('/bookings/user', async (req, res) => {
  console.log("Session Email:", req.query.email); // debug
  const { email } = req.query;

  if (!email) return res.status(400).json({ message: 'Session email not found' });

  const bookings = await Booking.find({ email }).populate('concertId');
  res.status(200).json(bookings);
});



// Get a specific concert by ID
router.get('/api/concert/:id', async (req, res) => {
  try {
    const concert = await Concert.findById(req.params.id);
    if (!concert) return res.status(404).json({ message: 'Concert not found' });

    res.status(200).json({
      concert,
      username: req.session?.username || null,
      email: req.session?.email || null,
      role: req.session?.role || null,
    });
  } catch (error) {
    console.error("Error fetching concert:", error);
    res.status(500).json({ message: 'Error fetching concert' });
  }
});



module.exports = router;
