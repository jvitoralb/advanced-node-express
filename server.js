'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const ObjectID = require('mongodb').ObjectID;

const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');

const app = express();
const rootPath = process.cwd();

app.set('view engine', 'pug');

fccTesting(app); //For FCC testing purposes

app.use(express.static(rootPath));
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
  // const myDataBase = await client.db('database').collection('users');

  app.route('/').get((req, res) => {
    res.render('pug', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true
    });
  });

  const authentication = passport.authenticate('local', { failureRedirect: '/' });

  app.route('/login').post(authentication, (req, res) => {
    res.redirect('/profile');
  });

  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  }

  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    res.render(`${rootPath}/views/pug/profile`, {
        username: req.user.username
      }
    );
  });

  app.route('/logout').get((req, res) => {
    req.logOut();
    res.redirect('/');
  });

  app.route('/register').post((req, res, next) => {
    myDataBase.findOne({username: req.body.username}, (err, user) => {
      if (err) {
        return next();
      } else if (user) {
        return res.redirect('/');
      }
      const hash = bcrypt.hashSync(req.body.password, 12);

      myDataBase.insertOne({
        username: req.body.username,
        password: hash
      }, (err, doc) => {
        if (err) {
          res.redirect('/');
        }
        next(null, doc.ops[0]);
      });
    });
  }, passport.authenticate('local', { failureRedirect: '/' }), (req, res, next) => {
    res.redirect('/profile');
  });

  app.use((req, res, next) => {
    res.status(404).type('text').send('Not Found');
  });

  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username}, attempt to log in.`)
    
      if (err) return done(err);
      if (!user) return done(null, false);
      if (!bcrypt.compareSync(password, user.password)) return done(null, false);

      return done(null, user);
    });
  }));

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
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


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
