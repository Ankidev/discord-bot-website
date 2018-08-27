'use strict';

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);

const express = require('express')
	, { MongoClient } = require('mongodb')
	, config  = require('./configs/main.json')

MongoClient.connect(config.dbURL, { useNewUrlParser: true }, async(err, client) => {
	if (err) {
		console.error(err);
        process.exit(1);
	}
	const app = express();
	const server = require('http').createServer(app);
	const website = require('./server.js')(app, client, config);
	try {
		const websocket = await require('./websocket.js').start(server, client, config);
	} catch(err) {
		console.error(err);
		process.exit(1);
	}
	server.listen(config.port, () => {
        console.log('Listening on port '+config.port);
    });
});
