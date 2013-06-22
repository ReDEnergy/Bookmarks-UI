'use strict';

const NS_HTML = "http://www.w3.org/1999/xhtml";
const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

const windowUtils = require('sdk/window/utils');
const PP = require('prettyprint');


var win = windowUtils.getMostRecentBrowserWindow();
var doc = win.document;

function node(doc, ns, type, attrs, parent) {
	let ele = doc.createElementNS(ns, type);
	attrs && Object.keys(attrs).forEach(function(attr) {
		ele.setAttribute(attr, attrs[attr]);
	});
	parent && parent.appendChild(ele);
	return ele;
}

function $(id) { 
	doc.getElementById(id);
}

function draggable(handler, container) {

	var offset = { x : 0, y : 0 };

//	var handler = $(handlerID);
//	var container = $(containerID);

	handler.addEventListener('mousedown', dragStart);
	handler.addEventListener('mouseup'  , dragEnd);

	PP.log(handler.style);

	PP.log(offset);
	function dragStart(e) {
		// console.log("Drag Start");
		// console.log(e.clientX, e.clientY);
		// console.log("Container left", container.style.left);
		// console.log("Container top", container.style.top);

		offset.x = e.clientX - container.style.left;
		offset.y = e.clientY - container.style.top; 

		PP.log(offset);
		doc.addEventListener('mousemove', dragMove);
	}

	function dragEnd(e) {
		// console.log("Drag End");
		// PP.log(offset);
		doc.removeEventListener('mousemove', dragMove);
	}
	
	function dragMove(e) {
		container.style.left = e.clientX - 50  + "px"; //- offset.x + 'px';
		container.style.top = e.clientY - 50 + "px"; //- offset.y + 'px';
		//console.log(e.clientX, e.clientY);
		//PP.log(offset);
//		console.log(container.style.left);
	}

	function destroy() {
		
	}
	
	return {
		destroy: destroy
	}
}


function ChromeXUL(options) {
	
	let xul = node.bind(null, doc, NS_XUL);
	let html = node.bind(null, doc, NS_HTML);	

	var id = "red_chrome_xul";

	var overlay = xul("box", {id: id});
	var box = html("div", {id: id + "_box"}, overlay);

	overlay.style.top = "200px";
	overlay.style.left = "300px";
	
	new draggable(overlay, overlay);

	var chrome_element = doc.getElementById("browser");
	var parent = chrome_element.parentNode;
	parent.insertBefore(overlay, chrome_element);
	
	var dispaly_state = true;
	
	function show() {
		dispaly_state = true;
		overlay.style.display = "block";
		console.log("XUL UI ON");
		PP.log(overlay.style, true);
	}
	
	function hide() {
		dispaly_state = false;
		overlay.style.display = "none";
		console.log("XUL UI OFF");
	}
	
	return {
		show : show,
		hide : hide,
		toggle : function () {
			dispaly_state === true ? hide() : show();
		} 
	};
}

// Module exports
exports.ChromeXUL = ChromeXUL;





