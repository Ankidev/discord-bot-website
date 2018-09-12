const socketio = require('socket.io')

module.exports = {

	historicalstats: null,

	start: async(server, client, config) => {
		const io = socketio(server, { transports: ['websocket'] })
	    const statsDB = client.db(config.statsdbName).collection('stats');
		const firststat = await statsDB.findOne({_id:'stats'});
		this.historicalstats = []
		this.historicalstats.push(firststat.value.tombot);
	    const changeStream = statsDB.watch();
	    io.on('connection', (socket) => {
	        socket.emit('statstart', this.historicalstats);
	    });
	    changeStream.on("change", (change) => {
	        if (change.operationType === 'update' && change.updateDescription.updatedFields['value.tombot']) {
	                const newstats = change.updateDescription.updatedFields['value.tombot'];
	                io.emit('stats', newstats);
	                this.historicalstats.push(newstats);
	                if (this.historicalstats.length > 100) {
	                    this.historicalstats.shift();
	                }
	        }
	    });
	},

	getStats: () => {
		return this.historicalstats;
	}

}
