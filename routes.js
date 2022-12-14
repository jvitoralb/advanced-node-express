const passport = require('passport');
const bcrypt = require('bcrypt');


const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

module.exports = function (app, myDataBase) {
    app.route('/').get((req, res) => {
        res.render('pug', {
            title: 'Connected to Database',
            message: 'Please login',
            showLogin: true,
            showRegistration: true,
            showSocialAuth: true
        });
    });

    const authentication = passport.authenticate('local', { failureRedirect: '/' });

    app.route('/login').post(authentication, (req, res) => {
        res.redirect('/profile');
    });

    app.route('/profile').get(ensureAuthenticated, (req, res) => {
        res.render('pug/profile', { username: req.user.name });
    });

    app.route('/chat').get(ensureAuthenticated, (req, res) => {
        res.render('pug/chat', { user: req.user });
    });

    app.route('/logout').get((req, res) => {
        req.logOut();
        res.redirect('/');
    });

    app.route('/register').post((req, res, next) => {
        const hash = bcrypt.hashSync(req.body.password, 12);

        myDataBase.findOne({ name: req.body.username }, (err, user) => {
            if (err) {
                return next();
            } else if (user) {
                return res.redirect('/');
            }

            const insertUser = {
                name: req.body.username,
                password: hash
            }

            myDataBase.insertOne(insertUser, (err, doc) => {
                if (err) {
                    return res.redirect('/');
                }
                next(null, doc.ops[0]);
            });
        });
    }, authentication, (req, res) => {
        res.redirect('/profile');
    });

    app.route('/auth/github').get(passport.authenticate('github'));

    app.route('/auth/github/callback').get(passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
        req.session.user_id = req.user.id;
        res.redirect('/chat');
    });

    app.use((req, res) => {
        res.status(404).type('text').send('Not Found');
    });
}