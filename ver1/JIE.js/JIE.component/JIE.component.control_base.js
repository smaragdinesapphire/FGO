JIE.component.control_base = function () {
    this._myself = document.createElement("div");
    this.prepareNode(this._myself);
};
JIE.component.control_base.prototype = {
    prepareNode: function () {},
    hide: function () {
        this._myself.style.display = "none";
    },
    show: function () {
        this._myself.style.display = "";
    },
    render: function (node_to_append) {
        try {
            node_to_append.appendChild(this._myself);
        } catch (e) {
            if (JIE.debug) {
                alert("render() can't render in to node_to_append");
            }
        }
    },
    unrender: function (parent) {
        try {
            parent.removeChild(this._myself);
        } catch (e) {
            if (JIE.debug) {
                alert("unrender() can't unrender");
            }
        }
    },
    add_class_name: function (name) {
        this._myself.classList.add(name);
    },
    remove_class_name: function (name) {
        this._myself.classList.remove(name);
    },
    change_class_name: function (name) {
        this._myself.className = name;
    },
    constructor: JIE.component.control_base.prototype.constructor
};