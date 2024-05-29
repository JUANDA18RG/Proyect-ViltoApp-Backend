// models/Project.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  users: [{ name: String, email: String }],
  columns: [{
    name: String,
    tasks: [{
      name: String,
      description: String
    }]
  }],
  chat: [{
    sender: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },

  Links: [{
    url: String,
    description: String
  }],
});

module.exports = mongoose.model('Project', ProjectSchema);