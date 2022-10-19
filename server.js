'use strict';
require('dotenv').config();
const routes = require('./routes.js');
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const auth = require('./auth.js');


const app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);


app.set('view engine', 'pug');

fccTesting(app); //For FCC testing purposes
app.use(express.static(process.cwd()));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

myDB(async (client) => {
    const myDataBase = await client.db('advancedTest').collection('authUsers');

    io.on('connect', (socket) => {
        console.log('A user has connected');
        console.log(socket)
    });

    routes(app, myDataBase);
    auth(app, myDataBase);
}).catch((err) => {
    app.route('/').get((req, res) => {
        res.render('pug', {
            title: err,
            message: 'Unable to login'
        });
    });
});


const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log('Listening on port ' + PORT);
});