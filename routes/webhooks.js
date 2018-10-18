const express = require('express')
	, router = express.Router()
	, websocket = require('../websocket.js')
	, info  = require('../configs/info.json')
	, commands = require('../configs/commands.json')
	, faq = require('../configs/faq.json')
	, widgets = require('../configs/widgets.json')
	, passport = require('passport')
	, crypto = require('crypto')
	, fetch = require('node-fetch')

module.exports = function(client, config) {

	const votesDB = client.db(config.statsdbName).collection('votes');
	const donateDB = client.db(config.statsdbName).collection('donate');
	const blacklistDB = client.db(config.statsdbName).collection('blacklist');

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

	router.post('/donatebotwebhook', async (req, res) => {
		const auth = req.headers['authorization'];
		if(!auth) {
			res.status(403).json({error:'Unauthorised'})
		} else {
			if (auth == config.donateSecret) {
				const donateData = req.body
				const key = donateData.txn_id
				const oldDonateData = await donateDB.findOne({_id: key});
				donateData._id = donateData.txn_id
				delete donateData.txn_id;
				try {
					if (oldDonateData) {
						donateData.tokens = (donateData.status != 'completed' ? 0 : oldDonateData.tokens)
						donateData.guildIDs = oldDonateData.guildIDs
						await donateDB.replaceOne({_id: key}, donateData)
					} else {
						donateData.guildIDs = []
						if (+donateData.price == 3.99) {
							donateData.tokens = 1; //3.99 per token
						} else if (+donateData.price >= 8.99) {
							donateData.tokens = 3; //2.99 per token
						} else {
							donateData.tokens = 0;
						}
						await donateDB.insertOne(donateData)
					}
				} catch(e) {
					return console.error('DONATION ERROR', e)
				}
				console.log('\nSUCCESSFUL DONATEBOT WEBHOOK:\n', donateData)
				switch (donateData.status) {
					case 'completed':
						// NO NEED TO DO ANYTHING -- HANDLE THE REST IN COMMAND
						break;
					case 'reversed':
						const blacklistData = donateData.guildIDs.map(x => { return {_id:x, value:'donation chargeback'} });
/* might cause peple to donate for somebody else and charges back
						if (donateData.buyer_id) {
							blacklistData.push({_id:donateData.buyer_id, value:'donation chargeback'})
						}
*/
						if (blacklistData.length > 0) {
							blacklistDB.insertMany(blacklistData)
						}
						break;
					case 'refunded':
						// NEED IPC TO HANDLE REFUNDS
						break;
					case 'sub_ended':
						// NOT BUSINESS PAYPAL SO NO SUB HANDLING
						break;
					default:
						console.warn('Unexpected donatebot status: ', donateData.status);
				}
			} else {
				res.status(403).json({error:'Unauthorised'})
			}
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
