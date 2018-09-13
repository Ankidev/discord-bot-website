	function selectTable(category) {
		if ($('#selector-' + category).hasClass('is-active')) {
			return;
		}
		$('[id^=selector-]').removeClass('is-active')
		$('#selector-' + category).addClass('is-active');

		$('[id^=category-]').fadeOut(0);
        $('#category-' + category).fadeIn(250);

        window.location.hash = '#'+category
	}
	$( document ).ready(function() {
	    var startCategory = (window.location.hash.substring(1) == '!' ? 'General' : window.location.hash.substring(1)) || 'General';
		selectTable(startCategory)
	});
	$('[id^=selector-]').click(function() {
		selectTable($(this).attr('id').split('-')[1])
    });
