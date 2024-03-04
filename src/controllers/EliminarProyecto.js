const Project = require('../models/project');

exports.deleteProject = async (req, res) => {
    const { id } = req.params;
    try {
        const project = await Project.findByIdAndDelete(id);
        res.status(200).json(project);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
    }
