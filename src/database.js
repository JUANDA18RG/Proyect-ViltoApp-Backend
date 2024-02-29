const mongoose = require('mongoose');
console.log(process.env.MONGODB_URI);
const URI = process.env.MONGODB_URI ? process.env.MONGODB_URI : 'mongodb://localhost/viltoapp';


mongoose.connect('mongodb://localhost/viltoapp')
  .then(() => console.log('Conexión a MongoDB exitosa'))
  .catch((err) => console.error('Error conectando a MongoDB:', err));
const connection = mongoose.connection;

connection.once('open', () => {
    console.log('DB is connected');
}
);
