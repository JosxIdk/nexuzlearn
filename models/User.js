const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    topics: {
        type: [String], // Array de temas seleccionados por el usuario
        default: []
    },
    aiRecommendations: { type: String },
    progress: {
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 }, 
    },
    modules: [{
        moduleName: { type: String, required: true }, 
        correctAnswers: { type: Number, default: 0 },
        wrongAnswers: { type: Number, default: 0 },
        totalAnswered: { type: Number, default: 0 },
        timeSpent: { type: Number, default: 0 },
        currentQuestionIndex: { type: Number, default: 0},
        recommendations: { type: String }
    }],
    uniqueId: { type: String, unique: true, default: uuidv4},
    createdAt: { type: Date, default: Date.now },
    date: {
        type: Date,
        default: Date.now
    }
});

// Antes de guardar el usuario, hashear la contraseña
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Comparar contraseñas
UserSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('user', UserSchema);
