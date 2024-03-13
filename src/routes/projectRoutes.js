const express = require('express');
const CrearProyecto = require('../controllers/CrearProyecto');
const TraerProyecto = require('../controllers/TraerProyecto');
const User = require('../controllers/User');
const EliminarProyecto = require('../controllers/EliminarProyecto');
const createColumn = require('../controllers/CrearColumn');
const TraerColumnas = require('../controllers/TraerColumns');
const EliminarColumna = require('../controllers/EliminarColumna');
const createTask = require('../controllers/CrearTarea');
const TraerTareas = require('../controllers/TraerTareas');
const MoverTarea = require('../controllers/MoverTarea');


const router = express.Router();

router.post('/projects', CrearProyecto.addProject);
router.get('/projects/:email', TraerProyecto.getProjects);
router.get('/project/:id', TraerProyecto.getProjectById);
router.post('/users', User.createUser);
router.get('/users/:email', User.getUserByEmail);
router.delete('/projects/:id', EliminarProyecto.deleteProject);
router.post('/columns', createColumn.createColumn);
router.get('/columns/:projectId', TraerColumnas.getColumnsByProject);
router.delete('/columns/:id', EliminarColumna.deleteColumn);
router.post('/tasks', createTask.createTask);
router.get('/tasks', TraerTareas.getTasks);
router.put('/mover/:taskId', MoverTarea.moveTask);





module.exports = router;