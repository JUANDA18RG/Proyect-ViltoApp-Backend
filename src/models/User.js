// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  uid: { type: String, required: true, unique: true },
  premium: { type: Boolean, default: false }, // nuevo campo premium
  proyectosFavoritos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  acciones: [{
    accion: { type: String },
    fecha: { type: Date, default: Date.now },
  }],
});

module.exports = mongoose.model('User', UserSchema);