// app.js
const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const topicRoutes = require('./routes/topicRoutes');
const questionRoutes = require('./routes/questionRoutes');

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/topics', topicRoutes);
app.use('/questions', questionRoutes);

app.listen(3000, () => console.log('Servidor en puerto 3000'));
