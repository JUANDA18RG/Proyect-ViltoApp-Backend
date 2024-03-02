// controllers/projectController.js
const Project = require('../models/project'); // Asegúrate de que la ruta sea correcta

exports.addProject = async (req, res) => {
  try {
    const newProject = new Project({
      name: req.body.name,
      description: req.body.description,
      users: req.body.users || [],
    });

    const project = await newProject.save();

    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};