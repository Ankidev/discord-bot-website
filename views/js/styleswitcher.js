<script type='text/javascript'>
function setActiveStyleSheet(title) {
  var i, a, main;
  for(i=0; (a = document.getElementsByTagName("link")[i]); i++) {
    if(a.getAttribute("rel").indexOf("style") != -1 && a.getAttribute("title")) {
      a.disabled = true;
      if(a.getAttribute("title") == title) {
        a.disabled = false;
		$.cookie("style", title, { path: '/', expires: 7 });
      }
    }
  }
}

function togglestyle() {
	var title = $.cookie("style");
	if(title == 'light') {
		setActiveStyleSheet('dark')
	} else {
		setActiveStyleSheet('light')
	}
	setGraphLine();
}

function setGraphLine() {
	if ($('#chartContainer1').length >= 1 && $.cookie("style")) {
		if ($.cookie("style") == 'dark') {
			newColor('#fff');
		} else {
			newColor('#000');
		}
	}
}

$( document ).ready(function() {
	setGraphLine();
	var button = document.getElementById('styleswitcher');
	button.onclick = function() {
		togglestyle();
	};
});
</script>
