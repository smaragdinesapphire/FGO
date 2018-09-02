FGO.panel.Result_panel = function (options) {
    this._options = {
        class_name: "result_panel",
        read_only: true
    };
    JIE.base.marge(this._options, options);

    this._body = null;
    this._container_list = [];
    this._target_list = null;
    this._AP_dom = null;
    this._quest_times_grid = null;

    this.onInfoClick = new JIE.event.Publisher("infoClick", this);

    FGO.panel.Result_panel.uber.constructor.call(this);
};

JIE.base.inherit(FGO.panel.Result_panel, JIE.component.Control_base, {
    _language: null,
    prepareNode: function (myself) {
        var me = this;
        var language = FGO.language_manager;
        this._language = language;
        var factory = FGO.component.factory;

        this._body = myself;
        myself.className = this._options.class_name;
        myself.id = this._options.class_name;

        var container = factory('Container', {
            class_name: 'container',
            title: language.get_word('結果')
        });
        container.render(myself);
        this._container_list['main'] = container;

        //data
        var item_list = FGO.info_manager.get_item_list();
        var event_list = FGO.info_manager.get_event_list();
        var schedule_list = FGO.info_manager.get_schedule_list();

        var item_container, list, item_type, title
        rare_type = ['bronze', 'silver', 'golden'];
        var i, i_max, j, j_max;

        //AP
        (function (div) {
            title = "AP";
            var container = factory("Container", {
                title: title
            });
            var area = NewObj("div", "AP_area");
            area.appendChild(NewObj("span", "text", "AP："));

            me._AP_dom = NewObj("span");
            area.appendChild(me._AP_dom);

            container.add_content(area);
            div.add_content(container);

            me._container_list['ap'] = container;
        })(container);

        //關卡
        (function (div) {
            title = language.get_word('クエスト');
            var container = factory("Container", {
                title: title
            });

            me._quest_times_grid = factory('Quest_times_grid');
            container.add_content(me._quest_times_grid)
            div.add_content(container);
            me._container_list['quest_times'] = container;
            me._container_list['quest_times_container'] = me._quest_times_grid;
        })(container);

        //棋子、石頭系列
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
        //        read_only: true,
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

        (function (div) {
            title = language.get_word('輝石') + ' & ' +
                    language.get_word('魔石') + ' & ' +
                    language.get_word('秘石');

            //item_container = new this._Item_container({
            //    read_only: false,
            //    title: title
            //});
            item_container = factory("Item_container", {
                read_only: true,
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
            me._container_list['stone'] = item_container;
            div.add_content(item_container);
            me._list_creater(item_container, ["stone"], item_list);
            item_container.onInfoClick.subscribe(function (type, args) {
                me.onInfoClick.fire(language.get_JP_word(args[0]));
            });
        })(container);

        (function (div) {
            title = language.get_word('ピース') + ' & ' +
                    language.get_word('モニュ');

            //item_container = new this._Item_container({
            //    read_only: false,
            //    title: title
            //});
            item_container = factory("Item_container", {
                read_only: true,
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
                read_only: true,
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
    },
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
    /*
     * 將結果寫入
     * list = {
     *  AP: 50,
     *  times_list: {
     *      'A': 5
     *  },
     *  item_list: {
     *      'a': 50
     *      ......
     *  }
     * }
     * 
     * @method set_value
     * @param {Object} list AP, 通關次數, 物品清單
     */
    set_value: function (list) {
        this._AP_dom.innerText = list.AP;

        this._quest_times_grid.add_quest_times_list(list.times_list);

        for (var type in this._container_list) {
            if (typeof this._container_list[type].reset !== "function") continue;
            this._container_list[type].reset();
            this._container_list[type].set_value(list.item_list);
        }
        this._refresh_state();
    },
    set_target_item_list: function (target_list) {
        this._target_list = target_list;
    },
    set_quest_times: function (list) {
        
    },
    _refresh_state: function () {
        for (var i in this._container_list) {
            if (!this._container_list[i].refresh_state) {
                continue;
            }
            this._container_list[i].refresh_state(this._target_list);
        }
    },
    //auto_set_max_height: function () {
    //    for (var i in this._container_list) {
    //        if (typeof this._container_list[i].auto_set_max_height === 'function') {
    //            typeof this._container_list[i].auto_set_max_height();
    //        }
    //    }
    //},
    //clear_max_height: function () {
    //    for (var i in this._container_list) {
    //        if (typeof this._container_list[i].clear_max_height === 'function') {
    //            typeof this._container_list[i].clear_max_height();
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
});
