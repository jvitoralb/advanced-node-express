'use strict';
require('dotenv').config();
const routes = require('./routes.js');
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const auth = require('./auth.js');
const cookieParser = require('cookie-parser');
const passportSocketIO = require('passport.socketio');


const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const MongoStore = require('connect-mongo')(session);
const store = new MongoStore({ url: process.env.MONGO_URI });

const PORT = process.env.PORT || 3000;

app.set('view engine', 'pug');

fccTesting(app); //For FCC testing purposes
app.use(express.static(process.cwd()));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: store,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

const onAuthorizeFail = (data, message, error, accept) => {
    if (error) throw new Error(message);
    console.log('Fail to connect to socket.io', message)
    accept(null, false);
}

const onAuthorizeSucess = (data, accept) => {
    console.log('Successful connection to socket.io')
    accept(null, true);
}

myDB(async (client) => {
    const myDataBase = await client.db('advancedTest').collection('authUsers');
    let currentUsers = 0;

    routes(app, myDataBase);
    auth(app, myDataBase);

    io.use(passportSocketIO.authorize({
        cookieParser: cookieParser,
        key: 'express.sid',
        secret: process.env.SESSION_SECRET,
        store: store,
        success: onAuthorizeSucess,
        fail: onAuthorizeFail
    }));

    io.on('connection', (socket) => {
        currentUsers++;
        io.emit('user', {
            name: socket.request.user.name,
            currentUsers,
            connected: true
        });
        console.log(`${socket.request.user.name} has connected`);

        socket.on('chat message', (messageSent) => {
            console.log('message', messageSent)
            io.emit('chat message', {
                name: socket.request.user.name,
                message: messageSent
            });
        })

        socket.on('disconnect', () => {
            currentUsers--;
            console.log(`${socket.request.user.name} has disconnected`);
        });
    });
}).catch((err) => {
    app.route('/').get((req, res) => {
        res.render('pug', {
            title: err,
            message: 'Unable to login'
        });
    });
});


http.listen(PORT, () => {
    console.log('Listening on port ' + PORT);
});