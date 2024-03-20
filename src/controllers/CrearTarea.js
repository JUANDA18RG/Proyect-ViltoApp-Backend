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

    // Emitir un evento de Socket.IO a la sala correspondiente
    const io = req.app.get('io');
    io.to(columnId).emit('task created', newTask);

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).send('Hubo un error al crear la tarea');
  }
};

module.exports = {
  createTask,
};