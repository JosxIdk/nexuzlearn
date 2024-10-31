// controllers/authController.js
const User = require('../models/User');
const passport = require('passport');
const { v4: uuidv4 } = require('uuid');

exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'El usuario ya existe' });
        
        user = new User({ name, email, password, uniqueId: uuidv4() });
        await user.save();
        res.redirect('/login');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.loginUser = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err || !user) {
            console.error('Error de autenticación:', err || info.message);
            return res.redirect('/login');
        }
        req.logIn(user, err => {
            if (err) return next(err);
            res.redirect('/select-topics');
        });
    })(req, res, next);
};

exports.logoutUser = (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Error del servidor al cerrar sesión');
        res.redirect('/login');
    });
};
