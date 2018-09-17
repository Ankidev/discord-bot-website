const socketio = require('socket.io')

module.exports = {

	stats: {},

	start: async(server, client, config) => {
		const io = socketio(server, { transports: ['websocket'] })
	    const statsDB = client.db(config.statsdbName).collection('stats');
		const firststat = await statsDB.findOne({_id:'stats'}).then(v => v.value);
		this.stats = {mongodb:firststat.mongodb, lavalink:firststat.lavalink, tombot:firststat.tombot, network:firststat.network}
	    const changeStream = statsDB.watch();
	    io.on('connection', (socket) => {
	        socket.emit('statstart', this.stats );
	    });
	    changeStream.on("change", (change) => {
			if (change.operationType === 'update') {
				for(let update in change.updateDescription.updatedFields) {
					if (update === 'value.tombot') {
						const newstats = change.updateDescription.updatedFields['value.tombot'];
		                this.stats.tombot = newstats;
		                io.emit('stats', newstats);
					} else if (update === 'value.lavalink') {
						const newstats = change.updateDescription.updatedFields['value.lavalink'];
						this.stats.lavalink = newstats;
	                    io.emit('lavalinkStats', newstats);
					} else if (update === 'value.mongodb') {
						const newstats = change.updateDescription.updatedFields['value.mongodb'];
						this.stats.mongodb = newstats;
	                    io.emit('dbStats', newstats);
					} else if (update === 'value.network') {
						const newstats = change.updateDescription.updatedFields['value.network'];
						this.stats.network = newstats;
	                    io.emit('networkStats', newstats);
			        }
				}
			}
	    });
	},

	getStats: () => {
		return this.stats;
	}

}
