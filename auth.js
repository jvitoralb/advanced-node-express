require('dotenv').config();

const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const GitHubStrategy = require('passport-github');
const ObjectID = require('mongodb').ObjectID;


module.exports = function(app, myDataBase) {
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
        myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
            done(null, doc);
        });
    });

    passport.use(new LocalStrategy((username, password, done) => {
        myDataBase.findOne({ name: username }, (err, user) => {
            console.log(`User ${username}, attempt to log in.`)
            if (err) return done(err);
            if (!user) return done(null, false);
            if (!bcrypt.compareSync(password, user.password)) return done(null, false);

            return done(null, user);
        });
    }));

    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: 'https://advanced-node-express-production.up.railway.app/auth/github/callback'
    },  (accessToken, refreshToken, profile, cb) => {
            myDataBase.findOneAndUpdate({ id: profile.id }, {
                $setOnInsert: {
                    id: profile.id,
                    name: profile.displayName,
                    photo: profile.photos[0].value || '',
                    email: Array.isArray(profile.emails) ? profile.emails[0].value : 'No public email',
                    create_on: new Date(),
                    provider: profile.provider
                },
                $set: {
                    last_login: new Date()
                },
                $inc: {
                    login_count: 1
                }
            }, {
                upsert: true,
                new: true
            }, (err, doc) => {
                    if (err) return console.log('err', err);
                    return cb(null, doc.value);
                }
            )
        }
    ));
}