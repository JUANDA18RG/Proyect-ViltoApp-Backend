const Column = require('../models/Columns');

exports.deleteColumn = async (req, res) => {
  try {
    const column = await Column.findByIdAndDelete(req.params.id);

    if (!column) {
      return res.status(404).json({ message: 'No se encontró la columna' });
    }

    // No es necesario utilizar el método deleteOne después de findByIdAndDelete,
    // ya que este método ya realiza la operación de eliminación.

    res.status(200).json({ message: 'Columna eliminada con éxito' });
  } catch (error) {
    console.error('Error deleting column:', error);
    res.status(500).json({ message: 'Hubo un error al eliminar la columna' });
  }
};
