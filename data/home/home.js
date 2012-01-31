// JavaScript Document

$(document).ready( function () {
// *	Increment and decrement buttons	
	$('.minus').click( function(e) {
		var val = parseInt( $(this).next().html() );
		if (val >= 250 )
			$(this).next().html(val - 25);
	});
	
	$('.plus').click( function() {
		var val = parseInt( $(this).prev().html() );
		if (val <= 625 )
			$(this).prev().html(val + 25);
	});

// *	Select special keys

	$('.hkey').click( function() {
		var val = parseInt ( $('#info').html() );
		var cval = parseInt ( $(this).attr('val') );
		if ($(this).hasClass("hkey_in_use")) {
			val = val - cval;
			op = 1;
		}
		else {
			val = val + cval;
			op = -1;
		}

		$(this).toggleClass("hkey_in_use");
		if (val == 0 || val == 4 ) {
			val = val + op * cval;
			$(this).toggleClass("hkey_in_use");
		}
		$('#info').html(val);
		newset();
	});	
	
// *	Change hotkey A - Z
	$('.change').click( function(){
		if ( $(this).hasClass("hkey_in_use") == true )
			$(document).unbind('keydown');
		else {
			$(document).keydown( function (e) {
				e.preventDefault();
				e.stopPropagation();
				if (e.which > 64 && e.keyCode < 91 ) {
					$('.key').html(String.fromCharCode(e.which));
					$(document).unbind('keydown');
					$('.change').toggleClass("hkey_in_use", false);
					newset();
				}
			});
		}
		$(this).toggleClass("hkey_in_use");
	});	

// *	New set to save
	function newset () {
		var combo = "";
		$('.hkey').each(function(index, element) {
			if ($(this).hasClass('hkey_in_use'))
				combo = combo + $(this).html() + "+";	
		});
		combo = "New set to save :" + combo + ' ' +$('.key').html();
		$('.newset').html(combo);
	}

// *	Default
	$(".resetpanel").click( function () {
		$('.value').first().html('300'); 
		$('.value').last().html('400'); 
	});
	
	$('.resetkeys').click( function () {
		$('.key').html('Q');
		$('.hkey').toggleClass('hkey_in_use',false);
		$('.hkey').first().toggleClass('hkey_in_use',true);
		$('.change').toggleClass("hkey_in_use", false);
		$(document).unbind('keydown');
		$('#info').html('1');
		newset();
	});

// *	Personalize your panel
	var upload = document.getElementById('browse');
	$('.open').click( function () {
		$('#browse').click();
	});
	upload.onchange = function (e) {
		e.preventDefault();
		var file = upload.files[0];
		if ( file.type.slice(0,5) == 'image' ) {
			var reader = new FileReader();
			reader.onload = function (event) {
				var preview = $('.preview');
				preview.css('background','url('+event.target.result+') center no-repeat');
				preview.attr('image',event.target.result);
				preview.css("background-size",'contain');
			};
			reader.readAsDataURL(file);
		}
		return false;
	};

// *	Set the transparency	
	$('.tminus').click( function(e) {
		var val = parseInt( $(this).next().html() );
		if (val >= 10 )
			$(this).next().html(val - 10 + " %");
	});
	
	$('.tplus').click( function() {
		var val = parseInt( $(this).prev().html() );
		if (val <= 90 )
			$(this).prev().html(val + 10 + " %");
	});

// *	Apply buttons	
	$('#apply').click( function () {
		if ($('.change').hasClass("hkey_in_use") == true ) {
			$('.change').toggleClass("hkey_in_use",false);
			$(document).unbind('keydown');
		}
		$('.currentdim').html( $('.value').first().html() +" width * "+  $('.value').last().html() + " height");
	});

});