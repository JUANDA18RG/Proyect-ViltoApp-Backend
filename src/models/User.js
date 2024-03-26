// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  uid: { type: String, required: true, unique: true },
  proyectosFavoritos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
});

module.exports = mongoose.model('User', UserSchema);