const Column = require('../models/Columns');

exports.getColumnsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const columns = await Column.find({ projectId }).populate('tasks');

    res.status(200).json({
      success: true,
      data: columns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};