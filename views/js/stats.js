	var socket = io({ transports: ['websocket'] });
	socket.on('statstart', function(data) {
		tombotchart(data.tombot)
		dbchart(data.mongodb)
		lavalinkchart(data.lavalink)
		networkchart(data.network)
	});
	socket.on('stats', tombotchart);
	socket.on('networkStats', networkchart);
	socket.on('dbStats', dbchart);
	socket.on('lavalinkStats', lavalinkchart);
	function networkchart(data) {
    	var statdiv = $('.network-stats-table');
        statdiv.empty();
        $('<tr>').append(
            $('<th>').text('Date'),
            $('<th>').text('RX'),
            $('<th>').text('TX'),
            $('<th>').text('RX+TX')
        ).appendTo(statdiv);

        $('<tr>').append(
			$('<td>').text('All Time'),
			$('<td>').text((data.total.rx/1024/1024).toFixed()+'GB'),
			$('<td>').text((data.total.tx/1024/1024).toFixed()+'GB'),
			$('<td>').text(((data.total.rx+data.total.tx)/1024/1024).toFixed()+'GB'),
        ).appendTo(statdiv);

		$.each(data.days, function(i, item) {
			$('<tr>').append(
	            $('<td>').text(item.date.day+' / '+item.date.month+' / '+item.date.year),
	            $('<td>').text((item.rx/1024/1024).toFixed()+'GB'),
	            $('<td>').text((item.tx/1024/1024).toFixed()+'GB'),
	            $('<td>').text(((item.rx+item.rx)/1024/1024).toFixed()+'GB'),
	        ).appendTo(statdiv);
		})
	}
	function dbchart(data) {
    	var statdiv = $('.db-stats-table');
        statdiv.empty();
        $('<tr>').append(
            $('<th>').text('Uptime'),
            $('<th>').text('CPU'),
            $('<th>').text('RAM'),
        ).appendTo(statdiv);

		$('<tr>').append(
            $('<td>').text((data.elapsed/1000/60/60).toFixed() +'h'),
            $('<td>').text((data.cpu/8).toFixed(1) +'%'),
            $('<td>').text(Math.floor(data.memory/1024/1024)+"MB"),
        ).appendTo(statdiv);
    }
	function lavalinkchart(data) {
    	var statdiv = $('.music-stats-table');
        statdiv.empty();
        $('<tr>').append(
            $('<th>').text('Uptime'),
            $('<th>').text('CPU'),
            $('<th>').text('RAM'),
        ).appendTo(statdiv);

		$('<tr>').append(
            $('<td>').text((data.elapsed/1000/60/60).toFixed() +'h'),
            $('<td>').text((data.cpu/8).toFixed(1) +'%'),
            $('<td>').text(Math.floor(data.memory/1024/1024)+"MB"),
        ).appendTo(statdiv);
    };
	function tombotchart(data) {
		var statdiv = $('.tombot-stats-table');
        statdiv.empty();
        $('<tr>').append(
			$('<th>').text(''),
			$('<th>').text('Cluster'),
			$('<th>').text('Shards'),
			$('<th>').text('Servers'),
			$('<th>').text('Users'),
			$('<th>').text('Streams'),
			$('<th>').text('Uptime'),
			$('<th>').text('CPU'),
			$('<th>').text('RAM')
		).appendTo(statdiv);

        $('<tr>').append(
			$('<td>').text(''),
			$('<td>').text('TOTAL'),
			$('<td>').text(
					data.clusters.map(x => x.shards).reduce((p, n) => p + n)
			),
			$('<td>').text(data.guilds.toLocaleString()),
			$('<td>').text(data.users.toLocaleString()),
			$('<td>').text(data.totalVoiceConnections),
			$('<td>').text('N/A'),
			$('<td>').text((data.totalCpu/data.clusters.length).toFixed(1) + '%'),
			$('<td>').text((data.totalRam/1000).toFixed(2) + 'GB')
        ).appendTo(statdiv);

		$.each(data.clusters, function(i, item) {
			$('<tr>').append(
				$(item.guilds > 0 ? '<td style=color:lightgreen>' : '<td style=color:red>').text('●'),
				$('<td>').text(item.cluster),
				$('<td>').text(item.shards),
				$('<td>').text(item.guilds.toLocaleString()),
				$('<td>').text(item.users.toLocaleString()),
				$('<td>').text(item.voiceConnections),
				$('<td>').text(
						(item.uptime/1000/60/60).toFixed() +'h'
				),
				$('<td>').text(item.cpu.toFixed(1) + '%'),
				$('<td>').text(item.ram.toFixed(0) + 'MB')
			).appendTo(statdiv);
		});
	}
