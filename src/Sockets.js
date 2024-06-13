const Project = require('./models/project');
const Column = require('./models/Columns');
const Task = require('./models/Task');
const User = require('./models/User');
const nodemailer = require('nodemailer');
const IA = require('./IA');
const generarProyectoConIA = require('./IAProyects');


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

    // Crear un transportador de correo con la configuración de tu proveedor de correo
    let transporter = nodemailer.createTransport({
      service: 'gmail', // reemplaza con tu proveedor de correo
      host: 'smtp.gmail.com', // reemplaza con el host de tu proveedor de correo
      port: 465, // reemplaza con el puerto de tu proveedor de correo
      secure: true, // reemplaza con true si tu proveedor de correo usa SSL
      auth: {
        user: 'viltoapp@gmail.com', // reemplaza con tu correo
        pass: 'aixbacnyzcdwcdzq' // reemplaza con tu contraseña
      }
    });

    // Buscar el proyecto y obtener la lista de usuarios
    const project = await Project.findById(projectId);

    // Enviar un correo a cada usuario del proyecto
    project.users.forEach(async user => {
      let info = await transporter.sendMail({
        from: '"ViltoApp " <viltoapp@gmail.com>', // reemplaza con tu correo y el nombre de tu aplicación
        to: user.email, // correo del usuario
        subject: `Movimiento en el Proyecto ${project.name} `, 
        text: `Hola querido usuario ${userEmail} te informamos que se ha creado la columna ${name} en el proyecto ${project.name}.`, // cuerpo del correo
      });
      console.log('Mensaje enviado: %s', info.messageId);
    });

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

const obtenerRespuestaIA = async (data, socket) => {
  const {metodo, task, column, projectName, projectDescription } = data;
  try {
    console.log('Llamando a la función IA con:', data);
    const iaResponse = await IA(data.metodo, data.task, data.column, data.projectName, data.projectDescription);
    socket.emit('respuestaIA', iaResponse);
  } catch (error) {
    console.error('Error al obtener respuesta de la IA:', error);
    socket.emit('error', error.message);
  }
};


const eliminarColumna = async (data, socket, io, callback) => {
  try {
    const { id, userEmail ,projectId } = data;
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

    let transporter = nodemailer.createTransport({
      service: 'gmail', // reemplaza con tu proveedor de correo
      host: 'smtp.gmail.com', // reemplaza con el host de tu proveedor de correo
      port: 465, // reemplaza con el puerto de tu proveedor de correo
      secure: true, // reemplaza con true si tu proveedor de correo usa SSL
      auth: {
        user: 'viltoapp@gmail.com', // reemplaza con tu correo
        pass: 'aixbacnyzcdwcdzq' // reemplaza con tu contraseña
      }
    });

    // Buscar el proyecto y obtener la lista de usuarios
    const project = await Project.findById(projectId);

    // Enviar un correo a cada usuario del proyecto
    project.users.forEach(async user => {
      let info = await transporter.sendMail({
        from: '"ViltoApp " <viltoapp@gmail.com>', // reemplaza con tu correo y el nombre de tu aplicación
        to: user.email, // correo del usuario
        subject: `Movimiento en el Proyecto ${project.name} `, 
        text: `Hola  querido usuario ${userEmail} te informamos que se ha eliminado una columna en el proyecto ${project.name}.`, // cuerpo del correo
      });
      console.log('Mensaje enviado: %s', info.messageId);
    });

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
    projectId
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

    let transporter = nodemailer.createTransport({
      service: 'gmail', // reemplaza con tu proveedor de correo
      host: 'smtp.gmail.com', // reemplaza con el host de tu proveedor de correo
      port: 465, // reemplaza con el puerto de tu proveedor de correo
      secure: true, // reemplaza con true si tu proveedor de correo usa SSL
      auth: {
        user: 'viltoapp@gmail.com', // reemplaza con tu correo
        pass: 'aixbacnyzcdwcdzq' // reemplaza con tu contraseña
      }
    });

    // Buscar el proyecto y obtener la lista de usuarios
    const project = await Project.findById(projectId);

    // Enviar un correo a cada usuario del proyecto
    project.users.forEach(async user => {
      let info = await transporter.sendMail({
        from: '"ViltoApp " <viltoapp@gmail.com>', // reemplaza con tu correo y el nombre de tu aplicación
        to: user.email, // correo del usuario
        subject: `Movimiento en el Proyecto ${project.name} `, 
        text: `Hola querido usuario ${userEmail} han hecho cambios en el proyecto de mover una tarea de columna.`, 

      });
      console.log('Mensaje enviado: %s', info.messageId);
    });

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
    const { name, columnId, userEmail ,projectId } = data;
    const newTask = new Task({ name, columnId });
    await newTask.save();

    // Obtener la columna a la que se añadió la tarea
    const column = await Column.findById(columnId);

    // Actualizar la lista de tareas en la columna
    column.tasks.push(newTask);
    await column.save();

    // Emitir el evento 'tareaCreada' a todos los clientes
    io.emit('tareaCreada', { task: newTask, column });
    
    let transporter = nodemailer.createTransport({
      service: 'gmail', // reemplaza con tu proveedor de correo
      host: 'smtp.gmail.com', // reemplaza con el host de tu proveedor de correo
      port: 465, // reemplaza con el puerto de tu proveedor de correo
      secure: true, // reemplaza con true si tu proveedor de correo usa SSL
      auth: {
        user: 'viltoapp@gmail.com', // reemplaza con tu correo
        pass: 'aixbacnyzcdwcdzq' // reemplaza con tu contraseña
      }
    });

    // Buscar el proyecto y obtener la lista de usuarios
    const project = await Project.findById(projectId);

    // Enviar un correo a cada usuario del proyecto
    project.users.forEach(async user => {
      let info = await transporter.sendMail({
        from: '"ViltoApp " <viltoapp@gmail.com>', // reemplaza con tu correo y el nombre de tu aplicación
        to: user.email, // correo del usuario
        subject: `Movimiento en el Proyecto ${project.name} `, 
        text: `Hola querido usuario ${userEmail} se acaba de crear una tarea en el proyecto ${project.name}.`, 
        
      });
      console.log('Mensaje enviado: %s', info.messageId);
    });

   
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
    const results = await User.find({}, 'email name').maxTimeMS(50000);
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
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      socket.emit('error', 'Usuario no encontrado');
      return;
    }
    project.users.push(user);
    await project.save();
    io.emit('usuarioAgregado', { projectId, user });
    
    // Configuración del transporte de correo
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'viltoapp@gmail.com',
        pass: 'aixbacnyzcdwcdzq'
      }
    });

    // Enviar un correo a cada usuario del proyecto
    for (let i = 0; i < project.users.length; i++) {
      let user = project.users[i];
      let info = await transporter.sendMail({
        from: '"ViltoApp" <viltoapp@gmail.com>',
        to: user.email,
        subject: `Nuevo usuario en el proyecto ${project.name}`,
        text: `Hola, se acaba de agregar un nuevo usuario al proyecto ${project.name}. El correo electrónico del nuevo usuario es ${userEmail}.`,
      });
      console.log('Mensaje enviado: %s', info.messageId);
    }

    if (typeof callback === 'function') {
      callback({
        success: true,
        data: user
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


const eliminarTarea = async (data, socket, io, callback) => {
  try {
    const { taskId, columnId, userEmail, projectId } = data;

    // Obtener la columna que contiene la tarea
    const column = await Column.findById(columnId);
    if (!column) {
      socket.emit('error', 'Columna no encontrada');
      return;
    }

    // Eliminar la tarea de la columna
    const taskIndex = column.tasks.findIndex(task => task.equals(taskId));
    if (taskIndex === -1) {
      socket.emit('error', 'Tarea no encontrada en la columna');
      return;
    }
    column.tasks.splice(taskIndex, 1);
    await column.save();

    // Eliminar la tarea de la base de datos
    await Task.findByIdAndDelete(taskId);

    // Emitir un evento de Socket.IO para notificar a los clientes sobre la eliminación de la tarea
    io.emit('tareaEliminada', { taskId, columnId });

    // Buscar al usuario en la base de datos y guardar la acción
    const user = await User.findOne({ email: userEmail });
    if (user) {
      const nuevaAccion = {
        accion: `Eliminó la tarea con ID ${taskId} de la columna ${columnId}`,
        fecha: new Date(),
      };
      user.acciones.push(nuevaAccion);
      await user.save();
    }

    // Enviar correos electrónicos a los usuarios del proyecto
    let transporter = nodemailer.createTransport({
      service: 'gmail', // reemplaza con tu proveedor de correo
      host: 'smtp.gmail.com', // reemplaza con el host de tu proveedor de correo
      port: 465, // reemplaza con el puerto de tu proveedor de correo
      secure: true, // reemplaza con true si tu proveedor de correo usa SSL
      auth: {
        user: 'viltoapp@gmail.com', // reemplaza con tu correo
        pass: 'aixbacnyzcdwcdzq' // reemplaza con tu contraseña
      }
    });

    // Buscar el proyecto y obtener la lista de usuarios
    const project = await Project.findById(projectId);

    // Enviar un correo a cada usuario del proyecto
    project.users.forEach(async user => {
      let info = await transporter.sendMail({
        from: '"ViltoApp " <viltoapp@gmail.com>', // reemplaza con tu correo y el nombre de tu aplicación
        to: user.email, // correo del usuario
        subject: `Movimiento en el Proyecto ${project.name}`, 
        text: `Hola querido usuario ${userEmail}, te informamos que se ha eliminado una tarea en el proyecto ${project.name}.`, // cuerpo del correo
      });
      console.log('Mensaje enviado: %s', info.messageId);
    });

    // Enviar respuesta de éxito al cliente
    if (typeof callback === 'function') {
      callback({
        success: true,
        data: { taskId, columnId }
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


const EditarProyecto = async (data, socket, io, callback) => {
  try {
    const { projectId, name, description, userEmail } = data;

    // Buscar el proyecto en la base de datos
    const project = await Project.findById(projectId);
    if (!project) {
      socket.emit('error', 'Proyecto no encontrado');
      return;
    }

    // Actualizar el nombre y/o la descripción del proyecto si se proporcionan
    if (name !== undefined) {
      project.name = name;
    }
    if (description !== undefined) {
      project.description = description;
    }

    await project.save();
    console.log('Proyecto guardado:', project);

    // Emitir un evento de Socket.IO para notificar a los clientes sobre la actualización del proyecto
    io.emit('proyectoEditado', project);

    // Buscar al usuario en la base de datos y guardar la acción
    const user = await User.findOne({ email: userEmail });
    if (user) {
      const nuevaAccion = {
        accion: `Editó el proyecto ${name ? name : project.name}`,
        fecha: new Date(),
      };
      user.acciones.push(nuevaAccion);
      await user.save();
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
const ingresarLink = async (data, socket, io, callback) => {
  try {
    const { projectId, link } = data;
    
    const project = await Project.findById(projectId);

    if (!project) {
      if (callback) callback({ error: 'Proyecto no encontrado.' });
      return;
    }

    const newLink = { url: link };
    project.Links.push(newLink);
    await project.save();

    // Emitir el enlace con el ID correcto
    io.to(projectId).emit('linkIngresado', project.Links[project.Links.length - 1]);

    if (callback) callback(null, newLink); 
  } catch (error) {
    console.error(error);
    if (callback) callback({ error: 'Hubo un error al ingresar el link.' });
  }
};


const obtenerLinks = async (data, socket) => {
  try {
    const { projectId } = data;
    const project = await Project.findById(projectId);

    if (!project) {
      socket.emit('error', 'Proyecto no encontrado');
      return;
    }

    socket.emit('links', project.Links);
  } catch (error) {
    console.error(error);
    socket.emit('error', 'Hubo un error al obtener los links.');
  }
};

const eliminarLink = async (data, socket, io, callback) => {
  try {
    const { projectId, linkId } = data;
    const project = await Project.findById(projectId);

    if (!project) {
      socket.emit('error', 'Proyecto no encontrado');
      if (callback) callback({ error: 'Proyecto no encontrado.' });
      return;
    }

    // Verificar que el ID del enlace se maneja correctamente
    const linkIndex = project.Links.findIndex(link => link._id.equals(linkId));
    if (linkIndex === -1) {
      console.error('Link no encontrado:', linkId); // Log para depuración
      socket.emit('error', 'Link no encontrado en el proyecto');
      if (callback) callback({ error: 'Link no encontrado en el proyecto.' });
      return;
    }

    project.Links.splice(linkIndex, 1);
    await project.save();

    io.to(projectId).emit('linkEliminado', linkId);

    if (callback) callback(null, linkId);
  } catch (error) {
    console.error(error);
    if (callback) callback({ error: 'Hubo un error al eliminar el link.' });
  }
};


const obtenerUsuarios = async (socket) => {
  try {
    const users = await User.find({}, 'email name');
    socket.emit('usuarios', users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    socket.emit('error', error.message);
  }
};


const crearProyectoConIA = async (data, socket, io) => {
  try {
    const { description, userEmail } = data;
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      socket.emit('error', 'La descripción del proyecto no puede estar vacía y debe ser una cadena de texto válida.');
      return;
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      socket.emit('error', 'Usuario no encontrado');
      return;
    }

    if (!user.premium) {
      const userProjectsCount = await Project.countDocuments({ 'users.email': userEmail });
      if (userProjectsCount >= 6) {
        socket.emit('error', 'Has alcanzado el límite de proyectos para usuarios no premium.');
        return;
      }
    }

    // Generar título, descripción corta y columnas del proyecto con IA
    const projectDetails = await generarProyectoConIA(description);

    // Crear el nuevo proyecto con el título y la descripción corta
    const newProject = new Project({
      name: projectDetails.titulo,
      description: projectDetails.descripcion,
      users: [user],
    });

    const project = await newProject.save();

    // Crear y guardar columnas
    const columnas = projectDetails.columnas.map(columna => ({
      name: columna,
      projectId: project._id,
    }));

    await Column.insertMany(columnas);

    // Emitir evento de Socket.IO para notificar la creación del proyecto
    io.emit('proyectoCreadoConIA', JSON.stringify(project));

    // Registrar la acción del usuario
    const nuevaAccion = {
      accion: `Creó el proyecto "${projectDetails.titulo}"`,
      fecha: new Date(),
    };
    user.acciones.push(nuevaAccion);
    await user.save();

    // Enviar notificación por correo electrónico a los usuarios del proyecto
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'viltoapp@gmail.com', 
        pass: 'aixbacnyzcdwcdzq' 
      }
    });

    for (const email of project.users.map(u => u.email)) {
      let info = await transporter.sendMail({
        from: '"ViltoApp" <viltoapp@gmail.com>',
        to: email,
        subject: `Nuevo proyecto creado: ${projectDetails.titulo}`,
        text: `Hola, se ha creado un nuevo proyecto titulado "${projectDetails.titulo}" con Inteligencia artificial.`,
      });
      console.log('Mensaje enviado: %s', info.messageId);
    }

  } catch (error) {
    console.error('Error al crear el proyecto:', error);
    socket.emit('error', 'Hubo un problema al crear el proyecto. Inténtalo de nuevo más tarde.');
  }
};


// Configuración del servidor de Socket.IO
module.exports = function(io) {
  io.on('connection', (socket) => {
    // Unirse a la sala del proyecto
    socket.on('joinProject', (projectId) => {
      socket.join(projectId);
    });

    // Manejo de eventos relacionados con los proyectos
    socket.on('obtenerProyectos', (emailUsuario) => obtenerProyectos(emailUsuario, socket));
    socket.on('crearProyecto', (data) => crearProyecto(data, socket, io));
    socket.on('eliminarProyecto', (id) => eliminarProyecto(id, socket, io));
    socket.on('obtenerProyecto', (id) => obtenerProyecto(id, socket));
    socket.on('editarProyecto', (data) => EditarProyecto(data, socket, io));
    
    // Manejo de eventos relacionados con columnas y tareas
    socket.on('obtenerColumnas', (projectId, callback) => obtenerColumnas(projectId, socket, callback));
    socket.on('crearColumna', (data, callback) => crearColumna(data, socket, io, callback));
    socket.on('eliminarColumna', (id, callback) => eliminarColumna(id, socket, io, callback));
    socket.on('crearTarea', (data, callback) => crearTarea(data, socket, io, callback));
    socket.on('moverTarea', (data) => moverTarea(data, socket, io));
    socket.on('eliminarTarea', (data, callback) => eliminarTarea(data, socket, io, callback));
    socket.on('asignarUsuarioATarea', (data, callback) => asignarUsuarioATarea(data, socket, io, callback));

    // Manejo de eventos relacionados con favoritos
    socket.on('toggleFavorito', (projectId) => toggleFavorito(projectId, socket));
    socket.on('obtenerEstadoFavorito', (projectId) => obtenerEstadoFavorito(projectId, socket));

    // Manejo de eventos relacionados con usuarios
    socket.on('buscarUsuarios', () => buscarUsuarios(socket));
    socket.on('agregarUsuario', (data, callback) => AgregarUsuario(data, socket, io, callback));
    socket.on('crearUsuario', (data, callback) => CrearUsuario(data, callback));
    socket.on('obtenerUsuarios', () => obtenerUsuarios(socket));
    buscarUsuarios(socket);

    // Manejo de eventos relacionados con pagos y estado premium
    socket.on('pagoParaPremium', (data) => PagoParaPremium(data, socket, io));
    socket.on('obtenerEstadoPremium', (email) => obtenerEstadoPremium(email, socket));

    // Manejo de eventos relacionados con mensajes y chat
    socket.on('enviarMensaje', (data) => enviarMensaje(data, socket, io));
    socket.on('obtenerMensajes', (projectId) => obtenerMensajes(projectId, socket));

    // Manejo de eventos relacionados con acciones
    socket.on('obtenerAcciones', (data) => obtenerAcciones(data, socket));

    // Manejo de eventos relacionados con la IA
    socket.on('obtenerRespuestaIA', (data) => obtenerRespuestaIA(data, socket));
    socket.on('crearProyectoConIA', (data) => crearProyectoConIA(data, socket, io));

    //Hacer Links
    socket.on('ingresarLink', (data, callback) => ingresarLink(data, socket, io, callback));
    socket.on('obtenerLinks', (data) => obtenerLinks(data, socket));
    socket.on('eliminarLink', (data, callback) => eliminarLink(data, socket, io, callback));

    
    // Manejo de errores
    socket.on('error', (errorMessage) => {
      console.error('Error from client:', errorMessage);
    });

    socket.on('disconnect', () => {
 //se desconecta
    });
  });
};

// Exportar las funciones adicionales si es necesario
module.exports.obtenerProyectos = obtenerProyectos;
module.exports.crearProyecto = crearProyecto;
module.exports.eliminarProyecto = eliminarProyecto;
module.exports.obtenerProyecto = obtenerProyecto;
module.exports.obtenerColumnas = obtenerColumnas;
module.exports.crearColumna = crearColumna;
module.exports.eliminarColumna = eliminarColumna;
module.exports.crearTarea = crearTarea;
module.exports.moverTarea = moverTarea;
module.exports.toggleFavorito = toggleFavorito;
module.exports.obtenerEstadoFavorito = obtenerEstadoFavorito;
module.exports.obtenerAcciones = obtenerAcciones;
module.exports.obtenerEstadoPremium = obtenerEstadoPremium;
module.exports.buscarUsuarios = buscarUsuarios;
module.exports.AgregarUsuario = AgregarUsuario;
module.exports.CrearUsuario = CrearUsuario;
module.exports.eliminarTarea = eliminarTarea;
module.exports.enviarMensaje = enviarMensaje;
module.exports.obtenerMensajes = obtenerMensajes;
module.exports.PagoParaPremium = PagoParaPremium;
module.exports.EditarProyecto = EditarProyecto;