// controllers/TraerProyecto.js
const Project = require('../models/project');

exports.getProjects = async (req, res) => {
  try {
    const email = req.params.email;
    const projects = await Project.find({ 'users.email': email });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const id = req.params.id;
    const project = await Project.findById(id);
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};