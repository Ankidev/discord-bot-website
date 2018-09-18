const express = require('express')
	, router = express.Router()
	, websocket = require('./websocket.js')
	, info  = require('./configs/info.json')
	, commands = require('./configs/commands.json')
	, faq = require('./configs/faq.json')
	, widgets = require('./configs/widgets.json')
	, passport = require('passport')
	, crypto = require('crypto')
	, fetch = require('node-fetch')

module.exports = function(client, config) {

	const votesDB = client.db(config.statsdbName).collection('votes');

	router.post('/patreonwebhook', (req, res) => {
		if (req.headers && req.headers['x-patreon-signature']) {
			let hash = req.headers['x-patreon-signature'];
			let hmac = crypto.createHmac("md5", config.patreonSecret);
			hmac.update(JSON.stringify(req.body));
			let crypted = hmac.digest("hex");
			if (crypted === hash) {
				console.log(JSON.stringify(req.body,null,2));
				res.status(200).set("Connection", "close").end();
			} else {
				console.log("Bad hash! " + hash + " crypted " + crypted);
				res.status(403).json({error:'Unauthorised'})
			}
		} else {
			res.status(403).json({error:'Unauthorised'})
		}
	});

	router.post('/dblwebhook', (req, res) => {
		const auth = req.headers['authorization'];
		if(!auth) {
			res.status(403).json({error:'Unauthorised'})
		} else {
			if (auth == config.dblAuth) {
				const botdata = req.body
				console.info('VOTE  | '+botdata.user);
				votesDB.replaceOne({_id: botdata.user.toString()},{_id: botdata.user.toString(),value: true,expireAt: new Date((new Date).getTime() + (config.cacheHours*1000*60*60))},{upsert: true});
				const body = {embeds: [{
					title: 'Upvote!',
					description: `Thank you <@!${botdata.user}> for supporting TomBot!`,
					footer: {text: new Date().toLocaleString()}
				}], username: 'TomBot'};
				fetch(`https://discordapp.com/api/webhooks/${config.webhookID}/${config.webhookToken}`, {
					method: 'POST',
					body: JSON.stringify(body),
					headers: { 'Content-Type': 'application/json' }
				});
			} else {
				res.status(403).json({error:'Unauthorised'})
			}
		}
	})

	

	return router;

}
