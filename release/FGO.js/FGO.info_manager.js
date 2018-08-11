FGO.info_manager = (function () {
    var i, i_max;
    var specify_item2quest_list = {},
        specify_quest_list = {};


    /* default */
    var default_info = {
        quest_list: {},
        quest_type: {},
        event_list: ["曜日クエスト", "フリークエスト"],
        event_state: {},
        less_schedule: null,
        item2quest_list: {},
        item_list: {},
    };
    //default_info.less_schedule = default_info.quest_type["自由任務"][default_info.quest_type["自由任務"].length - 1];
    for (i in default_info.event_list) default_info.event_state[default_info.event_list[i]] = 0;

    /* user data */
    var user_info = {
        event_state: JIE.base.extendDeep({}, default_info.event_state),
        schedule: default_info.less_schedule,
        item_list: {}
    };



    //var quest_list = {},
    //    quest_type = {},
    //    item_list = {},
    //    event_list = ["每日任務", "自由任務"],
    //    event = {"每日任務": 0, "自由任務": 0},
    //    user_schedule = null,
    //    target_item_list = {},
    //    specify_quest_list = {},
    //    item2quest_list = {},
    //    specify_item2quest_list = {};

    var Specify_quest_list = function (quest_list) {
        this.quest_list = quest_list;
        this.decorators_list = [];
    };
    Specify_quest_list.decorators = {};
    Specify_quest_list.prototype.decorate = function (decorators) {
        this.decorators_list.push(decorators);
    };
    Specify_quest_list.prototype.get_list = function () {
        var quest_list = this.quest_list,
            i,
            i_max = this.decorators_list.length,
            name;
        for (i = 0; i < i_max; i += 1) {
            name = this.decorators_list[i];
            quest_list = Specify_quest_list.decorators[name].get_list(quest_list);
        }
        return quest_list;
    };
    Specify_quest_list.decorators.schedule = {
        get_list: function (quest_list) {
            var new_quest_list = {};
            var i, type1, type2, fin;
            for (i in default_info.quest_type["曜日クエスト"]) {
                type1 = default_info.quest_type["曜日クエスト"][i];
                new_quest_list[type1] = JIE.base.extendDeep({}, quest_list[type1]);
            }

            fin = default_info.quest_type["フリークエスト"].indexOf(user_info.schedule);
            for (i in default_info.quest_type["フリークエスト"]) {
                type1 = default_info.quest_type["フリークエスト"][i];
                new_quest_list[type1] = JIE.base.extendDeep({}, quest_list[type1]);
                if (Number(i) === fin) break;
            }
            return new_quest_list;
        }
    };
    Specify_quest_list.decorators.item = {
        get_list: function (quest_list) {
            var item, has_item = false;
            for (item in user_info.item_list) {
                has_item = true;
                break;
            }
            if (!has_item) return quest_list;

            var new_quest_list = {};
            var type1, type2;
            for (type1 in quest_list) {
                for (type2 in quest_list[type1]) {
                    for (item in user_info.item_list) {
                        if (quest_list[type1][type2].drop_list[item]) {
                            if (!new_quest_list[type1]) new_quest_list[type1] = {};
                            //if (!new_quest_list[type1][type2]) new_quest_list[type1][type2] = {};
                            new_quest_list[type1][type2] = JIE.base.extendDeep({}, quest_list[type1][type2]);
                            break;
                        }
                    }
                }
            }
            return new_quest_list;
        }
    };
    Specify_quest_list.decorators.event = {
        get_list: function (quest_list) {
            var key, type1, type2, index;
            for (key in user_info.event_state) {
                if (user_info.event_state[key]) {
                    for (index in default_info.quest_type[key]) {
                        type1 = default_info.quest_type[key][index];
                        for (type2 in quest_list[type1]) {
                            quest_list[type1][type2].AP = Math.floor(quest_list[type1][type2].AP / 2);
                        }
                    }
                }
            }
            return quest_list;
        }
    };

    /* 基礎資料 */
    var set_quest_info = function (data) {
        default_info.quest_list = data.list;
        default_info.quest_type = data.type
        default_info.item2quest_list = item2quest(data.list);
    };
    var set_item_list = function (data) {
        default_info.item_list = data;
    };
    //var set_event_list = function (data) {
    //    event_list = data;
    //};

    /* 其他 */
    var get_all_quest_list = function () {
        return JIE.base.extendDeep({}, default_info.quest_list);
    };

    /*
     * 過濾符合使用者設定的關卡
     * 以及設定AP減半
     * 
     * @function  first_quest_filter
     * @param  {Object} options 過濾條件
     * @return {Object} 整理後的關卡
     */
    var first_quest_filter = function (options) {
        var quest_list = JIE.base.extendDeep({}, default_info.quest_list);
        quest_list = new Specify_quest_list(quest_list);

        if (!options || options.schedule) {
            quest_list.decorate('schedule');
        }
        if (!options || options.item) {
            quest_list.decorate('item');
        }
        if (!options || options.event) {
            quest_list.decorate('event');
        }
        return quest_list.get_list();
    }

    /*
     * 根據get_CP的參數決定是否要篩選高CP關卡
     * 其餘同first_quest_filter
     * 
     * @function  get_specify_quest_list
     * @param  {Object} options 過濾條件
     * @return {Object} 整理後的關卡
     */
    var get_specify_quest_list = function (options) {
        //var quest_list = JIE.base.extendDeep({}, default_info.quest_list);
        //var tmp_quest_list;
        //quest_list = new Specify_quest_list(quest_list);

        //if (!options || options.schedule) {
        //    quest_list.decorate('schedule');
        //}
        //if (!options || options.item) {
        //    quest_list.decorate('item');
        //}
        //if (!options || options.event) {
        //    quest_list.decorate('event');
        //}

        //tmp_quest_list = quest_list.get_list();
        var first_quest_list = first_quest_filter(options);
        if (options && !options.get_CP) {
            return first_quest_list;
        } else {
            specify_item2quest_list = specify_item2quest(item2quest(first_quest_list));
            specify_quest_list = quest2item(specify_item2quest_list);

            return JIE.base.extendDeep({}, specify_quest_list);
        }
    };

    var get_specify_item2quest_list = function (/*quest_list*/options) {
        //var quest_list = JIE.base.extendDeep({}, default_info.quest_list);
        //var tmp_quest_list;
        //quest_list = new Specify_quest_list(quest_list);
        //quest_list.decorate('schedule');
        //quest_list.decorate('item');
        //quest_list.decorate('event');

        //tmp_quest_list = quest_list.get_list();
        //quest_list = get_specify_quest_list(options);

        var first_quest_list = first_quest_filter(options);
        tmp_item2quest_list = item2quest(first_quest_list);
        if (options && !options.get_CP) {
            return tmp_item2quest_list;
        } else {
            specify_item2quest_list = specify_item2quest(tmp_item2quest_list);
            return JIE.base.extendDeep({}, specify_item2quest_list);
        }
    };

    
    var get_item_list = function () {
        return JIE.base.extendDeep({}, default_info.item_list);
    };

    var set_schedule = function (data) {
        user_info.schedule = data;
    };

    var get_schedule_list = function (data) {
        return JIE.base.extendDeep([], default_info.quest_type["フリークエスト"]);
    };

    var set_target_item_list = function (data) {
        user_info.item_list = data;
    };

    var get_event_list = function (data) {
        return JIE.base.extendDeep([], default_info.event_list);
    };

    var set_event = function (data) {
        for (var key in user_info.event_state) {
            user_info.event_state[key] = data[key] || 0;
        }
    };

    var get_item2quest_list = function () {
        return JIE.base.extendDeep({}, default_info.item2quest_list);
        //return JIE.base.extendDeep({}, item2quest(default_info.quest_list));
    };

    

    function item2quest(quest_list) {
        var list = {},
            type1, type2, item, quest;

        for (type1 in quest_list) {
            for (type2 in quest_list[type1]) {
                quest = quest_list[type1][type2];
                for (item in quest.drop_list) {
                    if (list[item] === undefined) list[item] = [];
                    list[item].push({
                        type: [type1, type2],
                        CP: quest.drop_list[item] / quest.AP,
                        AP: quest.AP,
                        P: quest.drop_list[item]
                    });
                }
            }
        }
        for (item in list) {
            list[item].sort(function (a, b) {
                return b.CP - a.CP;
            });
        }
        return list;
    };

    function quest2item(list) {
        var new_list = {},
            item, index, type;

        for (item in list) {
            for (index in list[item]) {
                type = list[item][index].type;
                if (!new_list[type[0]]) new_list[type[0]] = {};
                if (!new_list[type[0]][type[1]]) new_list[type[0]][type[1]] = JIE.base.extendDeep({}, default_info.quest_list[type[0]][type[1]]);;
            }
        }
        return new_list;
    };

    /*
     * 挑出CP值高的
     */
    function specify_item2quest(list) {
        var new_list = {},
            AP_list = [],
            delete_list = [],   //放list[item][index]的index
            item, i, j,
            best_quest = {},
            tmp_quest = {},
            times;

        for (item in list) {
            //step 1, get ap list
            AP_list = [];
            for (i in list[item]) {
                if (AP_list.indexOf(list[item][i].AP) === -1) AP_list.push(list[item][i].AP);
            }
            AP_list.sort(function (a, b) { return a - b });

            //step 2, 找出各AP中CP最高的關卡
            delete_list = [];
            for (i in AP_list) {
                best_quest = null;
                for (j in list[item]) {
                    tmp_quest = list[item][j];

                    if (delete_list.indexOf(j) !== -1) continue;
                    if (AP_list[i] === tmp_quest.AP) {
                        if (!best_quest || (tmp_quest.CP >= best_quest.CP)) {
                            best_quest = tmp_quest;
                        } else {
                            delete_list.push(j);
                        }
                    }
                }

                //step 3, 將AP高於自己的確認一下是否能取代
                if (best_quest) {
                    for (j in list[item]) {
                        if (delete_list.indexOf(j) !== -1) continue;

                        tmp_quest = list[item][j];
                        if (tmp_quest.AP >= best_quest.AP) {
                            times = Math.floor(tmp_quest.AP / best_quest.AP);
                            if (best_quest.P * times > tmp_quest.P) {
                                delete_list.push(j);
                            }
                        }
                    }
                }

                //step 4, 更新清單
                if (best_quest) {
                    if (!new_list[item]) new_list[item] = [];
                    new_list[item].push(best_quest);
                }
            }

            

            //step 5, 降序CP值
            if (new_list[item].length > 1) {
                new_list[item].sort(function (a, b) {
                    return a.CP - b.CP;
                });
            }
        }

        return new_list;
    };

    /*
     * 
     */
    function get_played_result(list) {
        return {
            item_list: get_played_result_item(list),
            AP: get_played_result_AP(list)
        };
    }
    /*
     * @function get_played_result_AP
     * @param {Object} list 各關卡次數
     * @param {Object} event 是否AP減半
     * @return {Number} AP
     */
    function get_played_result_AP(list, event) {
        var AP = 0,
            quest = null,
            type1, type2, times,
            AP_50_off = {},
            weight, tmp_quest, has_event;

        for (var index in default_info.event_list) {
            type1 = default_info.event_list[index];
            AP_50_off[type1] = event[type1] || 0;
        }

        for (type1 in list) {

            //check ap 50% off
            weight = 1;
            has_event = 0;
            for (index in AP_50_off) {
                if (AP_50_off[index]) {
                    for (tmp_quest in default_info.quest_type[index]) {
                        if (default_info.quest_type[index][tmp_quest] === type1) {
                            has_event = 1;
                            break;
                        }
                    }
                    if (has_event) {
                        weight = 0.5;
                        break;
                    }
                }
            }

            for (type2 in list[type1]) {
                quest = default_info.quest_list[type1][type2];
                times = list[type1][type2]
                AP += Math.floor(quest.AP * weight) * times;
            }
        }

        return AP;
    };
    function get_played_result_items(list) {
        var item_list = {},
            quest = null,
            type1, type2, item, times;

        for (type1 in list) {
            for (type2 in list[type1]) {
                if (!list[type1][type2]) continue;
                quest = default_info.quest_list[type1][type2];
                times = list[type1][type2]
                for (item in quest.drop_list) {
                    if (!item_list[item]) item_list[item] = 0;
                    item_list[item] += quest.drop_list[item] * times;
                }
            }
        }
        return item_list;
    };

    return {
        /* 基礎資料 */
        set_quest_info: set_quest_info,
        set_item_list: set_item_list,
        //set_event_list: set_event_list,

        /* 其他 */
        get_all_quest_list: get_all_quest_list,
        get_specify_quest_list: get_specify_quest_list,
        get_item_list: get_item_list,
        set_schedule: set_schedule,
        get_schedule_list: get_schedule_list,
        set_target_item_list: set_target_item_list,
        get_event_list: get_event_list,
        set_event: set_event,
        get_item2quest_list: get_item2quest_list,
        get_specify_item2quest_list: get_specify_item2quest_list,
        get_played_result: get_played_result,
        get_played_result_AP: get_played_result_AP,
        get_played_result_items: get_played_result_items
    };
})();