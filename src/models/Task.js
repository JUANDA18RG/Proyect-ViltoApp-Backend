// models/Task.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  columnId: {
    type: Schema.Types.ObjectId,
    ref: 'Column',
    required: true
  }
});

module.exports = mongoose.model('Task', TaskSchema);