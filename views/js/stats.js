<script>
$( document ).ready(function() {
	var dpsUsers = [];
	var dpsVc = [];
	var dpsCpu = [];
	var dpsRam = [];
	var dpsGuilds = [];
	var chart = new CanvasJS.Chart('chartContainer1', {
		backgroundColor: null,
		legend:{
			cursor:"pointer",
			fontColor: "#ccc",
			itemclick : toggleDataSeries
		},
/*
		toolTip: {
			shared: "true"
		},
		title:{
			text: "Stats Graph",
			fontFamily: 'Roboto Mono',
			fontColor: '#fff',
			fontSize: 16
		},
*/
		data: [
			{
				toolTipContent: '{name} : {y}',
				showInLegend: true,
				visible: true,
				type: 'spline',
				name: 'Guilds',
				color: '#d24cff',
				axisYIndex: 2,
				dataPoints: dpsGuilds
			},
			{
				toolTipContent: '{name} : {y}',
				showInLegend: true,
				visible: true,
				type: 'spline',
				name: 'Users',
				color: '#ccc',
				axisYIndex: 1,
				dataPoints: dpsUsers
			},
			{
				toolTipContent: '{name} : {y}',
				showInLegend: true,
				visible: true,
				type: 'spline',
				name: 'Streams',
				color: '#ff0000',
				axisYIndex: 0,
				dataPoints: dpsVc
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
				dataPoints: dpsRam,
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
				dataPoints: dpsCpu,
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
				maximum: 32000
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
	chart.render();
	var socket = io({ transports: ['websocket'] });
	socket.on('statstart', function(historicaldata) {
		var credits = document.getElementsByClassName('canvasjs-chart-credit');
		for(var i = 0; i < credits.length; i++){
			credits[i].innerText = '';
		}
		historicaldata.forEach(function(data){
			updatechart(data, false);
		});
		chart.render();
	});
	socket.on('stats', function(data) {
		updatechart(data, true);
	});
	function newColor(color) {
		chart.data[1].options.color = color;
		chart.legend.options.fontColor = color;
		chart.render();
	}
 	function toggleDataSeries(e) {
		if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible ){
			e.dataSeries.visible = false;
		} else {
			e.dataSeries.visible = true;
		}
		chart.render();
	}
	var xindex = 0;
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
		dpsUsers.push({
			x: xindex,
			y: data.users
		});
		dpsVc.push({
			x: xindex,
			y: data.totalVoiceConnections
		});
		dpsRam.push({
			x: xindex,
			y: Math.floor(data.totalRam)
		});
		dpsCpu.push({
			x: xindex,
			y: data.totalCpu
		});
		dpsGuilds.push({
			x: xindex,
			y: data.guilds
		});
		if (dpsUsers.length > 150) {
			dpsUsers.shift();
			dpsVc.shift();
			dpsRam.shift();
			dpsCpu.shift();
			dpsGuilds.shift();
		}
		if (rend) {
			chart.render();
		}
	}
});
</script>
