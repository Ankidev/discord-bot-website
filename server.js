'use strict';
const session  = require('express-session')
	, express = require('express')
	, MongoStore = require('connect-mongo')(session)
	, passport = require('passport')
	, Strategy = require('passport-discord').Strategy
	, path     = require('path')
	, helmet = require('helmet')
	, csrf = require('csurf')
	, bodyParser = require('body-parser')
	, cookieParser = require('cookie-parser')

module.exports = function startServer(app, client, config) {
    const statsDB = client.db(config.statsdbName).collection('stats');

	//passport for discord
	passport.serializeUser((user, done) => {
		done(null, user);
	});
	passport.deserializeUser((obj, done) => {
		done(null, obj);
	});
	passport.use(new Strategy({
		clientID: config.passportClientID,
		clientSecret: config.passportClientSecret,
		callbackURL: config.passportCallbackURL,
		scope: ['identify', 'guilds']
	}, (accessToken, refreshToken, profile, done) => {
		process.nextTick(() => {
			return done(null, profile);
		});
	}));

	//setup middlewares
	app.set('view engine', 'pug');
	app.set('views', path.join(__dirname, 'views'));
	app.use(session({
		secret: config.sessionSecret,
		store: new MongoStore({ db: client.db(config.sessionDbName) }),
		resave: false,
		saveUninitialized: false,
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: false
	}))
	app.use(cookieParser());
	app.use(helmet({
		//allow for discord bot listing sites
		frameguard: false
	}))
	app.use(csrf({
		ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
	}))
	app.use('/static/css', express.static(__dirname + '/views/css'));
	app.use('/static/js', express.static(__dirname + '/views/js'));

	//setup routes
	const routes = require('./router.js')(client, config);
	app.use('/', routes);
	app.use((err, req, res, next) => {
		if (err.code !== 'EBADCSRFTOKEN') return next(err);
		res.status(403);
		res.send('HALT!'); //invalid csrf token
	})

}
