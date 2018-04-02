JIE.base = {
    marge: function (obj1, obj2) {
        if (obj1 !== null && typeof obj1 === "object" &&
            obj2 !== null && typeof obj2 === "object") {
            for (var key in obj2) {
                obj1[key] = obj2[key];
            }
        } else if ((obj1 == null || typeof obj1 !== "object") &&
                   obj2 !== null && typeof obj2 === "object") {
            if (JIE.isDebug) console.log("Arguments[0] is not object.");
        } else if (obj1 !== null && typeof obj1 === "object" &&
                  (obj2 === null || typeof obj2 !== "object")) {
            if (JIE.isDebug) console.log("Arguments[1] is not object.");
        } else {
            if (JIE.isDebug) console.log("Arguments are not object.");
        }
    },
    margeDeep: function (child, parent) {
        var i,
            toStr = Object.prototype.toString,
            astr = "[object Array]";

        child = child || {};

        for (i in parent) {
            if (typeof parent[i] === "object") {
                if (child[i] === undefined) {
                    child[i] = (toStr.call(parent[i]) === astr) ? [] : {};
                }
                JIE.base.margeDeep(child[i], parent[i])
            } else {
                child[i] = parent[i];
            }
        }
    },
    NewObj: function (tagName, className, content) {
        if (tagName) {
            var element = document.createElement(tagName);
            if (className) element.className = className;

            if (content) {
                if (typeof content === "string" || typeof content === "number") {
                    element.textContent = content;
                } else {
                    element.appendChild(content);
                }
            }
            return element;
        }
    },
    isFunction: function (functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    },
    isEmpty: function (o) {
        if (o instanceof Array || o instanceof Object) {
            var isEmpty = true;
            for (key in o) {
                isEmpty = false;
                break;
            }
            return isEmpty;
        }
    },
    sortWithIndeces: function (toSort) {
        var i,
            length = toSort.length,
            tmpObj = new Array(length),
            obj = {};

        obj.value = new Array(length);
        obj.index = new Array(length);

        for (i = 0, length = toSort.length; i < length; i++) {
            tmpObj[i] = { value: toSort[i], index: i };
        }
        tmpObj.sort(function (a, b) {
            return a.value - b.value
        });

        for (i = 0; i < length; i++) {
            obj.value[i] = tmpObj[i].value;
            obj.index[i] = tmpObj[i].index;
        }

        return obj;
    },
    /*
    inherit: function (obj1, obj2, proto) {
        obj1.prototype = obj2.prototype;
        for (var key in proto) {
            obj1.prototype[key] = proto[key];
        }
    },
    */
    inherit: (function () {
        var F = function () { },
            key;
        return function (C, P, proto) {
            F.prototype = P.prototype;
            C.prototype = new F();
            C.uber = P.prototype;
            C.prototype.constructor = C;
            for ( key in proto) {
                C.prototype[key] = proto[key];
            }
        }
    }()),
    extend: function (child, parent) {
        var i;
        child = child || {};
        for (i in parent) {
            if (parent.hasOwnProperty(i)) {
                child[i] = parent[i];
            }
        }
        return child;
    },
    extendDeep: function (child, parent) {
        var i,
            toStr = Object.prototype.toString,
            astr = "[object Array]";

        child = child || {};

        for (i in parent) {
            if (parent.hasOwnProperty(i)) {
                if (typeof parent[i] === "object") {
                    child[i] = (toStr.call(parent[i]) === astr) ? [] : {};
                    JIE.base.extendDeep(child[i], parent[i])
                } else {
                    child[i] = parent[i];
                }
            }
        }
        return child;
    }
};

if (typeof NewObj === "undefined" || !NewObj) {
    NewObj = JIE.base.NewObj;
}