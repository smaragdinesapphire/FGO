/*
 * 這支程式可以產生各種元件
 */
FGO.component = {};
FGO.component.factory = function (type, options) {
    var constr = type,
        dom;

    if (typeof FGO.component[type] !== "function") {
        throw {
            name: "Error",
            message: constr + " doesn't exist"
        }
    }

    dom = new FGO.component[constr](options);

    return dom;
};

FGO.component.Item_grid = function (options) {

    this._options = {
        class_name: "item_grid",
        read_only: false
    };

    JIE.base.marge(this._options, options);

    this._class_name = this._options.class_name;
    this._read_only = this._options.read_only;

    this._header = null;
    this._content = null;
    this._body = null;
    this._row_list = {};
    this._item_list = {};
    this._language = null;
    FGO.component.Item_grid.uber.constructor.call(this);

    this.onClick = new JIE.event.Publisher("click", this);
};

JIE.base.inherit(FGO.component.Item_grid, JIE.component.Control_base, {
    prepareNode: function (myself) {
        this._body = myself;
        this._body.className = this._class_name;
        this._language = FGO.language_manager;
        this._header = NewObj("div", "header");
        this._row_list["header"] = {
            dom_list: {
                name: NewObj("div", "c1", this._language.get_word('アイテム')),
                quest: NewObj("div", "c2", this._language.get_word('クエスト')),
                count: NewObj("div", "c3", this._language.get_word('数量')),
                row: this._header
            },
            name: this._language.get_word('アイテム'),
            quest: this._language.get_word('クエスト'),
            count: this._language.get_word('数量')
        };

        this._header.appendChild(this._row_list["header"].dom_list.name);
        this._header.appendChild(this._row_list["header"].dom_list.quest);
        this._header.appendChild(this._row_list["header"].dom_list.count);


        myself.appendChild(this._header);
    },
    add_item: function (name) {
        var me = this;
        var count, row, button, input;

        button = NewObj("button", "button", "?");
        button.value = name;

        this._row_list[name] = {
            dom_list: null,
            name: name,
            quest: button,
            count: null,
        };

        this._item_list[name] = 1;

        if (!this._read_only) {
            input = FGO.component.factory("Num_input", { min: 0, max: 99999 });
            count = NewObj("div", "c3");
            input.render(count);
            this._row_list[name].count = input;
        } else {
            count = NewObj("div", "c3", "");
            //this._row_list[name].count = count;
        }

        row = NewObj("div");
        //row.appendChild(NewObj("div", "c1", name));
        //row.appendChild(NewObj("div", "c2", button));
        //row.appendChild(count);
        this._body.appendChild(row);
        this._row_list[name].dom_list = {
            name: NewObj("div", "c1", name),
            quest: NewObj("div", "c2", button),
            count: count,
            row: row
        };
        row.appendChild(this._row_list[name].dom_list.name);
        row.appendChild(this._row_list[name].dom_list.quest);
        row.appendChild(this._row_list[name].dom_list.count);

        button.onclick = function () {
            me.onClick.fire(this.value);
        };
    },
    set_value: function (name, value) {
        var row = this._row_list[name], count;
        if (!row) return false;
        if (this._read_only) {
            count = Math.floor(value * 1000) / 1000;
            row.dom_list.count.innerText = count;
            row.count = count;
        } else {
            row.count.set_value(value);
        }
        return true;
    },
    get_result: function () {
        var result = {};
        var name;
        for (name in this._row_list) {
            if (name === "header") continue;
            if (this._read_only) result[name] = this._row_list[name].value;
            else result[name] = this._row_list[name].count.get_value();
        }
        return result;
    },
    get_item_list: function () {
        return this._item_list;
    },
    /*
     * 若為read only時(展現結果), 改變足夠, 不足, 等狀態
     * 
     * @method refresh_state
     * @param  {Object} item_list 各物品的數量 
     */
    refresh_state: function (item_list) {
        if (!this._read_only) return;
        var name, JP_name;
        for (name in this._row_list) {
            if (name === "header") continue;
            JP_name = this._language.get_JP_word(name);
            if (item_list[JP_name]) {
                if (item_list[JP_name] > this._row_list[name].count) {
                    this._row_list[name].dom_list.row.className = "not_enough";
                } else {
                    this._row_list[name].dom_list.row.className = "enough";
                }
            } else {
                this._row_list[name].dom_list.row.className = "is_not_target";
            }
        }
    },
    reset: function () {
        for (var name in this._row_list) {
            if (name === "header") {
                continue;
            }
            this.set_value(name, 0);
        }
    },
    add_header_class: function (rare) {
        this._header.classList.add(rare);
    },
    get_column_width: function () {
        var i, row, target, column = {}, width;
        for (i in this._row_list) {
            row = this._row_list[i].dom_list;
            for (target in row) {
                if (target === "row") {
                    continue;
                }
                width = row[target].clientWidth - 10; //css padding: 0 5px 0 5px;
                if (!column[target] || column[target] < width) {
                    column[target] = width;
                }
            }
        }
        return column;
    },
    set_column_width: function (column) {
        var i, row, target;
        for (i in this._row_list) {
            row = this._row_list[i].dom_list;
            for (target in row) {
                row[target].style.width = column[target] + 2 +"px"; // 預留空間2
            }
        }
    }
});

FGO.component.Num_input = function (options) {
    var me = this;
    this._options = options || {};
    this._body = NewObj("input");
    this._body.type = "text";
    this._body.value = "0";
    this._backup = 0;

    this._body.addEventListener("blur", function (event) {
        if (this.value === "") {
            this.value = me._backup;
            return;
        }

        var x = Number(this.value);
        if (isNaN(x)) this.value = me._backup;
        else {
            if (typeof me._options.min === "number") {
                if (this.value < me._options.min) x = me._options.min;
            }
            if (typeof me._options.max === "number") {
                if (this.value > me._options.max) x = me._options.max;
            }
            me._backup = this.value = x;
        }
    });

    this._body.addEventListener("click", function (event) {
        this.value = "";
    });
    this._body.addEventListener("focus", function (event) {
        this.value = "";
    });
}

FGO.component.Num_input.prototype.get_value = function () {
    return Number(this._body.value);
};

FGO.component.Num_input.prototype.render = function (node) {
    node.appendChild(this._body);
};

FGO.component.Num_input.prototype.set_value = function (value) {
    this._body.value = value;
};

FGO.component.Container = function (options) {
    this._options = {
        class_name: "container",
        title: "unknown"
    };

    JIE.base.marge(this._options, options);

    this._body = null;
    this._title_text = null;
    this._content = null;
    this._class_name = this._options.class_name;
    this._title = this._options.title;
    this._content_area = null;
    this._max_height = null;    //for content_area

    FGO.component.Container.uber.constructor.call(this);
};

JIE.base.inherit(FGO.component.Container, JIE.component.Control_base, {
    prepareNode: function (myself) {
        this._body = myself;
        myself.className = this._class_name;
        var me = this;
        var title = NewObj("div", "title");
        var icon = NewObj("div", "icon", "▼");
        var is_open = true;
        title.onclick = function () {
            if (is_open) {
                is_open = false;
                icon.innerText = "▲";

                //me.auto_set_max_height();

                me._content_area.classList.add("slideUp");
                //me._content_area.style.maxHeight = "0";
                
            } else {
                is_open = true;
                icon.innerText = "▼";
                me._content_area.classList.remove("slideUp");
                //me._content_area.style.maxHeight = me._max_height + "px";
            }
        };
        this._title_text = NewObj("div", "text", this._title);

        title.appendChild(this._title_text);
        title.appendChild(icon);

        this._content = NewObj("div", "content");
        this._content_area = NewObj("div", "content_area");
        this._content_area.appendChild(this._content);
        this._body.appendChild(title);
        this._body.appendChild(this._content_area);
    },
    /*
     * 增加內容
     * 
     * @method add_content
     * 
     * @param {Object} dom DOM元件
     */
    add_content: function (dom) {
        if (typeof dom.render === "function") {
            dom.render(this._content);
        } else {
            this._content.appendChild(dom);
        }
    },
    //render: function (node) {
    //    FGO.component.Container.uber.render.call(this, node);
    //    if (this._max_height === null && this._content.clientHeight) {
            
    //    }
    //},
    auto_set_max_height: function () {
        this._max_height = this._content.clientHeight;
        this._content_area.style.maxHeight = this._max_height + "px";
    },
    clear_max_height: function () {
        this._max_height = "";
        this._content_area.style.maxHeight = "";
    },
});

FGO.component.Other = function (options) {
    this._options = {
        class_name: "other"
    };

    JIE.base.marge(this._options, options);

    this._class_name = this._options.class_name;
    this._body = null;
    this._item_collecter = [];
    this._event_ul = null;
    this._schedule = null;
    this._schedule_list = {};
    this._schedule_area = null;
    this._count = 0;
    this._schedule_first_options = null;

    FGO.component.Other.uber.constructor.call(this);
    this.onChange = new JIE.event.Publisher("change", this);
};

JIE.base.inherit(FGO.component.Other, JIE.component.Control_base, {
    prepareNode: function (myself) {
        this._body = myself;
        myself.className = this._class_name;
        var language = FGO.language_manager;
        var event_area = NewObj("div", "event_area");
        this._event_ul = NewObj("ul", "event");
        event_area.appendChild(NewObj("div", "title", language.get_word('イベント')));
        event_area.appendChild(this._event_ul);

        var schedule_area = NewObj("div", "schedule_area");
        schedule_area.appendChild(NewObj("div", "title", language.get_word('進行度')));
        this._schedule = NewObj("select", "select");
        schedule_area.appendChild(this._schedule);

        this._body.appendChild(event_area);
        this._body.appendChild(schedule_area);
    },
    /* 
     * 產生勾選清單
     * 
     * @method add_event_item
     * @param {String} name 項目名稱 
     */
    add_event_item: function (name) {
        if (typeof name !== "string" || name.trim() === "") return;
        this._count += 1;

        var me = this;
        var item = NewObj("li", "item");


        var check_box = NewObj("input");
        check_box.type = "checkbox";
        check_box.value = name;
        check_box.id = "item_" + this._count;

        check_box.onclick = function () {
            me.onChange.fire(me.get_result().event);
        };

        var text = NewObj("label", "text",name);
        text.htmlFor = check_box.id;

        item.appendChild(check_box);
        item.appendChild(text);
        this._event_ul.appendChild(item);

        //this._item_collecter.push({ name: name, check_box: check_box });
        this._item_collecter[name] = check_box;
    },
    /*
     * 添加進度項目
     * 
     * @method add_schedule_option
     * @param {String} name 
     */
    add_schedule_option: function (name) {
        if (typeof name !== "string" || name.trim() === "") return;
        var option = NewObj("option", "", name);
        this._schedule.appendChild(option);
        //this._schedule.value = name;
        this._schedule_list[name] = option;
        //option.selected = true;
        if (!this._schedule_first_options) {
            this._schedule_first_options = option;
            option.selected = true;
        }
    },
    /*
     * @method get_result
     * 
     * @return {object}
     * 
     * result = {
     *  "A": true,
     *  "B": false
     * }
     */
    get_result: function () {
        var result = {
            event: {},
            schedule: null
        },
            index;
        for (index in this._item_collecter) {
            result.event[index] = this._item_collecter[index].checked ? 1: 0;
        }
        result.schedule = this._schedule.value;
        return result;
    },
    set_event_status: function (list) {
        for (var name in list) {
            if (list[name]) {
                this._item_collecter[name].checked = true;
            } else {
                this._item_collecter[name].checked = false;
            }
        }
    },
    select_schedule: function (name) {
        this._schedule_list[name].selected = 'selected';
    },
    reset: function () {
        for (var name in this._item_collecter) {
            this._item_collecter[name].checked = false;
        }
        this._schedule_first_options.selected = 'selected';
    },
});

FGO.component.Dialog = function (options) {
    this._options = {
        class_name: "dialog"
    };
    JIE.base.marge(this._options, options);

    var language = FGO.language_manager;
    this._dialog = JIE.component.Dialog.factory('simple');
    this._dialog.change_class_name(this._options.class_name);
    this._row_list = [];

    this.set_content = function (data) {
        var grid = NewObj("div");
        this._dialog.set_content(grid);
        this._dialog.set_title(language.get_word(data.item_name));

        var header = new row_dom();
        header.c1 = NewObj("div", "c1", language.get_word('エリア'));
        header.c2 = NewObj("div", "c2", language.get_word('クエスト'));
        header.c3 = NewObj("div", "c3", "AP");
        header.c4 = NewObj("div", "c4", language.get_word('ドロップ率'));
        header.c5 = NewObj("div", "c5", language.get_word('ドロップ率 / AP'));
        header.body = NewObj("div", "header");
        header.finish_append();
        grid.appendChild(header.body);
        this._row_list.push(header);
        //var header = NewObj("div", "header");
        //header.appendChild(NewObj("div", "c1", language.get_word('エリア')));
        //header.appendChild(NewObj("div", "c2", language.get_word('クエスト')));
        //header.appendChild(NewObj("div", "c3", "AP"));
        //header.appendChild(NewObj("div", "c4", language.get_word('ドロップ率')));
        //header.appendChild(NewObj("div", "c5", language.get_word('ドロップ率 / AP')));
        //grid.appendChild(header);

        var row, type, AP, CP, P, index, list = data.list;
        for (index in list) {
            type = list[index].type;
            AP = list[index].AP;
            CP = Math.round(list[index].CP * 1000) / 1000;
            P = Math.round((list[index].P * 100) * 1000) / 1000 + "%";

            row = new row_dom();
            row.c1 = NewObj("div", "c1", language.get_word(type[0]));
            row.c2 = NewObj("div", "c2", language.get_word(type[1]));
            row.c3 = NewObj("div", "c3", AP);
            row.c4 = NewObj("div", "c4", P);
            row.c5 = NewObj("div", "c5", CP);
            row.body = NewObj("div", "row");
            row.finish_append();
            grid.appendChild(row.body);
            this._row_list.push(row);

            //row = NewObj("div", "row");
            //row.appendChild(NewObj("div", "c1", language.get_word(type[0])));
            //row.appendChild(NewObj("div", "c2", language.get_word(type[1])));
            //row.appendChild(NewObj("div", "c3", AP));
            //row.appendChild(NewObj("div", "c4", P));
            //row.appendChild(NewObj("div", "c5", CP));

            //grid.appendChild(row);
        }
    };
    this.show = function () {
        this._dialog.show();
    };
    this.hide = function () {
        this._dialog.hide();
    };
    this.render = function (node) {
        this._dialog.render(node);
    };
    this.refresh = function () {
        //get
        var i, grid, column = {}, tmp, target, width;
        for (i in this._row_list) {
            tmp = this._row_list[i];
            for (target in tmp) {
                if (target === 'body') {
                    continue;
                }
                width = tmp[target].clientWidth - 10;   //css padding: 0 5px 0 5px;
                if (!column[target] || column[target] < width) {
                    column[target] = width;
                }
            }
        }
        //set
        for (i in this._row_list) {
            for (target in this._row_list[i]) {
                if (typeof this._row_list[i][target] === 'function') {
                    continue;
                }
                this._row_list[i][target].style.width = column[target] + 2 + "px"; // 預留空間2

            }

        }
    };

    function row_dom() {
        this.c1 = null;
        this.c2 = null;
        this.c3 = null;
        this.c4 = null;
        this.c5 = null;
        this.body = null;
    }
    row_dom.prototype.finish_append = function () {
        this.body.appendChild(this.c1);
        this.body.appendChild(this.c2);
        this.body.appendChild(this.c3);
        this.body.appendChild(this.c4);
        this.body.appendChild(this.c5);
    };
};

FGO.component.Header = function (options) {
    this._options = {
        class_name: 'header_panel',
        language: 'JP'
    };

    JIE.base.marge(this._options, options);

    this._body = null;
    this._select = null;

    this.onChange = new JIE.event.Publisher("change", this);

    FGO.component.Header.uber.constructor.call(this);
};

JIE.base.inherit(FGO.component.Header, JIE.component.Control_base, {
    prepareNode: function (myself) {
        var me = this;
        var language = FGO.language_manager;

        this._body = myself;
        myself.className = this._options.class_name;
        myself.id = this._options.class_name;

        var language_area = NewObj('div', 'language_area');
        myself.appendChild(language_area);
        language_area.appendChild(NewObj('div', 'text', language.get_word('言語')));

        this._select = NewObj('select');
        language_area.appendChild(this._select);
        this._select.onchange = function () {
            me.onChange.fire(this.value);
        };
    },
    set_language_list: function (arr) {
        while (this._select.firstChild) {
            this._select.removeChild(this._select.firstChild);
        }
        var option;
        for (var i in arr) {
            option = NewObj('option', 'option', arr[i].name);
            option.value = arr[i].value;
            this._select.appendChild(option);
        }
    },
    set_language: function (language) {
        this._select.value = language;
    }
});

FGO.component.Item_container = null;
(function () {
    var factory = FGO.component.factory;
    FGO.component.Item_container = function (options) {
        this._options = {
            container_class_name: "container",
            item_grid_class_name: "item_grid",
            title: null,
            read_only: false
        };

        JIE.base.marge(this._options, options);

        this._container = factory('Container', { class_name: this._options.container_class_name, title: this._options.title });
        this._item_grid_list = [];

        this.onInfoClick = new JIE.event.Publisher("infoClick", this);

    };

    FGO.component.Item_container.prototype.add_item_grid = function (list, rare) {
        var me = this;
        var item_grid = factory('Item_grid', {
            class_name: this._options.item_grid_class_name,
            read_only: this._options.read_only
        });
        item_grid.add_header_class(rare);
        for (var i in list) {
            item_grid.add_item(list[i]);
        }
        this._item_grid_list.push(item_grid);
        this._container.add_content(item_grid);
        item_grid.onClick.subscribe(function (type, args) {
            me.onInfoClick.fire(args[0]);
        });

    };
    FGO.component.Item_container.prototype.get_result = function () {
        var result = {};
        for (var i in this._item_grid_list) {
            JIE.base.margeDeep(result, this._item_grid_list[i].get_result());
        }
        return result;
    };
    /*
     * 將結果的內容放入表格內
     * 
     * list = {
     *  'a': 5,
     *  ...
     * }
     * 
     * @method set_value
     * @param {Object} list 物品清單
     */
    FGO.component.Item_container.prototype.set_value = function (list) {
        var finish, item, i, grid, item_list;
        //for (item in list) {
        //    finish = false;
        //    for (i in this._item_grid_list) {
        //        item_list = this._item_grid_list[i].get_item_list();
        //        finish = this._item_grid_list[i].set_value(item, list[item]);
        //        if (finish) {
        //            break;
        //        }
        //    }
        //}

        for (i in this._item_grid_list) {
            item_list = this._item_grid_list[i].get_item_list();
            for (item in item_list) {
                if (list[item]) {
                    this._item_grid_list[i].set_value(item, list[item]);
                }
            }
        }
    };
    /*
     * 若為read only時(展現結果), 改變足夠, 不足, 等狀態
     * 
     * target_list = {
     *  'a': 5,
     *  ...
     * }
     * 
     * @method refresh_state
     * @param {Object} target_list 目標物品清單
     */
    FGO.component.Item_container.prototype.refresh_state = function (target_list) {
        var i;
        if (this._options.read_only) {
            for (i in this._item_grid_list) {
                this._item_grid_list[i].refresh_state(target_list);
            }
        }
    };
    FGO.component.Item_container.prototype.reset = function () {
        for (var i in this._item_grid_list) {
            this._item_grid_list[i].reset();
        }
    };
    FGO.component.Item_container.prototype.render = function (node) {
        this._container.render(node);
    };
    FGO.component.Item_container.prototype.auto_set_max_height = function () {
        this._container.auto_set_max_height();
    };
    FGO.component.Item_container.prototype.clear_max_height = function () {
        this._container.clear_max_height();
    };
    FGO.component.Item_container.prototype.get_column_width = function () {
        var i, grid, column, tmp, target;
        for (i in this._item_grid_list) {
            grid = this._item_grid_list[i];
            tmp = grid.get_column_width();
            if (!column) {
                column = tmp;
            } else {
                for (target in column) {
                    if (column[target] < tmp[target]) {
                        column[target] = tmp[target];
                    }
                }
            }
        }
        return column;
    };
    FGO.component.Item_container.prototype.set_column_width = function (column) {
        var i;
        for (i in this._item_grid_list) {
            this._item_grid_list[i].set_column_width(column);
        }
    };
})();

FGO.component.Quest_times_grid = function (options) {
    this._options = {
        class_name: "quest_times_grid",
    };
    JIE.base.marge(this._options, options);

    this._class_name = this._options.class_name;
    this._header = null;
    this._content = null;
    this._body = null;
    this._row_list = {};
    this._item_list = {};
    FGO.component.Quest_times_grid.uber.constructor.call(this);

};

JIE.base.inherit(FGO.component.Quest_times_grid, JIE.component.Control_base, {
    prepareNode: function (myself) {
        this._body = myself;
        this._body.className = this._class_name;
        var language = FGO.language_manager;
        this._header = NewObj("div", "header");
        this._row_list["header"] = {
            area: NewObj("div", "c1", language.get_word('エリア')),
            quest: NewObj("div", "c2", language.get_word('クエスト')),
            count: NewObj("div", "c3", language.get_word('タイムズ'))
        };
        this._row_list["header"] = {
            dom_list: {
                area: NewObj("div", "c1", language.get_word('エリア')),
                quest: NewObj("div", "c2", language.get_word('クエスト')),
                count: NewObj("div", "c3", language.get_word('タイムズ'))
            },
        };
        this._header.appendChild(this._row_list["header"].dom_list.area);
        this._header.appendChild(this._row_list["header"].dom_list.quest);
        this._header.appendChild(this._row_list["header"].dom_list.count);

        myself.appendChild(this._header);
    },
    add_quest_times_list: function (list) {
        this._clear();

        var type1, type2, row;
        for (type1 in list) {
            for (type2 in list[type1]) {
                if (!list[type1][type2]) continue;

                this._row_list[type1 + type2] = {
                    dom_list: {
                        area: NewObj("div", "c1", type1),
                        quest: NewObj("div", "c2", type2),
                        count: NewObj("div", "c3", list[type1][type2]),
                        row: row
                    },
                    area: type1,
                    quest: type2,
                    count: list[type1][type2],
                };

                row = NewObj("div");
                row.appendChild(this._row_list[type1 + type2].dom_list.area);
                row.appendChild(this._row_list[type1 + type2].dom_list.quest);
                row.appendChild(this._row_list[type1 + type2].dom_list.count);
                this._body.appendChild(row);
                this._row_list[type1 + type2].dom_list.row = row;
            }
        }
    },
    _clear: function () {
        for (var name in this._row_list) {
            if (name === "header") {
                continue;
            }
            this._body.removeChild(this._row_list[name].dom_list.row);
            delete this._row_list[name];
        }
    },
    get_column_width: function () {
        var i, row, target, column = {}, width;
        for (i in this._row_list) {
            row = this._row_list[i].dom_list;
            for (target in row) {
                if (target === "row") {
                    continue;
                }
                width = row[target].clientWidth - 10; //css padding: 0 5px 0 5px; 
                if (!column[target] || column[target] < width) {
                    column[target] = width;
                }
            }
        }
        return column;
    },
    set_column_width: function (column) {
        var i, row, target;
        for (i in this._row_list) {
            row = this._row_list[i].dom_list;
            for (target in row) {
                row[target].style.width = column[target] + 2 + "px";    //預留空間2
            }
        }
    }
});
