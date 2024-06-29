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
  },
  estadoTarea: {
    type: String,
    enum: ['pendiente', 'en progreso', 'finalizada'],
    default: 'pendiente'
  },
});

module.exports = mongoose.model('Task', TaskSchema);