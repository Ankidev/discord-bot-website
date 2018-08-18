<script type="text/javascript">
	function selectTable(category) {
		$('[id^=selector-]').removeClass('is-active')
		$('#selector-' + category).addClass('is-active');

		$('[id^=table-]').hide();
        $('#table-' + category).show();

        window.location.hash = '#'+category
	}
	$( document ).ready(function() {
	    var startCategory = window.location.hash.substring(1) || 'General';
		selectTable(startCategory)
	});
	$('[id^=selector-]').click(function() {
		selectTable($(this).attr('id').split('-')[1])
    });
</script>
