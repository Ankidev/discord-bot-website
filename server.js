'use strict';
const express  = require('express')
	, session  = require('express-session')
	, { MongoClient } = require('mongodb')
	, MongoStore = require('connect-mongo')(session)
	, passport = require('passport')
	, Strategy = require('passport-discord').Strategy
	, path     = require('path')
	, socketio = require('socket.io')
	, app      = express()
	, server   = require('http').createServer(app)

const config  = require('./configs/main.json');
const info  = require('./configs/info.json');
const commands = require('./configs/commands.json');
const faq = require('./configs/faq.json');
const widgets = require('./configs/widgets.json');
const io = socketio(server, { transports: ['websocket'] });

io.on('connection', async(socket) => {
	console.log('New Stats Viewer');
    socket.emit('statstart', historicalstats);
});

async function startServer() {
	const historicalstats = [];
    const client = await MongoClient.connect(config.dbURL, { useNewUrlParser: true })
    const db = client.db(config.dbName).collection('stats');
	const changeStream = db.watch();
	changeStream.on("change", (change) => {
		if (change.operationType === 'insert' || change.operationType === 'replace') {
			if (change.fullDocument._id === 'stats') {
				const newstats = change.fullDocument.value;
				newstats.totalCpu = newstats.totalCpu/newstats.clusters.length;
				io.emit('stats', newstats);
				historicalstats.push(newstats);
				if (historicalstats.length > 100) {
					historicalstats.shift();
				}
			}
		}
	});

	passport.serializeUser((user, done) => {
		done(null, user);
	});
	passport.deserializeUser((obj, done) => {
		done(null, obj);
	});
	const scopes = ['identify', 'guilds'];
	passport.use(new Strategy({
		clientID: config.passportClientID,
		clientSecret: config.passportClientSecret,
		callbackURL: config.passportCallbackURL,
		scope: scopes
	}, (accessToken, refreshToken, profile, done) => {
		process.nextTick(() => {
			return done(null, profile);
		});
	}));
	app.disable('x-powered-by');
	app.set("view engine", "pug");
	app.set("views", path.join(__dirname, "views"));
	app.use(session({
		secret: config.sessionSecret,
		store: new MongoStore({ url: config.dbURL2 }),
		resave: false,
		saveUninitialized: false
	}));
	app.use(passport.initialize());
	app.use(passport.session());

	const gsetDB = client.db(config.dbName).collection('gsets');
	const playlistDB = client.db(config.dbName).collection('playlists');
	const permsDB = client.db(config.dbName).collection('permissions');

	app.get('/api/guilds/:guildid', checkAuth, async(req, res) => {
		console.log(req.url, JSON.stringify({id: req.user.id, username: req.user.username}))
		if (req.params.guildid) {
			const guild = req.user.guilds.find(guild => guild.id === req.params.guildid);
			if (!guild) {
				//prevent sneaky people getting info from servers they are not in
                return res.status(403).json({error:'Unauthorized. You are not a member of that guild.'});
            }
			const settings = await gsetDB.findOne({_id:guild.id});
			if (!settings) {
				return res.json({error:'Bot not in this guild.'});
			}
			const permissions = await permsDB.findOne({_id:guild.id});
			const playlists = await playlistDB.findOne({_id:guild.id});
			res.json({guild:guild, settings:settings.value, playlists:playlists.value, permissions:permissions.value});
		} else {
			res.status(400).json({error: 'Invalid request.'});
		}
	});

	app.get('/robots.txt', (req, res) => {
		res.type('text/plain');
		res.send("User-agent: *\nDisallow: /");
	});
	app.get('/login',
		passport.authenticate('discord', { scope: scopes }),
		(req, res) => {}
	);
	app.get('/callback',
		passport.authenticate('discord', { failureRedirect: '/' }),
		(req, res) => { res.redirect('/dashboard') } // auth success
	);
	app.get('/logout', (req, res) => {
		req.logout();
		res.redirect('/');
	});
	app.get('/', (req, res) => {
		//console.log(req.user)
		res.render('homepage', {
			cache: true,
			user: req.user,
			configs: info,
			commands: commands,
			widgets: widgets
		});
	});
	app.get('/dashboard', checkAuth, (req, res) => {
		//console.log(req.user)
		res.render('dashboard', {
			cache: true,
			configs: info,
			user: req.user
		});
	});
	app.get('/stats', (req, res) => {
		//console.log(req.user)
		res.render('stats', {
			cache: true,
			configs: info,
			user: req.user
		});
	});
	app.get('/faq', (req, res) => {
		//console.log(req.user)
		res.render('faq', {
			cache: true,
			user: req.user,
			configs: info,
			faq: faq,
			widgets: widgets
		});
	});
	app.get('/vote', (req, res) => {
		res.redirect(info.voteURL);
	});
	app.get('/support', (req, res) => {
		res.redirect(info.supportURL);
	});
	app.get('/invite', (req, res) => {
		res.redirect(info.inviteURL);
	});
	app.get('/github', (req, res) => {
		res.redirect(info.githubURL);
	});
	app.get('*', (req, res) => {
		res.status(404).render('404', {
			cache: true,
			configs: info,
			user: req.user
		});
	});
	function checkAuth(req, res, next) {
		if (req.isAuthenticated()) return next();
		res.redirect('/login')
	}
	server.listen(config.port);
	console.log('Listening on port '+config.port);
}
startServer();

