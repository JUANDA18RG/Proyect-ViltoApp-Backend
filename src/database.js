const {connect} = require('mongoose');
const {MONGO_URI} = require('./config');

 const  connectDB = async () => {
    try {
        await connect(MONGO_URI);
        console.log('Conexión a MongoDB exitosa');
    } catch (err) {
        console.error('Error conectando a MongoDB:', err);
    }
};

module.exports = {connectDB};
 

