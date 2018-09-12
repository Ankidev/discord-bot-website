	function selectTable(category) {
		$('[id^=selector-]').removeClass('is-active')
		$('#selector-' + category).addClass('is-active');

		$('[id^=category-]').hide();
        $('#category-' + category).show();

        window.location.hash = '#'+category
	}
	$( document ).ready(function() {
	    var startCategory = (window.location.hash.substring(1) == '!' ? 'General' : window.location.hash.substring(1)) || 'General';
		selectTable(startCategory)
	});
	$('[id^=selector-]').click(function() {
		selectTable($(this).attr('id').split('-')[1])
    });
