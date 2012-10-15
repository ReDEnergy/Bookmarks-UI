// JavaScript Document

'use strict';
 
var x = document.getElementById("");

// x.removeAttribute("style");

var SelectKey;

window.onload = function () {
	LoadBackground.load();
	SelectKey = new DropDown("keyletter", "dropKey", Options);
	
}

var Options = function () {
	var value;
	
	function update () {
		console.log("Update Settings : Key = " + value);		
	}
	
	return {
		getValue : function (e) {
			var optionvalue = parseInt(e.target.getAttribute("value"));
			if (optionvalue >= 0 && optionvalue < 26) {
				value = String.fromCharCode(optionvalue + 65);
				update();
				return value;
			}
		},
		
		appendOptions : function (dropmenu) {
			for (var i=0; i<26; i++) {
				var option = document.createElement('div');
				option.textContent = String.fromCharCode(65 + i);
				option.setAttribute('value', i);
				dropmenu.appendChild(option);
			}
		}
	}
		
}();

function DropDown(selectId, dropmenuId, options) {
	var visbility2 = ["hidden", "visible"];
	var dropmenu = document.getElementById(dropmenuId);
	var select = document.getElementById(selectId);
	var state  = 0;
	
	var toggle = function () {
		state = 1 ^ state;
		dropmenu.style.opacity = state;
		dropmenu.style.visibility = visbility2[state];
	}

	var clickOut = function (e) {
		if (parseInt(dropmenu.style.opacity) === 1) {
			if (e.target === dropmenu)
				return;

			if (e.target !== select)
				toggle();
		}
	}

	var update = function (e) {
		if (e.target.className !== "dropdown") {
			select.textContent = options.getValue(e);
			toggle();
		}	}

	options.appendOptions(dropmenu);
	
	select.onclick = toggle;

	dropmenu.onclick = update;

	document.addEventListener('click', clickOut);

};












/*
var DropDown = function () {
	
	var dropmenu;
	var select;
	var	value;
	var optionvalue;
	
	var toggle = function () {
		dropmenu.style.opacity = 1 - parseInt(dropmenu.style.opacity);
	}
	
	var changeKey = function (e) {
		if (e.target.className !== "dropdown") {
			optionvalue = parseInt(e.target.getAttribute("value"));
			if (optionvalue >= 0 && optionvalue < 26) {
				value = String.fromCharCode(optionvalue + 65);
				select.textContent = value;
			}
			toggle();
		}
	}
	
	var appendOptions = function () {
		for (i=0; i<26; i++) {
			var option = document.createElement('div');
			option.textContent = String.fromCharCode(65 + i);
			option.setAttribute('value', i);
			dropmenu.appendChild(option);		
		}
	}

	// Public

	var init = function () {
		
		dropmenu = document.getElementById("dropKey");
		select = document.getElementById("keyletter");

		select.onclick = toggle;
		dropmenu.onclick = changeKey;
		dropmenu.style.opacity = 0;
		
		appendOptions();
	}
	
	var clickOut = function (e) {
		if (parseInt(dropmenu.style.opacity) === 1 && (e.target !== select)==true)
			toggle();
	}
	
	
	return {
		load : init,
		close : clickOut
	}
	
}();
*/




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














