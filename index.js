const express = require(`express`)
const path = require(`path`)
const app = express()
const ejs = require(`ejs`)
const mongoose = require('mongoose');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session')
require('dotenv').config();
require('./database/db.js')
//settings
app.set(`view engine`, `ejs`)
app.set(`views`, path.join(__dirname, `views`))





//middlewares
app.use(cookieParser());
app.use(session({
    secret: 'nexuzlearn', // Cambia esto por un valor seguro
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/public",express.static("public"))
app.use(express.urlencoded({extended: false}))
app.use(express.json());
app.use(passport.initialize());
require('./config/passport')(passport);
app.use((err, req, res, next) => {
    console.error(err.stack); // Muestra el error en la consola
    res.status(500).send('Something broke!'); // Responde al cliente con un mensaje de error
});


//routes
app.use(`/`, require(`./routes/users.js`))
//Server


const port = process.env.SERVER_PORT || 5000

app.listen(port, ()=>{
    console.log(`listening on port ${port}`)
})
