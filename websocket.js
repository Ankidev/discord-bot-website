const socketio = require('socket.io')

module.exports = {

	historicalstats: null,

	start: async(server, client, config) => {
		const io = socketio(server, { transports: ['websocket'] })
	    const statsDB = client.db(config.statsdbName).collection('stats');
	    const changeStream = statsDB.watch();
	    io.on('connection', (socket) => {
	        socket.emit('statstart', this.historicalstats);
	    });
	    changeStream.on("change", (change) => {
	        if (change.operationType === 'insert' || change.operationType === 'replace') {
	            if (change.fullDocument._id === 'stats') {
	                const newstats = change.fullDocument.value;
	                newstats.totalCpu = newstats.totalCpu/newstats.clusters.length;
	                io.emit('stats', newstats);
	                if(!this.historicalstats) {
	                    this.historicalstats = new Array(150).fill(newstats);
	                }
	                this.historicalstats.push(newstats);
	                if (this.historicalstats.length > 150) {
	                    this.historicalstats.shift();
	                }
	            }
	        }
	    });
	},

	getStats: () => {
		return this.historicalstats;
	}

}