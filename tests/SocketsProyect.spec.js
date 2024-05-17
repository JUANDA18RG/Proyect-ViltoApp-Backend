const sinon = require('sinon');
const { obtenerProyectos, crearProyecto, obtenerColumnas, crearColumna , moverTarea, CrearUsuario  } = require('../src/Sockets');
const Project = require('../src/models/project');
const User = require('../src/models/User');
const Column = require('../src/models/Columns');
const Task = require('../src/models/Task');


describe('Sockets', () => {
  afterEach(() => {
    sinon.restore();
  });

  // Tests de los proyectos
  describe('obtenerProyectos', () => {
    it('debería emitir los proyectos del usuario', async () => {
      const mockSocket = { emit: sinon.spy() };
      const mockProjects = [{ id: 1, name: 'Proyecto 1' }];
      sinon.stub(Project, 'find').resolves(mockProjects);

      await obtenerProyectos('test@example.com', mockSocket);

      sinon.assert.calledWith(mockSocket.emit, 'proyectos', mockProjects);
    });
  });

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

  describe('obtenerColumnas', () => {
    it('debería emitir las columnas del proyecto', async () => {
      const mockSocket = { emit: sinon.spy() };
      const mockColumns = [{ id: 1, name: 'Columna 1' }];
      sinon.stub(Column, 'find').returns({ populate: sinon.stub().resolves(mockColumns) });

      await obtenerColumnas('testProjectId', mockSocket);

      sinon.assert.calledWith(mockSocket.emit, 'columnas', mockColumns);
    });
  }, 10000);

  // Tests de las columnas
  describe('crearColumna', () => {
    it('debería emitir la columna creada', async () => {
      const mockData = {
        name: 'Columna de prueba',
        projectId: '65fb70753ecfaaddfd44a9489',
        userEmail: 'test@gmail.com'
      };
      const mockUser = { email: 'test@gmail.com' };
      sinon.stub(User, 'findOne').resolves(mockUser);
      const mockColumn = { save: sinon.stub().resolvesThis() };
      sinon.stub(Column.prototype, 'save').resolves(mockColumn);
      const mockSocket = { emit: sinon.spy() };
      const mockIo = { emit: sinon.spy() };

      await crearColumna(mockData, mockSocket, mockIo);

      sinon.assert.calledWith(mockIo.emit, 'columnaCreada', mockColumn);
    });
  });

  // Tests de las tareas
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


});

