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
	, configs  = require('./configs.json');

const io = socketio(server, {
        'pingInterval': 40000,
        'pingTimeout': 25000,
        transports: ['websocket']
});
const historicalstats = [];
async function sendStats() {
    const client = await MongoClient.connect(configs.dbURL, { useNewUrlParser: true })
    const db = client.db(configs.dbName).collection(configs.collectionName);
	const changeStream = db.watch();
	changeStream.on("change", (change) => {
		if (change.operationType === 'insert' || change.operationType === 'replace') {
			if (change.fullDocument._id === 'stats') {
				const newstats = change.fullDocument.value;
				newstats.totalCpu = newstats.totalCpu/newstats.clusters.length;
				io.emit('stats', newstats);
				historicalstats.push(newstats);
				if (historicalstats.length > 50) {
					historicalstats.shift();
				}
			}
		}
	});
}
sendStats();
io.on('connection', async(socket) => {
    socket.emit('statstart', historicalstats);
});

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});
const scopes = ['identify', 'guilds'];
passport.use(new Strategy({
    clientID: configs.passportClientID,
    clientSecret: configs.passportClientSecret,
    callbackURL: configs.passportCallbackURL,
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
    secret: configs.sessionSecret,
    store: new MongoStore({ url: configs.dbURL2 }),
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
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
		commands: require('./views/commands.json')
    });
});
app.get('/dashboard', checkAuth, (req, res) => {
    //console.log(req.user)
	res.render('dashboard', {
		cache: true,
        user: req.user
    });
});
app.get('/stats', (req, res) => {
    //console.log(req.user)
	res.render('stats', {
		cache: true,
        user: req.user
    });
});
app.get('/faq', (req, res) => {
    //console.log(req.user)
	res.render('faq', {
		cache: true,
        user: req.user
    });
});
app.get('/vote', (req, res) => {
    res.redirect(configs.voteURL);
});
app.get('/support', (req, res) => {
    res.redirect(configs.supportURL);
});
app.get('/invite', (req, res) => {
    res.redirect(configs.inviteURL);
});
app.get('/github', (req, res) => {
    res.redirect(configs.githubURL);
});
app.get('*'), (req, res) => {
	res.render('404', {
		cache: true,
        user: req.user
    });
});
/*
app.get('/api/guilds/*', checkAuth, async(req, res) => {
	const ID = req.url.substring(req.url.lastIndexOf('/')+1)
	const gsets = 
	let data = req.user.guilds.find(guild => guild.id === ID);
	res.json(data || {error: 'Not in this server.'});
});
*/
function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login')
}
server.listen(5000);
console.log('Listening on port 5000')
