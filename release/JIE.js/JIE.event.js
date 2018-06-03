JIE.event = {};

JIE.event.Publisher = function (type, me) {
    this._me = me;
    this._type = type || "costum_event";
    this._array = [];
    this._length = 0;
};

JIE.event.Publisher.prototype = {
    subscribe: function (callback) {
        if (typeof callback === "function") {
            this._array.push(callback);
            this._length += 1;
        }
    },
    unsubscribe: function (callback) {
        /*
        var i, first_part, last_part,
            last_index = this._length - 1;
        for (var i in this._array) {
            if (this._array[i] === callback) {
                if (i > 0) {
                    first_part = this._array.slice(0, i);
                    
                    if (i !== last_index) {
                        last_part = this._array.slice(i + 1);
                        this._array = first_part.concat(last_part);

                    
                    } else {
                        //i is the last on
                        this._array = first_part;
                    }

                } else {
                    //i is the firt index
                    first_part = this._array.slice(1, i);
                    this._array = first_part.concat(this._array.slice(i + 1));
                }
                this._length -= 1;
                break;
            }
        }
        */
        JIE.array.delete_target(this._array, callback);
        this._length = this._array.length;
    },
    clear_all_subscribe: function () {
        this._array.length = this._length = 0;
    },
    fire: function () {
        for (var i in this._array) {
            this._array[i](this._type, arguments);
        }
    }
};

JIE.event.listener = {
    add: function (element, event, fn) {
        if (document.addEventListener) {
            element.addEventListener(event, fn, false);
        } else if (document.attachEvent) {
            element.attachEvent("on" + event, fn);
        } else {
            element["on" + event] = fn;
        }
    },
    remove: function (element, event, fn) {
        if (document.removeEventListener) {
            element.removeEventListener(event, fn, false);
        } else if (document.detachEvent) {
            element.detachEvent("on" + event, fn);
        } else {
            element["on" + event] = null;
        }
    }
};