/*
 * 各種dialog
 */
JIE.component.Dialog = function () {
    this.onChick = new JIE.event.Publisher("chick", this);
    this.onClose = new JIE.event.Publisher("close", this);
    this.onReset = new JIE.event.Publisher("reset", this);

    JIE.component.Dialog.uber.constructor.call(this);
};
JIE.base.inherit(JIE.component.Dialog, JIE.component.Control_base, {
    prepareNode: function (myself) {
        var me = this;
        this._body = myself;
        var mask = NewObj("div", "mask");
        var dialog = NewObj("div", "dialog");
        var header = NewObj("div", "header");
        this._title = NewObj("div", "title");
        header.appendChild(this._title);
        var close_icon = NewObj("div", "close_icon", "X");
        close_icon.onclick = function () {
            me.onClose.fire(this);
            me.hide();
        };
        header.appendChild(close_icon);
        this._container = NewObj("div", "container");
        dialog.appendChild(header);
        dialog.appendChild(this._container);
        mask.appendChild(dialog);
        myself.appendChild(mask);
        //myself.appendChild(dialog);
        myself.className = "JIE_dialog";
    },
    set_title: function (string) {
        this._title.innerText = string;
    },
    set_content: function (obj) {
        if (!obj) return;
        while (this._container.firstChild) {
            this._container.removeChild(this._container.firstChild);
        }
        if (typeof obj.render === "function") {
            obj.render(this._container);
        } else {
            this._container.appendChild(obj);
        }
    }
});

JIE.component.Dialog.factory = function (type) {
    var constr = type, new_dialog;

    if (typeof JIE.component.Dialog[constr] !== "function") {
        if (JIE.debug) {
            alert("JIE.component.Dialog.factory: dialog argument " + constr + " is fall.");
        }
    }

    new_dialog = new JIE.component.Dialog[constr]();
    return new_dialog;
}

JIE.component.Dialog.simple = function () {
    JIE.component.Dialog.simple.uber.constructor.call(this);
    this.add_class_name("simple");
};
JIE.base.inherit(JIE.component.Dialog.simple, JIE.component.Dialog);
