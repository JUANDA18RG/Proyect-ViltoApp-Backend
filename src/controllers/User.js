// controllers/UserController.js
const User = require('../models/User');

exports.createUser = async (req, res) => {
  const { name, email, uid } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(200).json(user);
    }
    user = new User({ name, email, uid });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserByEmail = async (req, res) => {
  const email = req.params.email;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};