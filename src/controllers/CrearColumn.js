// controllers/columnController.js
const Column = require('../models/Columns');
const Project = require('../models/project');

exports.createColumn = async (req, res) => {
  try {
    const { name, projectId, tasks } = req.body;

    // Verificar que el proyecto existe
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const column = new Column({
      name,
      projectId,
      tasks
    });

    await column.save();

    res.status(201).json({
      success: true,
      data: column
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};