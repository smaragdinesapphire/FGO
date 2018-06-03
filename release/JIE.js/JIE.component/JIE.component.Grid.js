JIE.component.Grid = function (options) {
	this.options = {
		className: "grid"
	};
	JIE.base.marge(this.options, options);
	this._header = null;
	this._sortable_header = [];
	this._row_box = [];
	this._row = 0;
	this._column = 0;
	JIE.component.Grid.uber.constructor.call(this);
};
JIE.base.inherit(JIE.component.Grid, JIE.component.control_base, {
    prepareNode: function (myself) {
        var me = this;
		this._body = myself;
		this._body.className = this.options.className;

		this._header = new JIE.component.Grid_row({ className: "header", click_event: true });

		this._header.onClick.subscribe(function (type, args) {
		    if (args[0].target.className === "desc") {
		        args[0].target.className = "asc";
		        me._sort({ type: "asc", sequence: args[0].sequence });
		    } else {
		        args[0].target.className = "desc";
		        me._sort({ type: "desc", sequence: args[0].sequence });
		    }
		});

		this._header.render(this._body);
	},
	add_header: function (data) {
		var default_data = {
			text: "",
			sort: false
		};
		JIE.base.marge(default_data, data);

		if (default_data.sort) {
			var div = document.createDocumentFragment(),
				desc_btn = NewObj("div", "desc", "▼"),	//降序
				asc_btn  = NewObj("div", "asc", "▲"),
				btn_div  = NewObj("div", "btn"),
				text_div = NewObj("div", "text", data.text);

			desc_btn.style.display = "none";

			btn_div.appendChild(asc_btn);
			btn_div.appendChild(desc_btn);
			div.appendChild(text_div);
			div.appendChild(btn_div);
			this._header.add(div);
			this._sortable_header.push(default_data);
		} else {
			this._header.add(default_data.text);
		}
		this._column += 1;
	},
    /*
     * @function add_row
     * @return {Number} this._row 該row的index
     */
	add_row: function () {
	    var row = new JIE.component.Grid_row();
	    row.render(this._body);
	    this._row_box.push(row);
	    this._row += 1;
	    return this._row - 1;
	},
    /*
     * @function add_contant
     * @param [Number] index 為row的index
     * @param [Object] data  為放入row的資料
     */
	add_contant: function (index, data) {
	    if (this._row_box && this._row_box[index]) this._row_box[index].add(data);
	},
    /*
     * @function set_contant
     * @param [Number] index 為row的index
     * @param [Object] data  為放入row的資料
     */
	set_contant: function (r_index, c_index, data) {
	    this._row_box[r_index].set(c_index, data);
	},
	clear_row: function (r_index) {
	    if (r_index && this._row_box[r_index] && this._row_box[r_index].unrender) this._row_box[r_index].unrender(this._body);
	},
	clear_all: function () {
	    this._body.innerHTML = "";
	    this._row_box = [];
	},
	clear_header: function () {
	    this._header.unrender(this._body);
	    this._header = null;
	},
	render: function (node_to_append) {
	    var i, i_max = this._row_box.length, tmp;

	    for (i = 0; i < i_max; i++) {
	        tmp = this._row_box[i].get_length();
	        while (tmp < this._column) {
	            this._row_box[i].add("");
	            tmp += 1;
	        }
	        while (tmp > this._column) {
	            this._row_box[i].remove_last();
	            tmp -= 1;
	        }
	        this._row_box[i].render(this._body);
	    }
	    JIE.component.Grid.uber.render.call(this, node_to_append);
	},
	_sort: function (data) {
	    //data is { type = "desc" or "asc", 
	    //          sequence: seq }
	    var i, i_max = this._row, data_arr = [], sequence = data.sequence, cop;

	    //get value

	    for (i = 0; i < i_max; i++) {
	        this._row_box[i].unrender(this._body);
            /*
	        data_arr.push({
	            value: (this._row_box[i].get(sequence).textContent + "").charCodeAt(0),
                index: i
	        });
            */
	        data_arr.push((this._row_box[i].get(sequence).textContent + "").charCodeAt(0));
	    }

	    data_arr = JIE.base.sortWithIndeces(data_arr);

	    if (data.type === "desc") {
	        //data_arr.value.reverse();
	        data_arr.index.reverse();
	    }

	    for (i = 0; i < i_max; i++) {
	        this._row_box[data_arr.index[i]].render(this._body);
	    }
	}
});


JIE.component.Grid_row = function (options) {
	this.options = {
	    className: "row",
	    click_event: false
	};
	JIE.base.marge(this.options, options);
	this._div_arr = [];
	this._length = 0;
	this._body = null;
	//this._content = null;

	this.onClick = new JIE.event.Publisher("click", this);

	JIE.component.Grid_row.uber.constructor.call(this);
};
JIE.base.inherit(JIE.component.Grid_row, JIE.component.control_base, {
	prepareNode: function (myself) {
		this._body = myself;
		this._body.className = this.options.className;
		//this._content = NewObj(div);
		//this._body.appendChild(this._content);
	},
    /*
     * 新增一個表格至row內
     * 
     * @function add
     * @param [Object] obj 為要放入的內容
     */
	get_length: function () {
	    return this._length;
	},
	add: function (obj) {
		if (obj || obj === "") {
			var div = NewObj("div", "column_" + this._length),
				me = this,
			    error;
            /*
			if (typeof obj === "number" || typeof obj === "string") {
				div.textContent = obj;
			} else if (obj.render) {
				obj.render(div);
			} else {
				try {
					div.appendChild(obj);
				} catch (e) {
					if (JIE.debug) {
						alert("JIE.component.Grid_row.add(...) input is a wrong format.");
					}
					return;
				}
			}
            */
			error = !(this._append(div, obj));
			if (error) return;

			this._div_arr.push(div);
			this._body.appendChild(div);

			if (this.options.click_event) {
			    JIE.event.listener.add(div, "click", (function (seq) {
				    return function (e) {
					    me.onClick.fire({ target: e.srcElement || e.target, sequence: seq });
				    }
			    }(this._length)));
			}
			this._length += 1;
		}
	},
	get: function (index) {
	    return this._div_arr[index];
	},

    /*
     * 變更原先內容
     * 
     * @function add
     * @param {Number} index 為row中第幾個表格
     * @param {Object} obj   為要放入的內容
     */
	set: function (index, obj) {
	    if (obj && this._div_arr[index]) {
	        var div = this._div_arr[index];
            /*
	        while (div.hasChildNodes()) {
	            div.removeChild(div.childNodes[0]);
	        }
            */
	        div.innerHTML = null;
	        this._append(div, obj);
	    }
	},
	remove_last: function () {
	    this._length -= 1;
	    this._body.removeChild(this._div_arr[this._length]);
	    delete this._div_arr[this._length];
	},
    /*
     * 將內容放入表格內
     * 
     * @function _append
     * @param  {Element} div 要被放入的表格
     * @param  {Object}  obj 要被放的內容
     * @return {Boolean} 若無法加入內容則回傳fales
     */
	_append: function (div, obj) {
	    if (typeof obj === "number" || typeof obj === "string") {
	        div.textContent = obj;
	    } else if (obj.render) {
	        obj.render(div);
	    } else {
	        try {
	            div.appendChild(obj);
	        } catch (e) {
	            if (JIE.debug) {
	                alert("JIE.component.Grid_row.add(...) input is a wrong format.");
	            }
	            return false;
	        }
	    }
	    return true;
	}
});