const Task = require('../models/Task');

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).send('Hubo un error al obtener las tareas');
  }
};

module.exports = {
  getTasks,
};