const express = require(`express`)
const router = express.Router()
const path = require('node:path')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { getAIProfileAdaptation, generateQuestions, checkForAIGeneratedContent, checkPlagiarismWithAI, validateAnswer } = require('../aiService');
const User = require('../models/User');
const Question = require('../models/questionSchema')
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs')
require('dotenv').config()




router.get('/', async (req, res, next) => {
    try {

        console.log(req.isAuthenticated())

        if(req.user && !req.cookies.user){
            res.cookie("user",{
              user:req.user,
            },{maxAge:2.628e+9})
          }

        res.render('index', {
            user: req.user,
            t: req.t,
        });
    } catch (error) {
        next(error);
    }
});

router.get('/register', async (req, res, next) => {
    try {
        res.render('register', {
            user: req.cookies.user || req.user
        }
        );
    } catch (error) {
        next(error);
    }
});

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }

        // Crear un nuevo usuario
        user = new User({ name, email, password, uniqueId: uuidv4() });
        await user.save();

        res.redirect('/login');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
}
);

router.get('/login', async (req, res, next) => {
    try {
        res.render('login', {
            user: req.cookies.user || req.user
        });
    } catch (error) {
        next(error);
    }
});

router.post('/login', (req, res, next) => {
    console.log('Inicio de sesión intentando con:', req.body);
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error('Error de autenticación:', err);
            return next(err); // Si hay un error, pasa al siguiente middleware
        }
        if (!user) {
            console.log('Fallo de autenticación:', info.message);
            return res.status(400).json({ msg: info.message });
        }


        req.logIn(user, (err) => {
            if (err) {
                console.error('Error al iniciar sesión:', err);
                return next(err);
            }
            console.log('Inicio de sesión exitoso:', user.email);
            return res.redirect('/select-topics');
        });
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error al destruir la sesión:', err);
            return res.status(500).send('Error del servidor al cerrar sesión');
        }

        // Redirigir al usuario a la página de inicio o a la página de login
        res.redirect('/login');
    });
});

router.get('/select-topics', async (req, res, next) => {
    try {
        const user = await User.findOne({ name: req.user.name });

        if (!user) {
            return res.redirect('/login')
        }

        if (user.topics && user.topics.length > 0) {
            return res.redirect('/dashboard');
        }

        res.render('topics', {
            user: req.isAuthenticated() ? req.user : null,
        })
    } catch (error) {
        next(error)
    }
});

router.post('/select-topics', async (req, res) => {
    try {
        const selectedTopics = req.body.topics;

        console.log('Selected Topics:', selectedTopics);
        console.log('User:', req.user);


        const user = await User.findOne({ name: req.user.name });
        user.topics = selectedTopics;

        const aiResponse = await getAIProfileAdaptation(user, selectedTopics);
        user.aiRecommendations = aiResponse.content;

        await user.save();

        res.redirect('/dashboard')
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

router.get('/dashboard', async (req, res) => {
    try {
        const user = await User.findOne({ name: req.user.name });

        if (!user) {
            return res.redirect('/login');
        }

        const selectedTopics = user.topics || [];
        const userModules = user.modules || [];

        // Mapeo para combinar temas y módulos
        const topicsWithModules = selectedTopics.map(topic => {
            const moduleInfo = userModules.find(module => module.moduleName === topic);
            return {
                name: topic,
                totalQuestions: moduleInfo ? moduleInfo.totalAnswered || 0 : 0,
                correctAnswers: moduleInfo ? moduleInfo.correctAnswers || 0 : 0,
                wrongAnswers: moduleInfo ? moduleInfo.wrongAnswers || 0 : 0,
                totalAnswered: moduleInfo ? moduleInfo.totalAnswered || 0 : 0
            };
        });

        console.log(topicsWithModules)

        res.render('dashboard', {
            user: req.isAuthenticated() ? req.user : null,
            recommendations: user.aiRecommendations,
            selectedTopics: topicsWithModules, // Pasa la información combinada
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});



router.get('/dashboard/:topic', async (req, res) => {
    const { topic } = req.params;

    try {
        console.log(req.user.name)

        const user = await User.findOne({ name: req.user.name });

        if (!user) {
            return res.redirect('/login');
        }



        res.render('questions', {
            topic,
            user: req.isAuthenticated() ? req.user : null,
        })
    } catch (err) {
        console.error('Error generando preguntas:', err);
        res.status(500).send('Error generando preguntas');
    }
})

router.get('/dashboard/:topic/questions', async (req, res) => {
    const { topic } = req.params;

    try {
        const user = await User.findOne({ name: req.user.name });

        if (!user) {
            return res.redirect('/login');
        }

        const questions = await generateQuestions(topic);
        const { content } = questions;
        console.log(content)

        res.status(200).json({ topic: topic, question: content });
    } catch (error) {
        console.error('Error generando preguntas:', error);
        res.status(500).send('Error generando preguntas');
    }
});

router.post('/dashboard/:topic/questions/validate', async (req, res) => {
    const { question, answer } = req.body;

    try {
        const validateResponse = await validateAnswer(question, answer);
        console.log(validateResponse);

        let isCorrect = validateResponse.content.includes("Sí.");
        let correctAnswer = null;

        if (!isCorrect) {
            // Extraer la respuesta correcta de la respuesta del modelo
            const match = validateResponse.content.match(/La respuesta correcta es:? (.+)/i);
            console.log(match)
            if (match && match[1]) {
                correctAnswer = match[1];
                console.log(correctAnswer)
            }
        }

        res.json({ isCorrect, correctAnswer });
    } catch (err) {
        console.error('Error al validar la respuesta:', err);
        res.status(500).json({ error: 'Error al validar la respuesta' });
    }
});


router.post('/dashboard/:topic/progress', async (req, res) => {
    const { topic } = req.params;
    const { correctAnswers, wrongAnswers, totalAnswered, currentQuestionIndex, timeSpent } = req.body;

    try {
        // Encuentra al usuario por ID o email (dependiendo de cómo manejes la autenticación)
        const user = await User.findOne({ name: req.user.name });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Encuentra el módulo específico en el progreso del usuario
        const moduleIndex = user.modules.findIndex(module => module.moduleName === topic);

        if (moduleIndex !== -1) {
            // Actualiza los campos del módulo específico
            user.modules[moduleIndex].correctAnswers = correctAnswers;
            user.modules[moduleIndex].wrongAnswers = wrongAnswers;
            user.modules[moduleIndex].totalAnswered = totalAnswered;
            user.modules[moduleIndex].currentQuestionIndex = currentQuestionIndex;
            user.modules[moduleIndex].timeSpent = timeSpent;
        } else {
            // Si el módulo no existe, añádelo
            user.modules.push({
                moduleName: topic,
                correctAnswers,
                wrongAnswers,
                totalAnswered,
                currentQuestionIndex,
                timeSpent
            });
        }

        await user.save();
        res.status(200).json({ message: 'Progreso guardado exitosamente' });
    } catch (err) {
        console.error('Error guardando el progreso:', err);
        res.status(500).json({ message: 'Error guardando el progreso' });
    }
});


router.get('/dashboard/:topic/progress', async (req, res) => {
    const username = req.query.username || req.user.name;
    const { topic } = req.params;
    console.log(topic)
    try {
        const user = await User.findOne({ name: username}); // Encuentra al usuario
        console.log(user)
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const moduleIndex = user.modules.findIndex(module => module.moduleName === topic);

        const questionIndex = user.modules[moduleIndex].currentQuestionIndex;

        console.log(questionIndex)

        res.status(200).json({ currentQuestionIndex: questionIndex });
    } catch (error) {
        console.error('Error al obtener el progreso:', error);
        res.status(500).json({ message: 'Error al obtener el progreso' });
    }
});



router.post('/check-plagiarism', async (req, res) => {
    const { answer } = req.body;

    if (!answer) {
        return res.status(400).json({ error: 'No se envió una respuesta' });
    }

    try {
        const plagiarismResult = await checkPlagiarismWithAI(answer);
        const aiDetectionResult = await checkForAIGeneratedContent(answer);

        console.log({
            plagiarismResult,
            aiDetectionResult
        })

        let isValid = true;
        if (plagiarismResult.content == "Sí." || aiDetectionResult.content == "Sí.") {
            isValid = false;
        }

        res.json({
            plagiarism: plagiarismResult,
            aiDetected: aiDetectionResult,
            isValid: isValid
        });

    } catch (error) {
        console.error('Error al verificar plagio:', error);
        res.status(500).json({ error: 'Error al verificar plagio' });
    }
});

router.get('/profile/:uniqueId', async (req, res) => {
    const { uniqueId } = req.params;

    try {
        const user = await User.findOne({ name: req.user.name });

        if (!user) {
            return res.redirect('/login');
        }

        const selectedTopics = user.topics || [];
        const userModules = user.modules || [];

        // Crear un objeto para almacenar la información combinada
        const progressData = selectedTopics.map(topic => {
            // Inicializar los datos del tema
            let totalCorrectAnswers = 0;
            let totalWrongAnswers = 0;
            let totalAnswered = 0;

            // Sumar las estadísticas de los módulos relacionados
            userModules.forEach(module => {
                // Aquí asumo que el nombre del módulo contiene el tema
                // Si tienes una lógica diferente para asignar módulos a temas, ajústalo aquí
                if (module.moduleName.includes(topic)) {
                    totalCorrectAnswers += module.correctAnswers;
                    totalWrongAnswers += module.wrongAnswers;
                    totalAnswered += module.totalAnswered;
                }
            });

            // Calcular el porcentaje de progreso
            const totalQuestions = totalCorrectAnswers + totalWrongAnswers; // Total de preguntas respondidas
            const progressPercentage = totalQuestions > 0 ? 
                Math.round((totalCorrectAnswers / totalQuestions) * 100) : 0;

            return {
                name: topic,
                progress: progressPercentage.toFixed(2), // Redondea a dos decimales
                correctAnswers: totalCorrectAnswers,
                wrongAnswers: totalWrongAnswers,
                totalAnswered: totalAnswered
            };
        });

        // Renderiza la página de perfil con los datos de progreso
        res.render('profile', {
            user: req.isAuthenticated() ? req.user : null,
            progressData: progressData
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;