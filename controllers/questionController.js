// controllers/questionController.js
const { generateQuestions, validateAnswer, checkPlagiarismWithAI, checkForAIGeneratedContent } = require('../services/aiService');
const User = require('../models/User');

exports.generateQuestions = async (req, res) => {
    try {
        const questions = await generateQuestions(req.params.topic);
        res.status(200).json({ topic: req.params.topic, question: questions.content });
    } catch (error) {
        console.error('Error generando preguntas:', error);
        res.status(500).send('Error generando preguntas');
    }
};

exports.validateQuestionAnswer = async (req, res) => {
    const { question, answer } = req.body;
    try {
        const isCorrect = (await validateAnswer(question, answer)).content.includes("Sí.");
        res.json({ isCorrect });
    } catch (err) {
        console.error('Error al verificar plagio:', err);
        res.status(500).json({ error: 'Error al verificar plagio' });
    }
};

exports.checkPlagiarism = async (req, res) => {
    try {
        const plagiarismResult = await checkPlagiarismWithAI(req.body.answer);
        const aiDetectionResult = await checkForAIGeneratedContent(req.body.answer);
        res.json({ isValid: plagiarismResult.content !== "Sí." && aiDetectionResult.content !== "Sí." });
    } catch (error) {
        console.error('Error al verificar plagio:', error);
        res.status(500).json({ error: 'Error al verificar plagio' });
    }
};
