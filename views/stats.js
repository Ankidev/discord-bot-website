<script>
	var charts = {};
	var dpsUsers = {};
	var dpsVc = {};
	var dpsCpu = {};
	var dpsRam = {};
	var socket = io({ transports: ['websocket'] });
	socket.on('statstart', function(historicaldata) {
		for(var i = 0; i < 8; i++) {
			var chartname = 'chartContainer'+(i+1);
			dpsUsers[chartname] = [];
			dpsVc[chartname] = [];
			dpsCpu[chartname] = [];
			dpsRam[chartname] = [];
			charts[chartname] = new CanvasJS.Chart(chartname, {
				backgroundColor: '#2C2F33',
				title:{
					text: "Cluster "+(i+1),
					fontFamily: 'Roboto Mono',
					fontColor: '#fff',
					fontSize: 16
				},
				data: [
					{
						toolTipContent: '{name} : {y}',
						type: 'spline',
						name: 'Users',
						color: '#fff',
						axisYIndex: 1,
						dataPoints: dpsUsers[chartname]
					},
					{
						toolTipContent: '{name} : {y}',
						type: 'spline',
						name: 'Streams',
						color: '#ff0000',
						axisYIndex: 0,
						dataPoints: dpsVc[chartname]
					},
					{
						toolTipContent: '{name} : {y}MB',
						type: 'splineArea',
						name: 'RAM',
						color: '#00ff1d',
						axisYType: 'secondary',
						axisYIndex: 0,
						dataPoints: dpsRam[chartname],
						suffix: '%'
					},
					{
						toolTipContent: '{name} : {y}%',
						type: 'splineArea',
						name: 'CPU',
						color: '#2693ff',
						axisYType: 'secondary',
						axisYIndex: 1,
						dataPoints: dpsCpu[chartname],
						suffix: 'GB'
					}
				],
				axisY: [
					//streams
					{
						gridThickness: 0,
						tickLength: 0,
						lineThickness: 0,
						labelFormatter: function(){
						  return " ";
						},
						interval: 2,
						includeZero: true
					},
					//users
					{
						gridThickness: 0,
						tickLength: 0,
						lineThickness: 0,
						labelFormatter: function(){
						  return " ";
						},
						interval: 25,
						includeZero: false
					}
				],
				axisY2: [
					//ram
					{
						gridThickness: 0,
						tickLength: 0,
						lineThickness: 0,
						labelFormatter: function(){
						  return " ";
						},
						minimum: 0,
						maximum: 4000
					},
					//cpu
					{
						gridThickness: 0,
						tickLength: 0,
						lineThickness: 0,
						labelFormatter: function(){
						  return " ";
						},
						minimum: 0,
						maximum: 100
					}
				],
				axisX: {
					labelFontSize: 0
				}
			});
			charts[chartname].render();
		}
		var credits = document.getElementsByClassName('canvasjs-chart-credit');
		for(var i = 0; i < credits.length; i++){
			credits[i].innerText = '';
		}
		historicaldata.forEach(function(data){
			updatechart(data, false);
		});
		rendercharts();
	});
	socket.on('stats', function(data) {
		updatechart(data, true);
	});
	var rendercharts = function(){
		for(key in charts) {
			charts[key].render();
		}
	}
	var xindex = 0;
	var updatechart = function(data, rend) {
		var statdiv = $('.stats-total-table');
        statdiv.empty();
        $('<tr>').append(
			$('<th>').text('Cluster ID'),
			$('<th>').text('Shards'),
			$('<th>').text('Servers'),
			$('<th>').text('Users'),
			$('<th>').text('Streams'),
			$('<th>').text('Uptime'),
			$('<th>').text('CPU%'),
			$('<th>').text('RAM')
		).appendTo(statdiv);

        $('<tr>').append(
			$('<td>').text('TOTAL'),
			$('<td>').text(
					data.clusters.map(x => x.shards).reduce((p, n) => p + n)
			),
			$('<td>').text(data.guilds),
			$('<td>').text(data.users),
			$('<td>').text(data.totalVoiceConnections),
			$('<td>').text('N/A'),
			$('<td>').text(data.totalCpu.toFixed(1) + '%'),
			$('<td>').text(data.totalRam.toFixed(0) + 'MB')
        ).appendTo(statdiv);

		$.each(data.clusters, function(i, item) {
			$('<tr>').append(
				$('<td>').text(item.cluster),
				$('<td>').text(item.shards),
				$('<td>').text(item.guilds),
				$('<td>').text(item.users),
				$('<td>').text(item.voiceConnections),
				$('<td>').text(
						(item.uptime/1000/60/60).toFixed() +'h'
				),
				$('<td>').text(item.cpu.toFixed(1) + '%'),
				$('<td>').text(item.ram.toFixed(0) + 'MB')
			).appendTo(statdiv);
		});

		xindex++;
		data.clusters.forEach(function(cluster, i){
			var clustername = 'chartContainer'+(i+1);
			dpsUsers[clustername].push({
				x: xindex,
				y: cluster.users
			});
			dpsVc[clustername].push({
				x: xindex,
				y: cluster.voiceConnections
			});
			dpsRam[clustername].push({
				x: xindex,
				y: Math.floor(cluster.ram)
			});
			dpsCpu[clustername].push({
				x: xindex,
				y: cluster.cpu
			});
			if (dpsUsers[clustername].length > 50) {
				dpsUsers[clustername].shift();
				dpsVc[clustername].shift();
				dpsRam[clustername].shift();
				dpsCpu[clustername].shift();
			}
		})
		if (rend) {
			rendercharts();
		}
	}
</script>
