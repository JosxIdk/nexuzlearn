// passport-config.js
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Asegúrate de que la ruta al modelo User es correcta

module.exports = function(passport) {
    passport.use(new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                const user = await User.findOne({ email });
                if (!user) {
                    return done(null, false, { message: 'Usuario no encontrado' });
                }

                // Comparar contraseñas
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    return done(null, user); // Autenticación exitosa
                } else {
                    return done(null, false, { message: 'Contraseña incorrecta' });
                }
            } catch (error) {
                return done(error);
            }
        }
    ));

    // Almacenar el usuario en la sesión
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Recuperar el usuario de la sesión
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
};
