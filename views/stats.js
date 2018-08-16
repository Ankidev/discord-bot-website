<script>
	var charts = {};
	var dpsUsers = {};
	var dpsVc = {};
	var dpsCpu = {};
	var dpsRam = {};
	var dpsGuilds = {};
	var socket = io({ transports: ['websocket'] });
	socket.on('statstart', function(historicaldata) {
		for(var i = 0; i < historicaldata[0].clusters.length; i++) {
			var chartname = 'chartContainer'+(i+1);
			dpsUsers[chartname] = [];
			dpsVc[chartname] = [];
			dpsCpu[chartname] = [];
			dpsRam[chartname] = [];
			dpsGuilds[chartname] = [];
			charts[chartname] = new CanvasJS.Chart(chartname, {
				backgroundColor: '#2C2F33',
				legend:{
					cursor:"pointer",
					fontColor: "#fff",
					itemclick : toggleDataSeries
				},
				toolTip: {
					shared: "true"
				},
				title:{
					text: "Cluster "+(i+1),
					fontFamily: 'Roboto Mono',
					fontColor: '#fff',
					fontSize: 16
				},
				data: [
					{
						toolTipContent: '{name} : {y}',
						showInLegend: true,
						visible: true,
						type: 'spline',
						name: 'Guilds',
						color: '#d24cff',
						axisYIndex: 2,
						dataPoints: dpsGuilds[chartname]
					},
					{
						toolTipContent: '{name} : {y}',
						showInLegend: true,
						visible: true,
						type: 'spline',
						name: 'Users',
						color: '#fff',
						axisYIndex: 1,
						dataPoints: dpsUsers[chartname]
					},
					{
						toolTipContent: '{name} : {y}',
                        showInLegend: true,
						visible: true,
						type: 'spline',
						name: 'Streams',
						color: '#ff0000',
						axisYIndex: 0,
						dataPoints: dpsVc[chartname]
					},
					{
						toolTipContent: '{name} : {y}MB',
                        showInLegend: true,
						visible: true,
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
                        showInLegend: true,
						visible: true,
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
						interval: 5,
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
					},
					//guilds
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
	function toggleDataSeries(e) {
		if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible ){
			e.dataSeries.visible = false;
		} else {
			e.dataSeries.visible = true;
		}
		rendercharts();
	}
	var updatechart = function(data, rend) {
		var statdiv = $('.stats-total-table');
        statdiv.empty();
        $('<tr>').append(
			$('<th>').text(''),
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
			$('<td>').text(''),
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
				$(item.guilds > 0 ? '<td style=color:lightgreen>' : '<td style=color:red>').text('●'),
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
			dpsGuilds[clustername].push({
				x: xindex,
				y: cluster.guilds
			});
			if (dpsUsers[clustername].length > 100) {
				dpsUsers[clustername].shift();
				dpsVc[clustername].shift();
				dpsRam[clustername].shift();
				dpsCpu[clustername].shift();
				dpsGuilds[clustername].shift();
			}
		})
		if (rend) {
			rendercharts();
		}
	}
</script>
