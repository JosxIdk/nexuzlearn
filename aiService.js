const { OpenAI } = require('openai');



const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, 
});

async function getAIProfileAdaptation(user, selectedTopics) {
    const prompt = `
        El usuario ${user.name} ha seleccionado los siguientes temas para reforzar: ${selectedTopics.join(", ")}.
        Encargate de darle una buena bienvenida acogedora, algo motivacional y que lo incentive a aprender
    `;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', 
            messages: [
                {
                    role: "assistant", content: prompt
                }
            ],
            max_tokens: 150,  
            temperature: 0.7, 
        });

        return response.choices[0].message;
    } catch (error) {
        console.error('Error al generar recomendaciones personalizadas:', error);
        throw new Error('Error generating AI recommendations');
    }
}

async function generateQuestions(topic){
    const prompt = `Genera una pregunta sobre ${topic} sin frases introductorias. Haz que las preguntas sean variadas y no se repitan. Asegurate que las preguntas no sean las mismas y tampoco se repitan, solo genera una pregunta, no varias en una sola.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', 
            messages: [
                {
                    role: "assistant", content: prompt
                }
            ],
            max_tokens: 100,
            n: 1, 
            temperature: 0.7, 
        });
        console.log(response)

        return response.choices[0].message;
    } catch (error) {
        console.error('Error al generar preguntas:', error);
        throw new Error('Error generating AI recommendations');
    }
}

async function checkPlagiarismWithAI(text) {
    const prompt = `El siguiente texto es un contenido ingresado por un usuario: "${text}". ¿Hay similitudes con textos existentes? Responde "Sí" o "No".`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', 
        messages: [
            {
                role: "assistant", content: prompt
            }
        ],
        max_tokens: 50,  
        temperature: 0.5, 
    });

    return response.choices[0].message;
}

async function checkForAIGeneratedContent(text) {
    const prompt = `Determina si el siguiente texto fue generado por una IA: "${text}". Responde "Sí" o "No".`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', 
        messages: [
            {
                role: "assistant", content: prompt
            }
        ],
        max_tokens: 10,  
        temperature: 0.7, 
    });

    return response.choices[0].message;
}

async function validateAnswer(question, answer) {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { 
                role: "system", 
                content: `Eres un maestro experto en todas las áreas de conocimiento. Evalúa respuestas de los estudiantes con precisión y, si la respuesta es incorrecta, proporciona la respuesta correcta. En caso de preguntas de matemáticas, consulta en internet para garantizar exactitud.` 
            },
            { 
                role: "user", 
                content: `Pregunta: ${question}\nRespuesta del usuario: ${answer}\nPor favor, determina si la respuesta es correcta o incorrecta. Responde con "Sí." o "No.",y si es incorrecta, incluye la respuesta correcta.` 
            }
        ],
        max_tokens: 100, // Aumentado para incluir la explicación y la respuesta correcta
        temperature: 0.7,
    });

    return response.choices[0].message;
}


module.exports = {
    getAIProfileAdaptation,
    generateQuestions,
    checkPlagiarismWithAI,
    checkForAIGeneratedContent,
    validateAnswer
};
