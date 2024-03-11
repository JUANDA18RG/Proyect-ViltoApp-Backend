const Task = require('../models/Task');
const Column = require('../models/Columns');

const createTask = async (req, res) => {
  try {
    const { name, columnId } = req.body;
    const newTask = new Task({ name, columnId });
    await newTask.save();

    // Encuentra la columna correspondiente y añade la nueva tarea a su array `tasks`
    const column = await Column.findById(columnId);
    column.tasks.push(newTask._id);
    await column.save();

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).send('Hubo un error al crear la tarea');
  }
};

module.exports = {
  createTask,
};