// JavaScript Document


/*
	
// **********************************************************************************
// *	Default
	$("#resetdims").click( function () {
		$("#PanelHeight").val(400);
		$('#marksNo').val(2);
	}); 
	
	$('#resetkeys').click( function () {
		$('.key').html('Q');
		$('.hkey').toggleClass('hkey_in_use',false);
		$('.hkey').first().toggleClass('hkey_in_use',true);
		$('.change').toggleClass("hkey_in_use", false);
		$(document).unbind('keydown');
		$('#info').html('1');
		newset();
	});
	
	$('#resetmouse').click( function () {
		$('#leftclick').val(0);
		$('#middleclick').val(1);
		$('#rightclick').val(1);
	});

	$('#resetbackground').click( function () {
		$('#preview').css('background','url(../images/background.jpg) center no-repeat');
		$('#preview').attr('image', 'default');
	});

// ********************************************************************************** 
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

// **********************************************************************************
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

/*******************
 *	Panel Background
 *******************/	

window.onload = function () {
	LoadBackground.load();	
}


var LoadBackground = function() {
	
	var _load_img;
	var _preview;
	var _upload;
	var _image;

	function listen() {
		_load_img = document.getElementById("load_img");
		_preview = document.getElementById("preview");
		_upload = document.getElementById("browse_img");
		
		_load_img.onclick = getImage; 
	}
	
	function getImage() {
		_upload.click();
		_upload.onchange = function (e) {
			
			e.preventDefault();
			
			var file = _upload.files[0];
			
			if ( file.type.slice(0,5) == 'image' ) {
				
				var reader = new FileReader();
				
				reader.onload = function (event) {
					_preview.style.background = 'url(' + event.target.result + ') center no-repeat';
					_preview.style.backgroundSize = 'contain';
					_preview.style.height = 200 + 'px';
					_image = event.target.result;
				};
	
				reader.readAsDataURL(file);
			}
			
			return false;
		};
		
	}
	
	return {
		load : listen
	}
	
}();














