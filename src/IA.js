const OpenAI = require('openai');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

async function IA(metodo, task, column, projectName, projectDescription) {
  const messages = [
    {"role": "system", "content": "Eres un asistente profesional. Tu rol es proporcionar sugerencias y consejos útiles en español. Proporciona las recomendaciones en formato de párrafo, sin enumerar los puntos. Asegúrate de que las recomendaciones sean detalladas, específicas, prácticas y completas para ayudar al usuario a abordar su pregunta o problema."}
  ];

  // Mensajes específicos basados en el método
  switch (metodo) {
    case 'columnaCreada':
      messages.push({"role": "user", "content": `Estoy en el proceso de añadir una nueva columna llamada ${column} a nuestro tablero de proyecto en la aplicación. ¿Podrías proporcionar algunas sugerencias detalladas sobre cómo podríamos utilizar esta columna de manera efectiva en nuestro proyecto, incluyendo ejemplos específicos de tareas que podrían ir en esta columna y estrategias para gestionar el flujo de trabajo en esta etapa del proyecto? Presenta tus sugerencias en un solo párrafo largo.`});
      if (column.toLowerCase().includes('ideas') || column.toLowerCase().includes('ejemplos')) {
        messages.push({"role": "user", "content": `Esta columna está destinada a ser un lugar para ideas de manejo y ejemplos. ¿Podrías proporcionar algunas estrategias específicas sobre cómo podríamos utilizar y gestionar esta columna de manera efectiva, incluyendo ejemplos de tipos de ideas o ejemplos que podrían ser útiles para el proyecto? Presenta tus sugerencias en un solo párrafo largo.`});
      }
      break;
    case 'tareaCreada':
      messages.push({"role": "user", "content": `Estoy en el proceso de crear una nueva tarea llamada ${task} en la columna ${column} de nuestra aplicación. ¿Podrías proporcionar recomendaciones detalladas sobre cómo podríamos abordar esta tarea de manera efectiva, incluyendo pasos específicos que debemos seguir, posibles desafíos y cómo superarlos, y cómo esta tarea se integra con otras en la columna ${column}? Presenta tus sugerencias en un solo párrafo largo.`});
      break;
    case 'proyectoIniciado':
      if (projectName && projectDescription) {
        messages.push({"role": "user", "content": `El proyecto en el que estoy trabajando se llama ${projectName}. El objetivo de este proyecto es ${projectDescription}. ¿Podrías proporcionar algunas estrategias o enfoques que podríamos considerar para llevar a cabo este proyecto de manera efectiva, incluyendo cómo planificar las etapas del proyecto, asignar recursos, y monitorizar el progreso? Presenta tus sugerencias en un solo párrafo largo.`});
      }
      break;
    default:
      messages.push({"role": "user", "content": `Estoy trabajando en una aplicación de organización colaborativa de proyectos. Esta aplicación permite a los usuarios crear y gestionar tareas, que se organizan en columnas para representar diferentes etapas o categorías del flujo de trabajo del proyecto en un tablero de proyecto. ¿Podrías proporcionar recomendaciones detalladas sobre ${metodo} para ayudar a los usuarios a utilizar la aplicación de manera efectiva? Presenta tus sugerencias en un solo párrafo largo.`});
      break;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    max_tokens: 500, // Incrementamos los tokens para obtener una respuesta más larga si es necesario
  });

  let response = completion.choices[0].message.content;

  // Asegurarse de que la respuesta no se corta a mitad de una frase y tiene al menos 200 caracteres
  const minLength = 300;
  while (response.length < minLength) {
    const additionalCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 500, // Más tokens para asegurar suficiente contenido
    });

    response += additionalCompletion.choices[0].message.content;
  }

  const maxLength = 500;
  if (response.length > maxLength) {
    const trimmedResponse = response.slice(0, maxLength);
    const lastSentenceEnd = trimmedResponse.lastIndexOf('.');

    if (lastSentenceEnd !== -1) {
      response = trimmedResponse.slice(0, lastSentenceEnd + 1);
    } else {
      response = trimmedResponse;
    }
  }

  return response;
}

module.exports = IA;
