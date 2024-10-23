const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    module: { type: String, required: true },
    questionText: { type: String, required: true }, 
    answer: { type: String, required: true },
    choices: [{ type: String }], 
    image: { type: String } 
});

module.exports = mongoose.model('question', questionSchema);