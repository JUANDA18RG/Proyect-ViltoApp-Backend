// controllers/taskController.js
const Column = require('../models/Columns');
const Task = require('../models/Task');

const moveTask = async (req, res) => {
    console.log('Request Body:', req.body);
  const { taskId } = req.params;
  const {
    sourceColumnId,
    destinationColumnId,
    sourceIndex,
    destinationIndex,
  } = req.body;

  try {
    // Obtener la tarea que se está moviendo
    const movedTask = await Task.findById(taskId);

    // Obtener las columnas de origen y destino
    const sourceColumn = await Column.findById(req.body.sourceColumnId);
    const destinationColumn = await Column.findById(req.body.destinationColumnId);
    console.log('Source Column:', sourceColumn);
    console.log('Destination Column:', destinationColumn);


    // Eliminar la tarea de la columna de origen
    sourceColumn.tasks.splice(sourceIndex, 1);

    // Insertar la tarea en la columna de destino en la posición especificada
    destinationColumn.tasks.splice(destinationIndex, 0, movedTask);

    // Guardar las columnas actualizadas
    await sourceColumn.save();
    await destinationColumn.save();

    res.status(200).send('Tarea movida exitosamente');
  } catch (error) {
    console.error('Error in moveTask:', error);
    res.status(500).send('Error al mover la tarea');
  }
};

module.exports = {
  moveTask,
};
