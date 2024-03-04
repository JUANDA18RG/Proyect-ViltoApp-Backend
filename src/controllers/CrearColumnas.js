const Column = require('../models/Column');

// Controlador para crear una columna
exports.createColumn = async (req, res) => {
  const { title, projectId } = req.body;

  try {
    const column = new Column({
      title,
      project: projectId, // Asocia la columna al proyecto
    });

    await column.save();

    res.status(201).json({
      success: true,
      data: column,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};
// Controlador para obtener todas las columnas de un proyecto específico
exports.getColumnsByProject = async (req, res) => {
  try {
    const columns = await Column.find({ project: req.params.projectId });

    res.status(200).json({
      success: true,
      data: columns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};