/*
 * Pretty Print - JavaScript Object Log
 */

"use strict";

var PrettyPrint = {

    indent : [],
    indent_type : '    ',
    ecapsulate : function (val) {
        return '\'' + val + '\'';
    },
    logStartObj : function (Obj) {
        console.log(this.indent.join('') + this.ecapsulate(Obj) + ' : {');
        this.indent.push(this.indent_type);
    },
    logEndObj : function () {
        PrettyPrint.indent.pop();
        console.log(this.indent.join('') + '}');
    },
    logKeyValue : function (key, value) {
        var keyValue = this.ecapsulate(key) + ' : ' + this.ecapsulate(value);
        console.log(this.indent.join('') + keyValue);
    },
    log : function (Obj, recursive) {

    	recursive = typeof recursive !== 'undefined' ? recursive === true : false;

        if (PrettyPrint.indent.length == 0) {
            PrettyPrint.indent.push(PrettyPrint.indent_type);
            console.log('{');
        }

        for (var key in Obj) {
            if (Obj.hasOwnProperty(key) == true && typeof(Obj[key]) !== 'function' )  {
                if (typeof(Obj[key]) === 'object' && recursive) {
                    PrettyPrint.logStartObj(key);
                    PrettyPrint.log(Obj[key]);
                }
                else
                    PrettyPrint.logKeyValue(key, Obj[key]);
            }
        }
        PrettyPrint.logEndObj();
    }
}


exports.log = PrettyPrint.log;



