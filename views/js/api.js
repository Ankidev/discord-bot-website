<script type="text/javascript">
	$( document ).ready(function() {

		//getting info for a server
		$('.sidebar-icon-radius').click(function() {
			var ID = $(this).attr('data-attribute');
			var token = $('#csrf').attr('value');  //use this for POSTS in other requests
			$.ajax({
				type: 'GET',
				url: '/api/guilds/'+ID,
				dataType: 'json',
				success: function (data) {
					$('.server-info').empty();
					if (!data) { return; }
					//console.log(data)
					$.each(Object.keys(data.settings), function (i, item) {
						if(data.settings[item]) {
			                var setting = ('<ul>' + item + ': ' + data.settings[item] + '</ul>');
			                $('.server-info').append(setting);
						}
		            });
				}
			});
		});

	});
</script>
