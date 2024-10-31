// controllers/topicController.js
const User = require('../models/User');
const { getAIProfileAdaptation } = require('../services/aiService');

exports.selectTopics = async (req, res) => {
    try {
        const user = await User.findOne({ name: req.user.name });
        if (!user) return res.redirect('/login');
        if (user.topics?.length) return res.redirect('/dashboard');
        
        res.render('topics', { user: req.isAuthenticated() ? req.user : null });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

exports.saveSelectedTopics = async (req, res) => {
    const selectedTopics = req.body.topics;
    try {
        const user = await User.findOne({ name: req.user.name });
        user.topics = selectedTopics;
        
        const aiResponse = await getAIProfileAdaptation(user, selectedTopics);
        user.aiRecommendations = aiResponse.content;
        await user.save();

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};
