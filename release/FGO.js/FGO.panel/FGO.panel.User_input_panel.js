FGO.panel.User_input_panel = function (options) {
    this._options = {
        class_name: "user_input_panel"
        //target: null,
        //item_list: null,
        //event_list: null,
        //schedule_list: null
    };

    JIE.base.marge(this._options, options);

    //this._Item_container = null;
    //(function () {
    //    this._Item_container = function (options) {
    //        this._options = {
    //            container_class_name: "container",
    //            item_grid_class_name: "item_grid",
    //            title: null,
    //            read_only: false
    //        };

    //        JIE.base.marge(this._options, options);

    //        this._container = factory('Container', { class_name: this._options.container_class_name , title: this._options.title});
    //        this._item_grid_list = [];
    //    };
    //    /* 
    //     * 產生物品清單表格
    //     * list = [A, B, C, D]
    //     * 
    //     * @method add_item_grid
    //     * @param {Object} list 物品清單
    //     */
    //    this._Item_container.prototype.add_item_grid = function (list) {
    //        var item_grid = factory('Item_grid', {
    //            class_name: this._options.item_grid_class_name,
    //            read_only: this._options.read_only
    //        });
    //        for (var i in list) {
    //            item_grid.add_item(list[i]);
    //        }
    //        this._item_grid_list.push(item_grid);
    //        this._container.add_content(item_grid);
    //        item_grid.onClick.subscribe(function (type, args) {
    //            this.onInfoClick.fire(args[0]);
    //        });
    //    };
    //    this._Item_container.prototype.get_result = function () {
    //        var result = {};
    //        for (var i in this._item_grid_list) {
    //            JIE.base.margeDeep(result, this._item_grid_list[i]);
    //        }
    //        return result;
    //    };
    //    /*
    //     * 將結果的內容放入表格內
    //     * 
    //     * list = {
    //     *  'a': 5,
    //     *  ...
    //     * }
    //     * 
    //     * @method set_value
    //     * @param {Object} list 物品清單
    //     */
    //    this._Item_container.prototype.set_value = function (list) {
    //        var finish, item, i, grid;
    //        for (item in list) {
    //            finish = false;
    //            for (i in this._item_grid_list) {
    //                finish = this._item_grid_list[i].set_value(item, list[item]);
    //                if (finish) {
    //                    break;
    //                }
    //            }
    //        }
    //    };
    //    /*
    //     * 若為read only時(展現結果), 改變足夠, 不足, 等狀態
    //     * 
    //     * target_list = {
    //     *  'a': 5,
    //     *  ...
    //     * }
    //     * 
    //     * @method refresh_state
    //     * @param {Object} target_list 目標物品清單
    //     */
    //    this._Item_container.prototype.refresh_state = function (target_list) {
    //        var i;
    //        if (this._options.read_only) {
    //            for (i in this._item_grid_list) {
    //                this._item_grid_list[i].refresh_state(target_list);
    //            }
    //        }
    //    };
    //    this._Item_container.prototype.reset = function () {
    //        for (var i in this._item_grid_list) {
    //            this._item_grid_list[i].reset();
    //        }
    //    };
    //})();

    this._body = null;
    this._container_list = [];
    this.onInfoClick = new JIE.event.Publisher("infoClick", this);
    this.onOtherChange = new JIE.event.Publisher("otherChange", this);
    this.onCalculate = new JIE.event.Publisher("calculate", this);
    this.onSave = new JIE.event.Publisher("save", this);
    this.onLoad = new JIE.event.Publisher("load", this);
    this.onReset = new JIE.event.Publisher("reset", this);

    FGO.panel.User_input_panel.uber.constructor.call(this);
};

JIE.base.inherit(FGO.panel.User_input_panel, JIE.component.Control_base, {
    _language: null,
    prepareNode: function (myself) {
        this._body = myself;
        myself.className = this._options.class_name;
        myself.id = this._options.class_name;

        var factory = FGO.component.factory;
        var language = FGO.language_manager;
        this._language = language;
        var container = factory('Container', {
            class_name: 'container',
            title: language.get_word('コンフィグ')
        });
        container.render(myself);

        this._container_list['main']= container;
        var me = this;
        
        //data
        var item_list = FGO.info_manager.get_item_list();
        var event_list = FGO.info_manager.get_event_list();
        var schedule_list = FGO.info_manager.get_schedule_list();

        var item_container, list, item_type, title
            rare_type = ['bronze', 'silver', 'golden'];
        var i, i_max, j, j_max;

        ////棋子、石頭系列
        //(function (div) {
        //    title = language.get_word('輝石') + ' & ' + 
        //            language.get_word('魔石') + ' & ' + 
        //            language.get_word('秘石') + ' & ' + 
        //            language.get_word('ピース') + ' & ' + 
        //            language.get_word('モニュ');

        //    //item_container = new this._Item_container({
        //    //    read_only: false,
        //    //    title: title
        //    //});
        //    item_container = factory("Item_container", {
        //        read_only: false,
        //        title: title
        //    });
        //    //for (i in item_type) {
        //    //    for (j in rare_type) {
        //    //        list = item_list[item_type[i]][rare_type[j]];
        //    //        if (list) {
        //    //            item_container.add_item_grid(list);
        //    //        }
        //    //    }
        //    //}
        //    me._container_list['stone_and_chess'] = item_container;
        //    div.add_content(item_container);
        //    me._list_creater(item_container, ["stone", "chess"], item_list);
        //    item_container.onInfoClick.subscribe(function (type, args) {
        //        me.onInfoClick.fire(language.get_JP_word(args[0]));
        //    });
        //})(container);

        //棋子、石頭系列
        (function (div) {
            title = language.get_word('輝石') + ' & ' +
                    language.get_word('魔石') + ' & ' +
                    language.get_word('秘石');

            //item_container = new this._Item_container({
            //    read_only: false,
            //    title: title
            //});
            item_container = factory("Item_container", {
                read_only: false,
                title: title
            });

            me._container_list['stone'] = item_container;
            div.add_content(item_container);
            me._list_creater(item_container, ["stone"], item_list);
            item_container.onInfoClick.subscribe(function (type, args) {
                me.onInfoClick.fire(language.get_JP_word(args[0]));
            });
        })(container);

        //棋子、石頭系列
        (function (div) {
            title = language.get_word('ピース') + ' & ' +
                    language.get_word('モニュ');

            //item_container = new this._Item_container({
            //    read_only: false,
            //    title: title
            //});
            item_container = factory("Item_container", {
                read_only: false,
                title: title
            });

            me._container_list['chess'] = item_container;
            div.add_content(item_container);
            me._list_creater(item_container, ["chess"], item_list);
            item_container.onInfoClick.subscribe(function (type, args) {
                me.onInfoClick.fire(language.get_JP_word(args[0]));
            });
        })(container);
        //其他素材
        (function (div) {
            item_type = ['other'];
            title = language.get_word('銅素材') + ' & ' +
                    language.get_word('銀素材') + ' & ' +
                    language.get_word('金素材');
            item_container = factory("Item_container", {
                read_only: false,
                title: title
            });
            //for (i in item_type) {
            //    for (j in rare_type) {
            //        list = item_list[item_type[i]][rare_type[j]];
            //        if (list) {
            //            item_container.add_item_grid(list);
            //        }
            //    }
            //}
            me._container_list['material'] = item_container;
            div.add_content(item_container);
            me._list_creater(item_container, ["other"], item_list);
            item_container.onInfoClick.subscribe(function (type, args) {
                me.onInfoClick.fire(args[0]);
            });
        })(container);

        //event & schedule
        (function (div) {
            var container = factory('Container', {
                class_name: 'container',
                title: language.get_word('イベント(消費AP 50%DOWN)') + ' & ' +
                       language.get_word('進行度')
            });
            var other = factory('Other');
            var i;
            for (i in event_list) {
                other.add_event_item(language.get_word(event_list[i]));
                
            }
            other.onChange.subscribe(function (type, args) {
                var event = {};
                for (var i in args[0]) {
                    event[language.get_JP_word(i)] = args[0][i];
                }
                me.onOtherChange.fire(event);
            });
            for (i in schedule_list) {
                other.add_schedule_option(language.get_word(schedule_list[i]));
            }
            container.add_content(other);
            me._container_list['other_setting'] = other;
            me._container_list['other_setting_container'] = container;
            div.add_content(container);
        })(container);

        //save, load, calculate, reset
        (function (div) {
            var btn_area = NewObj('div', 'btn_area');
            var save = NewObj('button', 'save', language.get_word('セーブ'));
            save.onclick = function () {
                me._save();
            };
            var load = NewObj('button', 'load', language.get_word('ロード'));
            load.onclick = function () {
                me._load();
            };
            var calculate = NewObj('button', 'calculate', language.get_word('計算'));
            calculate.onclick = function () {
                me._calculate();
            };
            var reset = NewObj('button', 'reset', language.get_word('リセット'));
            reset.onclick = function () {
                me.onReset.fire(me._options.class_name);
                me._reset();
            };
            btn_area.appendChild(save);
            btn_area.appendChild(load);
            btn_area.appendChild(calculate);
            btn_area.appendChild(reset);
            div.add_content(btn_area);
        })(container);
    },
    _save: function () {
        //FGO.cookie.write(this.get_result());
        this.onSave.fire(this.get_result());
    },
    _load: function () {
        //var history = FGO.cookie.read();
        this.onLoad.fire();
    },
    /*
     * 產生item list並過濾掉不存在的rare
     * @function list_creater
     * @param {Object} item_container 建構的容器
     * @param {Array}  list 物品種類
     */
    _list_creater: function (item_container, list, item_list) {
        var i, j, k, arr;
        for (i in list) {
            for (j in rare_type) {
                if (item_list[list[i]][rare_type[j]]) {
                    arr = [];
                    for (k in item_list[list[i]][rare_type[j]]) {
                        arr[k] = this._language.get_word(item_list[list[i]][rare_type[j]][k]);
                    }

                    item_container.add_item_grid(arr, rare_type[j]);
                }
            }
        }
    },
    _calculate: function () {
        this.onCalculate.fire();
    },
    get_result: function () {
        
        var item_list = {}, other_setting, list, i;

        //all items
        for (i in this._container_list) {
            //if (i === 'other_setting' || i === "main") continue;
            if (typeof this._container_list[i].get_result !== "function" || i === 'other_setting') continue;
            list = this._container_list[i].get_result();
            JIE.base.marge(item_list, list);
        }

        //event & schadule
        other_setting = this._container_list['other_setting'].get_result();

        return {
            item_list: item_list,
            other_setting: other_setting
        };
    },
    set_user_setting: function (list) {
        var i, name = ['stone', 'chess', 'material'];
        for (i in name) {
            this._container_list[name[i]].reset();
            this._container_list[name[i]].set_value(list.item_list);
        }
        this._container_list['other_setting'].set_event_status(list.other_setting.event);
        this._container_list['other_setting'].select_schedule(list.other_setting.schedule);
    },
    //auto_set_max_height: function () {
    //    for (var i in this._container_list) {
    //        if (typeof this._container_list[i].auto_set_max_height === 'function') {
    //            typeof this._container_list[i].auto_set_max_height();
    //        }
    //    }
    //},
    refresh: function () {
        var column = {}, tmp, target;
        //get max width
        for (var i in this._container_list) {
            if (typeof this._container_list[i].get_column_width === 'function') {
                tmp = this._container_list[i].get_column_width();
                if (!column[i]) {
                    column[i] = tmp;
                } else {
                    for (target in tmp) {
                        if (column[i][target] < tmp[target]) {
                            column[i][target] = tmp[target];
                        }
                    }
                }
            }
        }
        //set width
        for (var i in this._container_list) {
            if (typeof this._container_list[i].set_column_width === 'function') {
                this._container_list[i].set_column_width(column[i]);
            }
        }

    },
    _reset: function () {
        var i, name = ['stone', 'chess', 'material'];
        for (i in name) {
            this._container_list[name[i]].reset();
        }
        this._container_list['other_setting'].reset();
    }
});