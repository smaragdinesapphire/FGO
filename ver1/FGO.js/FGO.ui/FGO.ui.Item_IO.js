FGO.ui.Item_IO = function (options) {
    var me = this;

    this.options = {
		mode: "input",
		className: "item_input",
		items: []
	};
	JIE.base.marge(this.options, options);

	this._mode = this.options.mode;
	this._items = this.options.items;
	this._className = this.options.className;
	this._table = new JIE.component.Grid();
	this._table.add_row();
	this._inputBox = [];
	this._items_result = {};
	this._create_table = false;

	for (var index in this._items) {
	    this._items_result[this._items[index]] = null;
	}

	this.onChange = new JIE.event.Publisher("change", this);

	this.onChange.subscribe(function (type, args) {
	    if (args[0].key) {
	        me._items_result[args[0].key] = args[0].value;
	    }
	});
};

FGO.ui.Item_IO.prototype = {
    set_items: function (arr) {
        if (Array.isArray(arr)) {
            //this._items = arr;
            this._items_result = {};
            for (var index in arr) {
                this._items_result[arr[index]] = null;
            }
        }
    },
    clear_all: function () {
        this._table.clear_all();
        this._table.clear_header();
    },
    set_mode: function (mode) {
        this._mode = mode;
        for (var i in this._inputBox) {
            this._inputBox[i].set_mode(mode);
        }
    },
    render: function (node_to_append) {
        if (!this._create_table) {
            if (this._items_result) {
                var key, me = this, input;
                for (key in this._items_result) {
                    input = JIE.component.input.factory("Number");
                    input.set_mode(this._mode);
                    this._inputBox.push(input);

                    this._table.add_header({ text: key });
                    this._table.add_contant(0, input);

                    input.onChange.subscribe(function (type, args) {
                        me.onChange.fire((function (key) {
                            return { key: key, value: args[0] };
                        }(key)));
                    });
                }
            }
            this._create_table = true;
        }
        this._table.render(node_to_append);
    },
    unrender: function (parent) {
        this._table.unrender(parent);
    },
    get_list: function () {
        return JIE.base.extend({}, this._items_result);
    },
    get_value: function (key) {
        return this._items_result[key];
    },
    constructor: FGO.ui.Item_IO.prototype
};

