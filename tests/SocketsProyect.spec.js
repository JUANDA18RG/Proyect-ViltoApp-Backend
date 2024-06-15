const sinon = require('sinon');
const { obtenerProyectos, crearProyecto, obtenerColumnas, crearColumna, moverTarea, obtenerAcciones } = require('../src/Sockets');
const Project = require('../src/models/project');
const User = require('../src/models/User');
const Column = require('../src/models/Columns');
const Task = require('../src/models/Task');
const nodemailer = require('nodemailer');

// Mock de OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      createCompletion: jest.fn().mockResolvedValue({ choices: [{ text: 'mocked response' }] })
    };
  });
});

// Mock de nodemailer
jest.mock('nodemailer', () => {
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'mockMessageId' })
    })
  };
});

describe('Sockets', () => {
  afterEach(() => {
    sinon.restore();
  });

  // Tests de obtenerProyectos
  describe('obtenerProyectos', () => {
    it('debería emitir los proyectos del usuario', async () => {
      const mockSocket = { emit: sinon.spy() };
      const mockProjects = [{ id: 1, name: 'Proyecto 1' }];
      sinon.stub(Project, 'find').resolves(mockProjects);

      await obtenerProyectos('test@example.com', mockSocket);

      sinon.assert.calledWith(mockSocket.emit, 'proyectos', mockProjects);
    });
  });

  // Tests de crearProyecto
  describe('crearProyecto', () => {
    it('debería emitir un error si el usuario no es premium y ya tiene 6 proyectos', async () => {
      const mockSocket = { emit: sinon.spy() };
      const mockUser = { email: 'test@example.com', premium: false };
      sinon.stub(User, 'findOne').resolves(mockUser);
      sinon.stub(Project, 'countDocuments').resolves(6);

      await crearProyecto({ userEmail: 'test@example.com' }, mockSocket);

      sinon.assert.calledWith(mockSocket.emit, 'error', 'Has alcanzado el límite de proyectos para usuarios no premium.');
    });
  });

  // Tests de obtenerColumnas
  describe('obtenerColumnas', () => {
    it('debería emitir las columnas del proyecto', async () => {
      const mockSocket = { emit: sinon.spy() };
      const mockColumns = [{ id: 1, name: 'Columna 1' }];
      sinon.stub(Column, 'find').returns({ populate: sinon.stub().resolves(mockColumns) });

      await obtenerColumnas('testProjectId', mockSocket);

      sinon.assert.calledWith(mockSocket.emit, 'columnas', mockColumns);
    });
  });

  // Tests de crearColumna
  describe('crearColumna', () => {
    it('debería emitir la columna creada', async () => {
      const mockData = {
        name: 'Columna de prueba',
        projectId: '65fb70753ecfaaddfd44a9489',
        userEmail: 'test@gmail.com'
      };
      const mockUser = { email: 'test@gmail.com', acciones: [], save: sinon.stub().resolvesThis() };
      sinon.stub(User, 'findOne').resolves(mockUser);
      const mockColumn = { _id: 'mockColumnId', name: 'Columna de prueba', save: sinon.stub().resolvesThis() };
      sinon.stub(Column.prototype, 'save').resolves(mockColumn);
      const mockProject = { _id: mockData.projectId, name: 'Proyecto de prueba', users: [{ email: 'user1@example.com' }, { email: 'user2@example.com' }] };
      sinon.stub(Project, 'findById').resolves(mockProject);
      const mockSocket = { emit: sinon.spy() };
      const mockIo = { emit: sinon.spy() };

      // Mock nodemailer transport
      const mockTransport = nodemailer.createTransport();
      sinon.stub(mockTransport, 'sendMail').resolves({ messageId: 'mockMessageId' });

      await crearColumna(mockData, mockSocket, mockIo);

      sinon.assert.calledWith(mockIo.emit, 'columnaCreada', mockColumn);
      mockProject.users.forEach(user => {
        sinon.assert.calledWith(mockTransport.sendMail, sinon.match({ to: user.email }));
      });
    });

    it('debería manejar errores y emitir un evento de error', async () => {
      const mockData = {
        name: 'Columna_de_prueba',
        projectId : "65fb70753ecfaaddfd44a9489",
        userEmail: 'test@gmail.com'
      };
      const mockSocket = { emit: sinon.spy() };
      const mockIo = { emit: sinon.spy() };

      // Forzar un error en el guardado de la columna
      sinon.stub(Column.prototype, 'save').rejects(new Error('Save error'));


      await crearColumna(mockData, mockSocket, mockIo);

      sinon.assert.calledWith(mockSocket.emit, 'error', 'Save error');
    });
  });

  // Tests de moverTarea
  describe('moverTarea', () => {
    it('debería mover la tarea y emitir un evento', async () => {
      const mockData = {
        taskId: '60d6c7e3207ad63b3c8bec2a',
        sourceColumnId: '60d6c7e3207ad63b3c8bec2b',
        destinationColumnId: '60d6c7e3207ad63b3c8bec2c',
        sourceIndex: 0,
        destinationIndex: 1,
        userEmail: 'test@gmail.com',
        projectId: '60d6c7e3207ad63b3c8bec2d'
      };
      const mockTask = { _id: mockData.taskId, name: 'Tarea de prueba' };
      const mockSourceColumn = { _id: mockData.sourceColumnId, name: 'Columna de origen', tasks: [mockTask], save: sinon.stub().resolvesThis() };
      const mockDestinationColumn = { _id: mockData.destinationColumnId, name: 'Columna de destino', tasks: [], save: sinon.stub().resolvesThis() };
      const mockUser = { email: mockData.userEmail, acciones: [], save: sinon.stub().resolvesThis() };
      const mockProject = { _id: mockData.projectId, users: [mockUser] };

      // Asegúrate de que el array 'tasks' está definido
      if (!mockDestinationColumn.tasks) {
        mockDestinationColumn.tasks = [];
      }

      sinon.stub(Task, 'findById').resolves(mockTask);
      sinon.stub(Column, 'findById').onFirstCall().resolves(mockSourceColumn).onSecondCall().resolves(mockDestinationColumn);
      sinon.stub(User, 'findOne').resolves(mockUser);
      sinon.stub(Project, 'findById').resolves(mockProject);
      const mockSocket = { emit: sinon.spy() };
      const mockIo = { emit: sinon.spy() };

      await moverTarea(mockData, mockSocket, mockIo);

      sinon.assert.calledWith(mockIo.emit, 'tareaMovida', { sourceColumn: mockSourceColumn, destinationColumn: mockDestinationColumn });
      sinon.assert.neverCalledWith(mockSocket.emit, 'error', 'Error al mover la tarea');
    });
  });

  // Tests de obtenerAcciones
  describe('obtenerAcciones', () => {
    it('debería emitir las acciones del usuario', async () => {
      const mockSocket = { emit: sinon.spy() };
      const mockUser = { email: 'test@example.com', acciones: [{ accion: 'Acción de prueba', fecha: new Date() }] };
      sinon.stub(User, 'findOne').resolves(mockUser);

      await obtenerAcciones('test@example.com', mockSocket);

      sinon.assert.calledWith(mockSocket.emit, 'acciones', mockUser.acciones);
    });
  });
});
