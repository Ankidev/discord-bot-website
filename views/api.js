<script>
	$( document ).ready(function() {
		$('.sidebar-icon-radius').click(function() {
			var ID = $(this).attr('data-attribute');
			$.ajax({ 
				type: 'GET', 
				url: '/api/guilds/?id='+ID, 
				dataType: 'json',
				success: function (data) {
					$('.server-info').empty();
					if (!data) { return; }
					console.log(JSON.stringify(data, null, 2))
					$('.server-info').append(
						$('<pre>').text(JSON.stringify(data, null, 2))
					);
				}
			});
		});
	});
</script>
