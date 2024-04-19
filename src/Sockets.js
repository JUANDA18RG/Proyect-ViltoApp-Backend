const Project = require('./models/project');
const Column = require('./models/Columns');
const Task = require('./models/Task');
const User = require('./models/User');



const obtenerProyectos = async (emailUsuario, socket) => {
  try {
    const proyectos = await Project.find({ 'users.email': emailUsuario });
    socket.emit('proyectos', proyectos);
  } catch (error) {
    socket.emit('error', error.message);
  }
};
const crearProyecto = async (data, socket, io) => {
  try {
    const { name, description, users, userEmail } = data;

    // Buscar al usuario en la base de datos
    const user = await User.findOne({ email: userEmail });
    if (user) {
      if (!user.premium) {
        const userProjectsCount = await Project.countDocuments({ 'users.email': userEmail });

        if (userProjectsCount >= 6) {
          // Emitir un evento de error al cliente
          socket.emit('error', 'Has alcanzado el límite de proyectos para usuarios no premium.');
          return;
        }
      }

      const newProject = new Project({
        name,
        description,
        users: users || [],
      });

      const project = await newProject.save();

      // Emitir un evento de Socket.IO a todos los usuarios
      io.emit('proyectoCreado', project);

      const fechaCreacion = project.createdAt;
      console.log('Fecha de creación del proyecto:', fechaCreacion);

      const nuevaAccion = {
        accion: `Creó el proyecto ${name}`,
        fecha: new Date(),
      };
      user.acciones.push(nuevaAccion);
      await user.save();
    } else {
      // Emitir un evento de error al cliente
      socket.emit('error', 'Usuario no encontrado');
    }

  } catch (error) {
    // Emitir un evento de error al cliente
    socket.emit('error', error.message);
  }
};

const eliminarProyecto = async (id, socket, io) => {
  try {
    const project = await Project.findByIdAndDelete(id);

    // Emitir un evento de Socket.IO a todos los usuarios
    io.emit('proyectoEliminado', id);

  } catch (error) {
    // Emitir un evento de error al cliente
    socket.emit('error', error.message);
  }
};

const obtenerProyecto = async (id, socket) => {
  try {
    const project = await Project.findById(id).populate('users');
    socket.emit('proyecto', project);
  } catch (error) {
    socket.emit('error', error.message);
  }
};

const obtenerColumnas = async (projectId, socket, callback) => {
  try {
    const columns = await Column.find({ projectId }).populate('tasks');
    socket.emit('columnas', columns);
    if (typeof callback === 'function') {
      callback({
        success: true,
        data: columns
      });
    }
  } catch (error) {
    console.error(error);
    if (typeof callback === 'function') {
      callback({
        success: false,
        error: error.message
      });
    }
  }
};
const crearColumna = async (data, socket, io, callback) => {
  try {
    const { name, projectId, userEmail } = data;

    const newColumn = new Column({
      name,
      projectId,
    });

    const column = await newColumn.save();

    // Emitir un evento de Socket.IO a todos los usuarios
    io.emit('columnaCreada', column);

    // Buscar al usuario en la base de datos y guardar la acción
    const user = await User.findOne({ email: userEmail });
    if (user) {
      // Agregar la acción a la lista de acciones del usuario con el nombre del proyecto
      const nuevaAccion = {
        accion: `Creó la columna ${name} en el proyecto ${projectId}`,
        fecha: new Date(),
      };
      user.acciones.push(nuevaAccion);
      await user.save();
    }

    // Enviar respuesta de éxito al cliente
    if (typeof callback === 'function') {
      callback({
        success: true,
        data: column
      });
    }
  } catch (error) {
    console.error(error);
    // Emitir un evento de error al cliente
    socket.emit('error', error.message);
    // Enviar respuesta de error al cliente
    if (typeof callback === 'function') {
      callback({
        success: false,
        error: error.message
      });
    }
  }
};

const eliminarColumna = async (data, socket, io, callback) => {
  try {
    const { id, userEmail } = data;
    await Column.findByIdAndDelete(id);

    // Emitir un evento de Socket.IO a todos los usuarios
    io.emit('columnaEliminada', id);

    // Buscar al usuario en la base de datos y guardar la acción
    const user = await User.findOne({ email: userEmail });
    if (user) {
      const nuevaAccion = {
        accion: `Eliminó la columna con ID ${id}`,
        fecha: new Date(),
      };
      user.acciones.push(nuevaAccion);
      await user.save();
    }

    // Enviar respuesta de éxito al cliente
    if (typeof callback === 'function') {
      callback({
        success: true,
        data: id
      });
    }
  } catch (error) {
    console.error(error);
    // Emitir un evento de error al cliente
    socket.emit('error', error.message);
    // Enviar respuesta de error al cliente
    if (typeof callback === 'function') {
      callback({
        success: false,
        error: error.message
      });
    }
  }
};


const moverTarea = async (data, socket, io) => {
  const {
    taskId,
    sourceColumnId,
    destinationColumnId,
    sourceIndex,
    destinationIndex,
    userEmail,
  } = data;

  try {
    // Obtener la tarea que se está moviendo
    const movedTask = await Task.findById(taskId);

    // Obtener las columnas de origen y destino
    const sourceColumn = await Column.findById(sourceColumnId);
    const destinationColumn = await Column.findById(destinationColumnId);

    // Eliminar la tarea de la columna de origen
    sourceColumn.tasks.splice(sourceIndex, 1);

    // Insertar la tarea en la columna de destino en la posición especificada
    destinationColumn.tasks.splice(destinationIndex, 0, movedTask);

    // Guardar las columnas actualizadas
    await sourceColumn.save();
    await destinationColumn.save();

    // Emitir un evento 'tareaMovida' a todos los clientes
    io.emit('tareaMovida', { sourceColumn, destinationColumn });

    // Buscar al usuario en la base de datos y guardar la acción
    const user = await User.findOne({ email: userEmail });
    if (user) {
     const nuevaAccion = {
        accion: `Movió la tarea ${movedTask.name} de la columna ${sourceColumn.name} a la columna ${destinationColumn.name}`,
        fecha: new Date(),
      };
      user.acciones.push(nuevaAccion);
      await user.save();
    }
  } catch (error) {
    console.error('Error al mover la tarea:', error);
    socket.emit('error', 'Error al mover la tarea');
  }
};

const toggleFavorito = async (data, socket) => {
  const { projectId, userEmail } = data;
  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      socket.emit('error', 'Usuario no encontrado');
      return;
    }

    const index = user.proyectosFavoritos.indexOf(projectId);
    if (index === -1) {
      // Si el proyecto no está en la lista de favoritos, lo agregamos
      user.proyectosFavoritos.push(projectId);
    } else {
      // Si el proyecto ya está en la lista de favoritos, lo eliminamos
      user.proyectosFavoritos.splice(index, 1);
    }

    await user.save();

    // Emite el estado actualizado
    socket.emit('estadoFavoritoCambiado', { projectId, isFavorite: index === -1 });
  } catch (error) {
    socket.emit('error', error.message);
  }
};

const obtenerEstadoFavorito = async (data, socket) => {
  const { projectId, userEmail } = data;
  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      socket.emit('error', 'Usuario no encontrado');
      return;
    }

    const isFavorite = user.proyectosFavoritos.includes(projectId);

    // Emite el estado de favorito actual
    socket.emit('estadoFavorito', { projectId, isFavorite });
  } catch (error) {
    socket.emit('error', error.message);
  }
};

const crearTarea = async (data, socket, io, callback) => {
  try {
    const { name, columnId, userEmail } = data;
    const newTask = new Task({ name, columnId });
    await newTask.save();

    // Obtener la columna a la que se añadió la tarea
    const column = await Column.findById(columnId);

    // Actualizar la lista de tareas en la columna
    column.tasks.push(newTask);
    await column.save();

    // Emitir el evento 'tareaCreada' a todos los clientes
    io.emit('tareaCreada', { task: newTask, column });

   
const user = await User.findOne({ email: userEmail });
console.log('userEmail:', userEmail); // Imprime el correo electrónico del usuario
console.log('user:', user); // Imprime el usuario encontrado en la base de datos
if (user) {
  const nuevaAccion = {
    accion: `Creó la tarea ${name}`,
    fecha: new Date(),
  };
  user.acciones.push(nuevaAccion);
  await user.save();
  console.log('acciones después de guardar:', user.acciones); // Imprime las acciones del usuario después de guardar
}

    if (typeof callback === 'function') {
      callback({
        success: true,
        data: newTask
      });
    }
  } catch (error) {
    console.error(error);
    socket.emit('error', error.message);
    if (typeof callback === 'function') {
      callback({
        success: false,
        error: error.message
      });
    }
  }
};


const obtenerAcciones = async (data, socket) => {
  const { userEmail } = data;
  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      socket.emit('error', 'Usuario no encontrado');
      return;
    }
    socket.emit('acciones', user.acciones);
    socket.emit('conteoFechas', user.acciones.reduce((acc, action) => {
      const fecha = new Date(action.fecha).toLocaleDateString();
      acc[fecha] = acc[fecha] ? acc[fecha] + 1 : 1;
      return acc;
    }, {}));
  } catch (error) {
    socket.emit('error', error.message);
  }
};



const obtenerUsuario = async (data, socket) => {
  const { email } = data;
  try {
    const user = await User.findOne({
      email
    });
    if (!user) {
      socket.emit('error', 'Usuario no encontrado');
      return;
    }
    socket.emit('usuario', user);
  } catch (error) {
    socket.emit('error', error.message);
  }
}

const obtenerEstadoPremium = async (email, socket) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      socket.emit('error', 'Usuario no encontrado');
      return;
    }
    socket.emit('estadoPremium', user.premium);
  } catch (error) {
    socket.emit('error', error.message);
  }
};

const buscarUsuarios = async (socket) => {
  try {
    const results = await User.find({}, 'email name'); // Añade 'name' aquí
    socket.emit('searchResults', results);
  } catch (error) {
    console.log('Error buscando usuarios:', error);
    socket.emit('error', error.message);
  }
};

const AgregarUsuario = async (data, socket, io, callback) => {
  try {
    const { projectId, userEmail } = data;
    const project = await Project.findById(projectId);
    if (!project) {
      socket.emit('error', 'Proyecto no encontrado');
      return;
    }
    const user
      = await User.findOne({ email:
        userEmail });
    if (!user) {
      socket.emit('error', 'Usuario no encontrado');
      return;
    }
    project.users.push(user);
    await project.save();
    io.emit('usuarioAgregado', { projectId, user });
    if (typeof callback === 'function') {
      callback({
        success: true,
        data: user
      });
    }
  }
  catch (error) {
    console.error(error);
    socket.emit('error', error.message);
    if (typeof callback === 'function') {
      callback({
        success: false,
        error: error.message
      });
    }
  }
}

const CrearUsuario = async (user) => {
  try {
    // Buscar si el usuario ya existe
    const existingUser = await User.findOne({ email: user.email });

    // Si el usuario no existe, crear uno nuevo
    if (!existingUser) {
      const newUser = new User({
        name: user.name,
        email: user.email,
        uid: user.uid,
      });

      await newUser.save();
    }
  } catch (error) {
    console.error("Error al crear usuario:", error.message);
  }
};


const borrarTarea = async (data, socket, io, callback) => {
  try {
    const { taskId } = data;
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('Tarea no encontrada');
    }

    // Obtener la columna a la que pertenece la tarea
    const column = await Column.findById(task.columnId);

    if (column) {
      // Actualizar la lista de tareas en la columna
      column.tasks = column.tasks.filter(task => task._id !== taskId);
      await column.save();
    } else {
      throw new Error('Columna no encontrada');
    }

    // Borrar la tarea
    await Task.findByIdAndDelete(taskId);

    // Emitir el evento 'tareaBorrada' a todos los clientes
    io.emit('tareaBorrada', { taskId, column });

    if (typeof callback === 'function') {
      callback({
        success: true,
        data: taskId
      });
    }
  } catch (error) {
    console.error(error);
    socket.emit('error', error.message);
    if (typeof callback === 'function') {
      callback({
        success: false,
        error: error.message
      });
    }
  }
};

const asignarUsuarioATarea = async (data, socket, io, callback) => {
  try {
    const { taskId, userEmail } = data;
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('Tarea no encontrada');
    }

    // Buscar el usuario por correo electrónico
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Añadir el usuario a la lista de usuarios asignados
    if (!task.assignedUsers.includes(user._id)) {
      task.assignedUsers.push(user._id);
      await task.save();
    }

    // Emitir el evento 'usuarioAsignadoATarea' a todos los clientes
    io.emit('usuarioAsignadoATarea', { taskId, userId: user._id });

    if (typeof callback === 'function') {
      callback({
        success: true,
        data: taskId
      });
      console.log('Usuario asignado a la tarea:', user);
    }
  } catch (error) {
    console.error(error);
    socket.emit('error', error.message);
    if (typeof callback === 'function') {
      callback({
        success: false,
        error: error.message
      });
    }
  }
};

const enviarMensaje = async (data, socket, io) => {
  const { projectId, message, sender } = data;

  try {
    // Buscar el proyecto
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    // Añadir el mensaje al chat del proyecto
    project.chat.push({ sender, message });
    await project.save();

    // Emitir el evento 'mensajeEnviado' a todos los clientes
    io.emit('mensajeEnviado', { projectId, message: { sender, message } });
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    socket.emit('error', 'Error al enviar mensaje');
  }
};


const obtenerMensajes = async (projectId, socket) => {
  try {
    // Buscar el proyecto
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    // Enviar los mensajes al cliente
    socket.emit('mensajesObtenidos', project.chat);
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    socket.emit('error', 'Error al obtener mensajes');
  }
};


const PagoParaPremium = async (data, socket, io) => {
  const { email } = data;
  try {
    const user = await User
      .findOne
      ({ email });
    if (!user) {
      socket.emit('error', 'Usuario no encontrado');
      return;
    }
    user.premium = true;
    await user.save();
    socket.emit('pagoExitoso', user );
  } catch (error) {
    socket.emit('error', error.message);
  }
};

module.exports = function(io) {
  io.on('connection', (socket) => {
    socket.on('obtenerProyectos', (emailUsuario) => obtenerProyectos(emailUsuario, socket));
    socket.on('crearProyecto', (data) => crearProyecto(data, socket, io));
    socket.on('eliminarProyecto', (id) => eliminarProyecto(id, socket, io));
    socket.on('obtenerProyecto', (id) => obtenerProyecto(id, socket));
    socket.on('obtenerColumnas', (projectId, callback) => obtenerColumnas(projectId, socket, callback));
    socket.on('crearColumna', (data, callback) => crearColumna(data, socket, io, callback));
    socket.on('eliminarColumna', (id, callback) => eliminarColumna(id, socket, io, callback));
    socket.on('crearTarea', (data, callback) => crearTarea(data, socket, io, callback)); 
    socket.on('moverTarea', (data) => moverTarea(data, socket, io));
    socket.on('toggleFavorito', (projectId) => toggleFavorito(projectId, socket));
    socket.on('obtenerEstadoFavorito', (projectId) => obtenerEstadoFavorito(projectId, socket));
    socket.on('obtenerAcciones', (data) => obtenerAcciones(data, socket));
    socket.on('obtenerUsuario', (data) => obtenerUsuario(data, socket));
    socket.on('obtenerEstadoPremium', (email) => obtenerEstadoPremium(email, socket));
    buscarUsuarios(socket);
    socket.on('error', (errorMessage) => {
      console.error('Error from server:', errorMessage);
    });
    socket.on('agregarUsuario', (data, callback) => AgregarUsuario(data, socket, io, callback));
    socket.on('crearUsuario', (data, callback) => CrearUsuario(data, callback));
    socket.on('borrarTarea', (data, callback) => borrarTarea(data, socket, io, callback));
    socket.on('asignarUsuarioATarea', (data, callback) => asignarUsuarioATarea(data, socket, io, callback));
    socket.on('enviarMensaje', (data) => enviarMensaje(data, socket, io));
    socket.on('obtenerMensajes', (projectId) => obtenerMensajes(projectId, socket));
    socket.on('pagoParaPremium', (data) => PagoParaPremium(data, socket, io));
  }
  )
};