const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');


//settings
app.set('port', process.env.PORT || 3000);
//middlewares
app.use(cors());
app.use(express.json());


//routes


module.exports = app