const express = require('express')
	, { MongoClient } = require('mongodb')
	, config  = require('./configs/main.json')

MongoClient.connect(config.dbURL, { useNewUrlParser: true }, function(err, client) {

	const app = express();
	const server = require('http').createServer(app);
	const websocket = require('./websocket.js').start(server, client, config);
	const website = require('./server.js')(app, client, config);
	server.listen(config.port, () => {
        console.log('Listening on port '+config.port);
    });

});
