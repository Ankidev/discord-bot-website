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
	, helmet = require('helmet')
	, csrf = require('csurf')
	, bodyParser = require('body-parser')
	, cookieParser = require('cookie-parser')

const config  = require('./configs/main.json');
const info  = require('./configs/info.json');
const commands = require('./configs/commands.json');
const faq = require('./configs/faq.json');
const widgets = require('./configs/widgets.json');

async function startServer() {
	const scopes = ['identify', 'guilds'];
	let historicalstats = null;
	const io = socketio(server, { transports: ['websocket'] });
	io.on('connection', async(socket) => {
	    socket.emit('statstart', historicalstats);
	});
	const client = await MongoClient.connect(config.dbURL, { useNewUrlParser: true })
    const statsDB = client.db(config.statsdbName).collection('stats');
 	const gsetDB = client.db(config.statsdbName).collection('gsets');
	const playlistDB = client.db(config.statsdbName).collection('playlists');
	const permsDB = client.db(config.statsdbName).collection('permissions');
	const changeStream = statsDB.watch();
	changeStream.on("change", (change) => {
		if (change.operationType === 'insert' || change.operationType === 'replace') {
			if (change.fullDocument._id === 'stats') {
				const newstats = change.fullDocument.value;
				newstats.totalCpu = newstats.totalCpu/newstats.clusters.length;
				io.emit('stats', newstats);
				if(!historicalstats) {
					historicalstats = new Array(150).fill(newstats);
				}
				historicalstats.push(newstats);
				if (historicalstats.length > 150) {
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
	app.set("view engine", "pug");
	app.use(express.static(path.join(__dirname, 'views')));
	app.set("views", path.join(__dirname, "views"));
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
		frameguard: false //allow for discord bot listing sites
	}))
	app.use(csrf({
		ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
	}))
	app.get('/', (req, res) => {
		res.render('homepage', {
			cache: true,
			style: req.cookies.style ? req.cookies.style : 'light',
			user: req.user,
			configs: info,
			csrf: req.csrfToken(),
			widgets: widgets,
			stats: historicalstats[historicalstats.length-1]
		});
	});
	app.get('/commands', (req, res) => {
		res.render('commands', {
			cache: true,
			style: req.cookies.style ? req.cookies.style : 'light',
			user: req.user,
			configs: info,
			commands: commands,
			csrf: req.csrfToken()
		});
	});
	app.get('/dashboard', checkAuth, (req, res) => {
		res.render('dashboard', {
			cache: true,
			style: req.cookies.style ? req.cookies.style : 'light',
			configs: info,
			user: req.user,
			csrf: req.csrfToken()
		});
	});
	app.get('/stats', (req, res) => {
		res.render('stats', {
			style: req.cookies.style ? req.cookies.style : 'light',
			cache: false,
			configs: info,
			user: req.user,
			csrf: req.csrfToken()
		});
	});
	app.get('/faq', (req, res) => {
		res.render('faq', {
			cache: true,
			style: req.cookies.style ? req.cookies.style : 'light',
			user: req.user,
			configs: info,
			faq: faq,
			widgets: widgets,
			csrf: req.csrfToken()
		});
	});
	app.get('/callback',
		passport.authenticate('discord', { failureRedirect: '/' }),
		(req, res) => { res.redirect('/dashboard') } // auth success
	);
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
	app.get('/robots.txt', (req, res) => {
		res.type('text/plain');
		res.send('User-agent: *\nDisallow:');
	});
	app.get('/api/guilds/:guildid', checkAuth, dashboardGuildCheck, async(req, res) => {
		res.json({guild:res.locals.guild, settings:res.locals.settings.value, permissions:res.locals.permissions.value});
	});
	app.get('*', (req, res) => {
		res.status(404).render('404', {
			cache: true,
			style: req.cookies.style ? req.cookies.style : 'light',
			user: req.user,
			configs: info,
			csrf: req.csrfToken()
		});
	});
	app.post('/logout', checkAuth, (req, res) => {
		req.logout();
		res.redirect('/');
	});
	app.post('/login',
		passport.authenticate('discord', { scope: scopes }),
		(req, res) => {}
	);
    app.post('/api/guilds/:guildid/edit', checkAuth, dashboardGuildCheck, async(req, res) => {
		//i guess accept JSON payload with the updated json. gonna have to chek all that data to be valid, probably with another mniddleware
		res.json({error:'Not implemented yet.'});
    });
	app.use((err, req, res, next) => {
		if (err.code !== 'EBADCSRFTOKEN') return next(err);
		res.status(403);
		res.send('HALT!'); //invalid csrf token
	})
	function checkAuth(req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		} else {
			res.redirect('/');
		}
	}
	async function dashboardGuildCheck(req, res, next) {
        if (req.params.guildid) {
            const guild = req.user.guilds.find(guild => guild.id === req.params.guildid);
            if (!guild) {
                return res.status(403).json({error:'Unauthorized. You are not a member of that guild.'});
            }
			res.locals.guildid = guild.id
			try {
	            res.locals.settings = await gsetDB.findOne({_id:res.locals.guildid});
			} catch(e) {
				return res.json({error:'Error reading from DB'});
			}
            if (!res.locals.settings) {
                return res.json({error:'Bot not in this guild.', });
            }
			res.locals.permissions = await permsDB.findOne({_id:res.locals.guildid});
			next();
        } else {
            res.status(400).json({error: 'Invalid request.'});
        }
	}
	server.listen(config.port);
	console.log('Listening on port '+config.port);
}
startServer();

