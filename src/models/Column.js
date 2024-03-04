const mongoose = require('mongoose');

const ColumnSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  project: { // Añade este campo
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project', // Asume que tienes un modelo de Project
    required: true,
  }
});

const Column = mongoose.model('Column', ColumnSchema);

module.exports = Column;