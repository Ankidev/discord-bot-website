	var socket = io({ transports: ['websocket'] });
	socket.on('stats', function(data) {
		updatechart(data);
	});
	var flash = function(elements, color) {
		var opacity = 100;
		var interval = setInterval(function() {
			opacity -= 3;
			if (opacity <= 0) clearInterval(interval);
			$(elements).css({background: "rgba("+color+", "+opacity/100+")"});
		}, 30)
	};
	var updatechart = function(data) {
		if (data.guilds != $('#stats-guilds').text()) {
			var guildsColor = data.guilds < $('#stats-guilds').text() ? '150, 0, 0' : '0, 150, 0';
			$('#stats-guilds').text(data.guilds);
			flash('#stats-guilds', guildsColor);
		}
		if (data.users != $('#stats-users').text()) {
			var usersColor = data.users < $('#stats-users').text() ? '150, 0, 0' : '0, 150, 0';
			$('#stats-users').text(data.users);
			flash('#stats-users', usersColor);
		}
		if (data.totalVoiceConnections != $('#stats-streams').text()) {
			var streamsColor = data.totalVoiceConnections < $('#stats-streams').text() ? '150, 0, 0' : '0, 150, 0';
			$('#stats-streams').text(data.totalVoiceConnections);
			flash('#stats-streams', streamsColor);
		}
	};
