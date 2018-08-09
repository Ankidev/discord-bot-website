<script>
	$( document ).ready(function() {
		$('.sidebar-icon-radius').click(function() {
			var ID = $(this).attr('data-attribute');
			$.ajax({ 
				type: 'GET', 
				url: '/api/guilds/'+ID, 
				dataType: 'json',
				success: function (data) { 
					$('.server-info').empty();
					if (!data || data.error) { return; }
					//something with the data
				}
			});
		});
	});
</script>
