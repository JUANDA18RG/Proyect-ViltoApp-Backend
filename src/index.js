require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conexión a MongoDB exitosa');
    const port = app.get('port');
    app.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Error conectando a MongoDB:', err);
  }
}

main();