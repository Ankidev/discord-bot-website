<script>
	var socket = io({ transports: ['websocket'] });
	socket.on('statstart', function(historicaldata) {
		historicaldata.forEach(function(data){
			updatechart(data);
		});
	});
	socket.on('stats', function(data) {
		updatechart(data, true);
	});
	var updatechart = function(data) {
		$('#stats-guilds').text(data.guilds);
		$('#stats-users').text(data.users);
		$('#stats-streams').text(data.totalVoiceConnections);
	}
</script>
