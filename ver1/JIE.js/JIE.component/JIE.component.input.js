/*
 * 用來限制input格式的factory模式
 */

JIE.component.input = function () {
    this.onError = new JIE.event.Publisher("error", this);
    this.onChange = new JIE.event.Publisher("change", this);

    JIE.component.input.uber.constructor.call(this);
};

JIE.base.inherit(JIE.component.input, JIE.component.control_base, {
    prepareNode: function (myself) {
        var me = this;
        this._body = myself;
        this._input = NewObj("div", "input");
        this._view = NewObj("div", "view");
        this._value = 0;
        //this._tmp = "";
        this._default_value = 0;
        this._mode = "input";

        myself.appendChild(this._input);
        //myself.appendChild(this._view);

        myself.className = "input_box";
        this._input.setAttribute("contenteditable", true);

        this._input.obj = this;
        //this._input.textContent = this._value = this._tmp = 0;
        this._input.textContent = this._default_value;

        this._input.onkeydown = function () {
            if (!me.set_value()) {
                return false;
            }
        };

        //JIE.event.listener.add(this._input, "keydown", function (e) {
        //    me.set_value(event.key);
        //});
        JIE.event.listener.add(this._input, "focus", function () {
            //me._input.textContent = me._tmp = "";
            me._input.textContent = "";
        });
        JIE.event.listener.add(this._input, "blur", function () {
            var text = me._input.textContent;
            if (text === "") {
                me._input.textContent = me._value;
            } else {
                if (me._value !== text) {
                    me._value = text;
                    me.onChange.fire(Number(text));
                }
            }
            //if (me._tmp === "") {
            //    me._input.textContent = me._value;
            //}
            //else {
            //    var tmp = Number(me._tmp);
            //    //if (me._input.textContent !== tmp) {
            //        me._input.textContent = me._value = tmp;
            //        me.onChange.fire(tmp);
            //    //}
            //}

        });
    },
    get_value: function () {
        return this._value;
    },
    set_value: function (value) {
        if (this._modify) {
            var obj = this._modify(value);
            if (obj) {
                this._input.textContent = this._value = obj.value;  //keyin or input
                return true;
            } else {
                event.cancelBubble = true;
                event.returnValue = false;
                return false;
            }
        } else {
            this._input.textContent = this._value = value;  //keyin or input
            return true;
        }
    },
    reset: function () {
        this._input.textContent = this._value = this._default_value;
    },
    set_mode: function (mode) {
        if (typeof mode === "string") {
            var tmp = mode.toLocaleLowerCase();
            switch (tmp) {
                case "input":
                    if (this._mode === "view") {
                        this._body.appendChild(this._input);
                        this._body.removeChild(this._view);
                        this._mode = "input";
                    }
                    break;
                case "view":
                    if (this._mode === "input") {
                        this._view.textContent = this._input.textContent;
                        this._body.appendChild(this._view);
                        this._body.removeChild(this._input);
                        this._mode = "view";
                    }
                    break;
                default:
            }
        }
    }
})

JIE.component.input.factory = function (type) {
    var constr = type,
        new_input;

    if (typeof this.factory[constr] !== "function") {
        if (JIE.debug) {
            alert("JIE.component.input.factory: input argument " + constr + " is fall.");
        }
    }

    new_input = new JIE.component.input[constr]();
    return new_input;
};

/*
 * 限制只能輸入>=0的整數
 * 
 * @function JIE.component.input.Number
 */
JIE.component.input.Number = function () {
    JIE.component.input.Number.uber.constructor.call(this);
    this._regexp = /[^0-9]/;
}
JIE.base.inherit(JIE.component.input.Number, JIE.component.input);
JIE.component.input.Number.prototype._modify = function (value) {
    var val = value;

    if (event) {    //若為事件輸入時

        if (event.key && event.key.length === 1) {
            if (this._regexp.test(event.key)) {
                //event.cancelBubble = true;
                //event.returnValue = false;
                return false;
            } else {
                val = event.key;
            }
        } else {
            if (event.pointerType !== "mouse" && event.keyCode !== 8) return false;
            //if (event.keyCode !== 8) {
            //    //event.cancelBubble = true;
            //    //event.returnValue = false;
            //    return false;
            //}
        }
    } else {        //函數輸入時
        if (this._regexp.test(value)) {
            //event.cancelBubble = true;
            //event.returnValue = false;
            return false;
        }
    }

    this._tmp = val;

    //if (event.keyCode === 13 || this._regexp.test(value)) {
    //    event.cancelBubble = true;
    //    event.returnValue = false;
    //    return false;
    //} else {
    ////if (this._regexp.test(value)) {
    ////    this._input.textContent = this._tmp;
    ////    this.onError.fire();
    ////} else {
    //    //this._input.textContent = this._tmp = value;
    //    this._tmp = value;
    //}
    return { value: Number(this._tmp) };
};

/*
 *限制只能輸入>=0的整數，多了能上下調整的功能
 * 
 * @function JIE.component.input.Number_lift
 */
JIE.component.input.Number_lift = function () {

    JIE.component.input.Number_lift.uber.constructor.call(this);
};
JIE.base.inherit(JIE.component.input.Number_lift, JIE.component.control_base, {
    prepareNode: function (myself) {
        var up_btn   = NewObj("div", "up", "▲"),
            down_btn = NewObj("div", "down", "▼"),
            me = this;

        this._body = myself;
        this._input = JIE.component.input.factory("Number");

        this._input.render(this._body);
        this._body.appendChild(up_btn);
        this._body.appendChild(down_btn);

        JIE.event.listener.add(up_btn, "click", function () {
            me._input.set_value(me._input.get_value() + 1);
        });
        JIE.event.listener.add(down_btn, "click", function () {
            var value = me._input.get_value();
            if (value !== 0) me._input.set_value(me._input.get_value() - 1);
        });
    },
    get_value: function () {
        return this._input.get_value();
    },
    set_value: function (value) {
        this._input.set_value(value);
    },
    reset: function () {
        this._input.reset();
    },
});