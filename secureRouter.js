const express = require('express')
	, router = express.Router()
	, websocket = require('./websocket.js')
	, info  = require('./configs/info.json')
    , commands = require('./configs/commands.json')
    , faq = require('./configs/faq.json')
    , widgets = require('./configs/widgets.json')
	, passport = require('passport')

module.exports = function(client, config) {

    const gsetDB = client.db(config.statsdbName).collection('gsets');
    const playlistDB = client.db(config.statsdbName).collection('playlists');
    const permsDB = client.db(config.statsdbName).collection('permissions');

    router.get('/', (req, res) => {
		const stats = websocket.getStats()
        res.render('homepage', {
            cache: false,
            style: req.cookies.style ? req.cookies.style : config.defaultStyle,
            user: req.user,
            configs: info,
            csrf: req.csrfToken(),
            widgets: widgets,
            stats: stats[stats.length-1]
        });
    });
    router.get('/commands', (req, res) => {
        res.render('commands', {
            cache: true,
            style: req.cookies.style ? req.cookies.style : config.defaultStyle,
            user: req.user,
            configs: info,
            commands: commands,
            csrf: req.csrfToken()
        });
    });
    router.get('/dashboard', checkAuth, (req, res) => {
        res.render('dashboard', {
            cache: true,
            style: req.cookies.style ? req.cookies.style : config.defaultStyle,
            configs: info,
            user: req.user,
            csrf: req.csrfToken()
        });
    });
    router.get('/stats', (req, res) => {
        res.render('stats', {
            cache: true,
            style: req.cookies.style ? req.cookies.style : config.defaultStyle,
            configs: info,
            user: req.user,
            csrf: req.csrfToken()
        });
    });
    router.get('/faq', (req, res) => {
        res.render('faq', {
            cache: true,
            style: req.cookies.style ? req.cookies.style : config.defaultStyle,
            user: req.user,
            configs: info,
            faq: faq,
            widgets: widgets,
            csrf: req.csrfToken()
        });
    });
    router.get('/callback',
        passport.authenticate('discord', { failureRedirect: '/' }),
        (req, res) => { res.redirect('/dashboard') } // auth success
    );
    router.get('/vote', (req, res) => {
        res.redirect(info.voteURL);
    });
    router.get('/support', (req, res) => {
        res.redirect(info.supportURL);
    });
    router.get('/invite', (req, res) => {
        res.redirect(info.inviteURL);
    });
    router.get('/github', (req, res) => {
        res.redirect(info.githubURL);
    });
    router.get('/robots.txt', (req, res) => {
        res.type('text/plain');
        res.send('User-agent: *\nDisallow:');
    });
    router.get('/api/guilds/:guildid', checkAuth, dashboardGuildCheck, async(req, res) => {
        res.json({error:'Not implemented yet.'});
        //res.json({guild:res.locals.guild, settings:res.locals.settings.value, permissions:res.locals.permissions.value});
    });
    router.get('*', (req, res) => {
        res.status(404).render('404', {
            cache: true,
            style: req.cookies.style ? req.cookies.style : config.defaultStyle,
            user: req.user,
            configs: info,
            csrf: req.csrfToken()
        });
    });
    router.post('/logout', checkAuth, (req, res) => {
        req.logout();
        res.redirect('/');
    });
    router.post('/login',
        passport.authenticate('discord', { scope: ['identify', 'guilds'] }),
        (req, res) => {}
    );
    router.post('/api/guilds/:guildid/edit', checkAuth, dashboardGuildCheck, async(req, res) => {
        //i guess accept JSON payload with the updated json. gonna have to chek all that data to be valid, probably with another mniddleware
        res.json({error:'Not implemented yet.'});
    });

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

	return router;

}
