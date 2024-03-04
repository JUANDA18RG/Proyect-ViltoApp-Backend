const express = require('express');
const CrearProyecto = require('../controllers/CrearProyecto');
const TraerProyecto = require('../controllers/TraerProyecto');
const User = require('../controllers/User');
const Columns = require('../controllers/CrearColumnas');
const EliminarProyecto = require('../controllers/EliminarProyecto');

const router = express.Router();

router.post('/projects', CrearProyecto.addProject);
router.get('/projects/:email', TraerProyecto.getProjects);
router.get('/project/:id', TraerProyecto.getProjectById);
router.post('/users', User.createUser);
router.get('/users/:email', User.getUserByEmail);
router.post('/columns', Columns.createColumn);
router.get('/projects/:projectId/columns', Columns.getColumnsByProject);
router.delete('/projects/:id', EliminarProyecto.deleteProject);



module.exports = router;