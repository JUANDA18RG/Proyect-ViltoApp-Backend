const OpenAI = require('openai');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

async function generarProyectoConIA(projectDescription) {
  if (!projectDescription || typeof projectDescription !== 'string' || projectDescription.trim().length === 0) {
    throw new Error('La descripción del proyecto no puede estar vacía y debe ser una cadena de texto válida.');
  }

  const messages = [
    {
      role: "system",
      content: "Eres un asistente profesional. Tu rol es crear proyectos de manera efectiva basándote en descripciones proporcionadas por el usuario. Genera un título adecuado y una descripción corta (aproximadamente 10 palabras) para el proyecto, asegurándote de que sean claros y precisos, incluso si la descripción proporcionada es muy breve. Además, sugiere algunas columnas claves para gestionar el proyecto."
    },
    {
      role: "user",
      content: `Tengo un nuevo proyecto que se describe de la siguiente manera: ${projectDescription}. ¿Podrías generar un título adecuado para este proyecto, una descripción corta y precisa de aproximadamente 10 palabras y sugerir algunas columnas claves para gestionar el proyecto? Por favor, responde en el siguiente formato:\nTítulo: [tu título]\nDescripción: [tu descripción]\nColumnas: [columna1, columna2, columna3, ...]`
    }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content.trim();

    // Procesar la respuesta para extraer título, descripción y columnas correctamente
    const titleMatch = response.match(/Título:\s*(.*)/i);
    const descriptionMatch = response.match(/Descripción:\s*(.*)/i);
    const columnsMatch = response.match(/Columnas:\s*(.*)/i); // Asumiendo que las columnas se devuelven en una lista separada por comas

    let titulo = titleMatch ? titleMatch[1].trim() : '';
    let descripcion = descriptionMatch ? descriptionMatch[1].trim() : '';
    let columnas = columnsMatch ? columnsMatch[1].trim().split(',').map(column => column.trim()) : []; // Convertir la cadena de columnas en un array

    // Generar títulos y descripciones predeterminados si faltan
    if (!titulo || titulo.toLowerCase() === 'título no encontrado') {
      titulo = `Proyecto: ${projectDescription.substring(0, 20)}...`;
    }

    if (!descripcion || descripcion.toLowerCase() === 'descripción no encontrada') {
      descripcion = projectDescription.length > 10 ? projectDescription.substring(0, 10) + '...' : projectDescription;
    }

    return { titulo, descripcion, columnas };
  } catch (error) {
    console.error('Error al generar el proyecto con IA:', error);
    throw new Error('Hubo un problema al generar el proyecto con IA. Inténtalo de nuevo más tarde.');
  }
}

module.exports = generarProyectoConIA;
