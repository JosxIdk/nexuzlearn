// controllers/profileController.js
const User = require('../models/User');

exports.viewProfile = async (req, res) => {
    try {
        const user = await User.findOne({ name: req.user.name });
        if (!user) return res.redirect('/login');

        const progressData = user.topics.map(topic => {
            let totalCorrect = 0, totalWrong = 0, totalAnswered = 0;
            user.modules.forEach(module => {
                if (module.moduleName.includes(topic)) {
                    totalCorrect += module.correctAnswers;
                    totalWrong += module.wrongAnswers;
                    totalAnswered += module.totalAnswered;
                }
            });
            const progress = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
            return { name: topic, progress, correctAnswers: totalCorrect, wrongAnswers: totalWrong, totalAnswered };
        });
        
        res.render('profile', { user: req.isAuthenticated() ? req.user : null, progressData });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};
