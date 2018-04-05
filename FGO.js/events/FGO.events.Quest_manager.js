FGO.events.Quest_manager = function () {
    var instance = this;
    
    FGO.events.Quest_manager = function () {
        return instance;
    };

    this._total_cost_list  = {};
    this._total_enemy_list = {};
    this._total_drop_list  = {};

    this._cp_list = null;

    this._quest_collector = {};
    //this._bonus = null;
    this._ans = null;

};
FGO.events.Quest_manager.prototype = {
    constructor: FGO.events.Quest_manager.prototype.constructor,

    /* 
     * 輸入關卡資訊
     * 其中格式為: 
     * quest = { 
     *            type: "主線關卡",
     *            title: "ACT-2 「武力介入」",
     *            info: {
     *                     cost:  {name: "AP", count: 20}
     *                     enemy_list: [{name: "咒語書", p: 1, type: "真", drop: [{name: "狂之印章", p: 0.2, count: 5, box: 9}, {...}]}, ... ]
     *                     prize_list: [{name: "禮裝A", count: 3}, ...],
     *                     bonus: {}
     *                   }
     *         }
     * 
     * @method set_data
     * @param  {Object} data 關卡資訊
     */
    add_quest: function (quest) {
        if (this._quest_collector[quest.type] === undefined)
            this._quest_collector[quest.type] = {};

        //if (this._bonus) quest.info.bonus = this._bonus;

        //for (var key in quest.info.enemy) {
        //    if (quest.info.enemy[key].type && )
        //}

        this._quest_collector[quest.type][quest.title] = new FGO.events.Quest(quest.info);
    },
    /*
     * 輸入使用者加成狀況
     * 其中格式為：
     * data = {
     *          enemy: {
     *                      type_A: {
     *                                  "真": 2  //比例上升, 將影響另一種類機率(贋作)
     *                              },
     *                      type_B: {
     *                                  "貓咪": 1 //該怪會出現更多隻(空之境界)
     *                              }
     *                  },
     *          drop:   {
     *                      type_A: {
     *                                  "功德符": 2    //該類型掉落數+N
     *                              },
     *                      type_B: {
     *                                  "功德玉": 0.2  //該類型掉落率上升, 最大100%
     *                              }
     *                  }
     *          }
     * }
     * 
     * @method set_bouns
     * @param  {Object} quest 關卡的type, title
     * @param  {Object} data  加成資訊 
     */
    set_bonus: function (type, title, data) {
        if (type && title && data) {
            if (this._quest_collector[type] && this._quest_collector[type][title]) {
                this._quest_collector[type][title].set_bonus(data);
            }
        }
    },
    /*
     * 輸入各關遊玩次數
     * 格式:
     * data = {"主線關卡": {
     *                        "ACT-1": {
     *                              time: 3,
     *                              first: true
     *                         },
     *                        "ACT-3": {...}
     *                    }
     *        }
     * 
     * @method play
     * @param  {Object} data 遊玩關卡次數
     */
    play: function (data) {
        var type, title, info, name, name, index;
        this._total_cost = {};

        for (type in data) {
            for (title in data[type]) {
                info = this._quest_collector[type][title].play(data[type][title].time);
                
                //for cost
                if (this._total_cost_list[info.cost.name] === undefined) this._total_cost_list[info.cost.name] = 0;
                this._total_cost_list[info.cost.name] += info.cost.count;

                //for enemy
                for (name in info.enemy) {
                    if (this._total_enemy_list[name] === undefined) this._total_enemy_list[name] = 0;
                    this._total_enemy_list[name] += info.enemy[name];
                }

                //for drop
                for (name in info.drop) {
                    if (this._total_drop_list[name] === undefined) this._total_drop_list[name] = 0;
                    this._total_drop_list[name] += info.drop[name];
                }

                //for prize
                if (data[type][title].first) {
                    prize_list = this._quest_collector[type][title].get_prize_list();
                    name = prize_list[index].name;
                    for (index in prize_list) {
                        if (this._total_drop_list[name] === undefined) this._total_drop_list[name] = 0;
                        this._total_drop_list[name] += prize_list[index].count;
                    }
                }
            }
        }
    },
    //get_cp: function (type, title) {
    //    if (this._quest_collector[type] && this._quest_collector[type][title]) return this._quest_collector[type][title].get_cp();
    //}
    get_cp_list: function (reset) {
        reset = reset || false;

        if (reset || this._cp_list === null || this._re) {
            this._cp_list = {
                drop_list: {},
                enemy_list: {}
            };
            //var type, title, cp, name, update;
            //for (type in this._quest_collector) {
            //    for (title in this._quest_collector[type]) {
            //        cp = this._quest_collector[type][title].get_cp();

            //        //=== enemy ===
            //        for (name in cp.enemy_list) {
            //            update = false;
            //            if (this._cp_list.enemy_list[name] === null)                      update = true; 
            //            else if (this._cp_list.enemy_list[name].cp < cp.enemy_list[name]) update = true;

            //            if (update) {
            //                this._cp_list.enemy_list[name] = {
            //                    type: type,
            //                    title: title,
            //                    cp: cp.enemy_list[name]
            //                };
            //            }
            //        }

            //        //=== drop ===
            //        for (name in cp.drop_list) {
            //            update = false;
            //            if (this._cp_list.drop_list[name] === null)                     update = true; 
            //            else if (this._cp_list.drop_list[name].cp < cp.drop_list[name]) update = true;

            //            if (update) {
            //                this._cp_list.drop_list[name] = {
            //                    type: type,
            //                    title: title,
            //                    cp: cp.drop_list[name]
            //                };
            //            }
            //        }
            //    }
            //}
            var type, title, cp, name, index, 
                list = {enemy_list: {}, drop_list:{}}, tmp_node, header, arr = ["enemy", "drop"];
            for (type in this._quest_collector) {
                for (title in this._quest_collector[type]) {
                    cp = this._quest_collector[type][title].get_cp();

                    ////=== enemy ===
                    //list = {}, tmp_node = null, header = null;
                    //for (name in cp.enemy_list) {
                    //    if (list[name] === undefined) list[name] = [];
                    //    list[name].push({
                    //        type: type,
                    //        title: title,
                    //        cp: cp.enemy_list[name],
                    //        last: null,
                    //        next: null
                    //    });
                    //}
                    ////=== sort ===
                    //for (name in list) {
                    //    for (index in list[name]) {
                    //        if (header === null) {
                    //            header = list[name][index];
                    //        } else {
                    //            tmp_node = header;

                    //            while (tmp_node) {  //大到小
                    //                if (tmp_node.cp < list[name][index].cp) {

                    //                    list[name][index].last = tmp_node.last;
                    //                    list[name][index].next = tmp_node;
                                    
                    //                    tmp_node.last = list[name][index];
                    //                    tmp_node.next = list[name][index];

                    //                    if (tmp_node.last === null) {
                    //                        header = list[name][index];
                    //                    }

                    //                    break;

                    //                } else {
                    //                    if (tmp_node.next === null) {
                    //                        tmp_node.next = list[name][index];
                    //                        break;
                    //                    } else {
                    //                        tmp_node = tmp_node.next;
                    //                    }
                    //                }
                    //            }
                    //        }
                    //    }
                    //    tmp_node = header;;
                    //    while (tmp_node) {
                    //        if (this._cp_list.enemy_list[name] === undefined) this._cp_list.enemy_list[name] = [];
                    //        this._cp_list.enemy_list[name].push({
                    //            type: tmp_node.type,
                    //            title: tmp_node.title,
                    //            cp: tmp_node.cp                            
                    //        });
                    //        tmp_node = tmp_node.next;
                    //    }
                    //}

                    

                    ////=== drop ===
                    //list = {};
                    //for (name in cp.drop_list) {
                    //    if (list[name] === undefined) list[name] = [];
                    //    list[name].push({
                    //        type: type,
                    //        title: title,
                    //        cp: cp.drop_list[name],
                    //        last: null,
                    //        next: null
                    //    });
                    //}

                    //=== enemy ===
                    for (select in arr) {
                        list[arr[select] + "_list"] = {}, tmp_node = null, header = null;
                        for (name in cp[arr[select] + "_list"]) {
                            if (list[arr[select] + "_list"][name] === undefined) list[arr[select] + "_list"][name] = [];
                            list[arr[select] + "_list"][name].push({
                                type: type,
                                title: title,
                                cp: cp[arr[select] + "_list"][name],
                                last: null,
                                next: null
                            });
                        }
                    }
                    
                }
            }
            //=== sort ===
            for (select in arr) {
                for (name in list[arr[select] + "_list"]) {
                    for (index in list[arr[select] + "_list"][name]) {
                        if (header === null) {
                            header = list[arr[select] + "_list"][name][index];
                        } else {
                            tmp_node = header;

                            while (tmp_node) {  //大到小
                                if (tmp_node.cp < list[arr[select] + "_list"][name][index].cp) {

                                    list[arr[select] + "_list"][name][index].last = tmp_node.last;
                                    list[arr[select] + "_list"][name][index].next = tmp_node;
                                    
                                    tmp_node.last = list[arr[select] + "_list"][name][index];
                                    tmp_node.next = list[arr[select] + "_list"][name][index];

                                    if (tmp_node.last === null) {
                                        header = list[arr[select] + "_list"][name][index];
                                    }

                                    break;

                                } else {
                                    if (tmp_node.next === null) {
                                        tmp_node.next = list[arr[select] + "_list"][name][index];
                                        break;
                                    } else {
                                        tmp_node = tmp_node.next;
                                    }
                                }
                            }
                        }
                    }
                    tmp_node = header;;
                    while (tmp_node) {
                        if (this._cp_list[arr[select] + "_list"][name] === undefined) this._cp_list[arr[select] + "_list"][name] = [];
                        this._cp_list[arr[select] + "_list"][name].push({
                            type: tmp_node.type,
                            title: tmp_node.title,
                            cp: tmp_node.cp                            
                        });
                        tmp_node = tmp_node.next;
                    }
                }
            }
        }
        return extendDeep(null, this._cp_list)
        //return this._cp_list;
    }
};


FGO.events.Quest = function (data) {
    this._cost  = {};
    this._bonus = {};
    this._enemy_list = [];
    //this._drop_list  = [];
    this._prize_list = [];

    this._enemy_scale = {};
    this._copied_enemy_list = null;
    this._copied_item_list = null;

    this._actual_enemy_list = {};
    this._actual_drop_list = {};
    this._actual_enemy_scale = {};

    if (data) this.set_data(data);
};
FGO.events.Quest.prototype = {
    constructor: FGO.events.Quest.prototype.constructor,
    /* 
     * 輸入關卡資訊
     * 其中格式為: 
     *  data = {
     *              cost:  {name: "AP", count: 20}
     *              enemy_list: [{name: "咒語書", p: 1, type: "真", drop: [{name: "功德玉", p: 0, count: 5, box: 9, type: "B"}]}, ... ]
     *              prize_list: [{name: "禮裝A", count: 3}, ...],
     *              bonus: {}
     *          }
     * 
     * @method set_data
     * @param  {Object} data 關卡資訊
     */
    set_data: function (data) {
        this._cost  = data.cost;
        this._enemy_list = data.enemy_list;
        //this._drop  = data.drop;
        this._prize_list = data.prize_list;
        
        this._check_enemy_type();

        if (data.bonus) {
            this.set_bonus(data.bonus);
        } else {
            this._copy_enemy_list();
            this._get_actual();
        }
    },

    /*
     * 輸入使用者加成狀況
     * 其中格式為：
     * data = {"狂之印章": "+20%", 
     *         "劍之印章": "+1"}
     * 
     * data = {
     *          enemy: {
     *                      type_A: {
     *                                  "真": 2  //比例上升, 將影響另一種類機率(贋作)
     *                              },
     *                      type_B: {
     *                                  "貓咪": 1 //該怪會出現更多隻(空之境界)
     *                              }
     *                  },
     *          drop:   {
     *                      type_A: {
     *                                  "功德符": 2    //該類型掉落數+N
     *                              },
     *                      type_B: {
     *                                  "功德玉": 0.2  //該類型掉落率上升, 最大100%
     *                              }
     *                  }
     *          }
     * }
     * 
     * @method set_bouns
     * @param  {Object} data 加成資訊 
     */
    set_bonus: function (bonus) {
        var index1, index2, name, enemy, drop;
        this._bonus = bonus;
        this._actual_enemy_scale = {};

        //=== copy enemy data ===
        this._copy_enemy_list();

        if (bonus.enemy) {
            //=== enemy type_B ===
            if (bonus.enemy.type_B) {
                for (index1 in this._copied_enemy_list) {
                    if (bonus.enemy.type_B[this._copied_enemy_list[index1].name]) {
                        this._copied_enemy_list[index1].p += bonus.enemy.type_B[this._copied_enemy_list[index1].name];
                    }
                }
            }

            //=== enemy type_A ===
            if (bonus.enemy.type_A) {
                var copy_scale = {}, mixed_scale = 0;

                for (index1 in this._enemy_scale) {
                    copy_scale[index1] = bonus.enemy.type_A[index1];
                    if (bonus.enemy.type_A[index1]) copy_scale[index1] += this._enemy_scale[index1];
                    mixed_scale += copy_scale[index1];
                }
                for (index1 in copy_scale) {
                    copy_scale[index1] = copy_scale[index1] / mixed_scale;  //get the actual scale ex: 0.3 & 0.7
                }
                for (index1 in this._copied_enemy_list) {
                    if (this._copied_enemy_list[index1].type) {
                        this._copied_enemy_list[index1].p *= copy_scale[this._copied_enemy_list[index1].type];
                    }
                }
            }
        }
        
        if (bonus.drop) {
            if (bonus.drop.type_A) {
                //=== drop type_A === 
                /*
                 * 掉落數+N個系列
                 */
                for (index1 in this._copied_enemy_list) {
                    enemy = this._copied_enemy_list[index1];
                    for (index2 in this.enemy) {
                        drop = enemy.drop[index2];
                        name = drop.name;

                        drop.count += bonus.drop.type_A[name];
                    }
                }

            }

            if (bonus.drop.type_B) {
                //=== drop type_B ===
                /*
                 * 掉落率上升系列
                 */
                for (index1 in this._copied_enemy_list) {
                    enemy = this._copied_enemy_list[index1];

                    for (index2 in enemy.drop) {

                        drop = enemy.drop[index2];
                        name = drop.name;

                        if (/[Bb]/.test(drop.type)) {
                            if (bonus.drop.type_B[name]) {
                                drop.p += bonus.drop.type_B[name];
                            }
                        }
                    }

                    //if (data.drop.type_B[this._copied_enemy_list[key].drop.name]) {
                    //    if (/[Bb]/.test(this._copied_enemy_list[key].drop.type)) {
                    //        this._copied_enemy_list[key].drop.p += data.drop.type_B[this._copied_enemy_list[key].drop.name];
                    //        if (this._copied_enemy_list[key].drop.p > 1) this._copied_enemy_list[key].drop.p = 1;
                    //    }
                    //}
                }
            }
        }

        this._get_actual();
    },

    /*
     * 輸入通關次數並回傳敵人數量/掉落物/消耗
     * 
     * @method play
     * @param  {Number} count 通關次數\
     * @return {Object} 敵人數量/掉落物/消耗
     */
    play: function (count) {
        var enemy_list = {},
            drop_list = {},
            name;

        for (name in this._actual_enemy_list) {
            enemy_list[name] = this._actual_enemy_list[name] * count;
        }

        for (name in this._actual_drop_list) {
            drop_list[name] = this._actual_drop_list[name] * count;
        }

        return {
            cost: {
                name: this._cost.name,
                count: this._cost.count * count
            },
            enemy_list: enemy_list,
            drop_list: drop_list
        }
    },
    get_prize_list: function () {
        return this._prize_list;
    },
    get_cp: function () {
        var data  = this.play(1);
        var enemy_list = {};
        var drop_list = {};
        var name = null;
        for (name in data.enemy_list) {
            enemy_list[name] = data.enemy_list[name] / data.cost.count;
        }
        for (name in data.drop_list) {
            drop_list[name] = data.drop_list[name] / data.cost.count;
        }

        return {
            enemy_list: enemy_list,
            drop_list: drop_list,
            cost_type: data.cost.name
        }
    },
    _check_enemy_type: function () {
        for (var index in this._enemy) {
            if (this._enemy[index].type && this._enemy_scale[this._enemy[index].type] === undefined) {
                this._enemy_scale[this._enemy[index].type] = 1;
            }
        }
    },
    _get_actual: function () {
        //this._set_actual_enemy();
        //this._set_actual_drop();
        get_actual_enemy_list.call(this);
        get_actual_drop_list.call(this);

        function get_actual_enemy_list() {
            var name, index;

            this._actual_enemy_list = {};

            for (index in this._copied_enemy_list) {
                name = this._copied_enemy_list[index].name;

                if (this._actual_enemy_list[name] === undefined) {
                    this._actual_enemy_list[name] = 0;
                }

                this._actual_enemy_list[name] += this._copied_enemy_list[index].p;
                //if (this._bonus[this._enemy[key].name]) {
                //    if (/%/.test(this._bonus[this._enemy[key].name])) {
                //        count = Number(this._bonus[this._enemy[key].name].match(/\d+/g)) * 0.01;

                //        if (/-/.test(this._bonus[this._enemy[key].name])) {
                //            count *= -1;
                //        }

                //    } else {
                //        count = Number(this._bonus[this._enemy[key].name].match(/\d+/g));
                //    }
                //}

                
            }

            //for (key in this._actual_enemy_list) {
            //    if (this._bonus.enemy.type_A[this._enemy[key].type]) {

            //        //1 + Number(this._bonus.enemy.type_A[this._enemy[key].type])
            //    }
            //}
            
        }
        function get_actual_drop_list() {
            var index1, index2, name, p, count, box;

            this._actual_drop_list = {};

            for (index1 in this._copied_enemy_list) {
                for (index2 in this._copied_enemy_list[index1].drop) {
                    name = this._copied_enemy_list[index1].drop[index2].name;
                    p = this._copied_enemy_list[index1].drop[index2].p;
                    count = this._copied_enemy_list[index1].drop[index2].count;
                    box = this._copied_enemy_list[index1].drop[index2].box;

                    if (this._actual_drop_list[name] === undefined) {
                        this._actual_drop_list[name] = 0;
                    }
                    this._actual_drop_list[name] += p * count * box;
                }


                
            }

            //var drop_p, drop_c, key;
            //for (key in this._drop) {
            //    drop_p = this._drop[key].p;
            //    drop_c = this._drop[key].count;
            //    if (this._actual_drop[this._drop[key].name] === undefined) {
            //        this._actual_drop[this._drop[key].name] = 0;
            //    }

            //    if (this._bonus[this._drop[key].name]) {
            //        if (/%/.test(this._bonus[this._drop[key].name])) {
            //            drop_p += Number(this._bonus[this._enemy[key].name].match(/\d+/g)) * 0.01;
            //        } else {
            //            drop_c += Number(this._bonus[this._enemy[key].name].match(/\d+/g));
            //        }

            //    }
            //    this._actual_drop[this._drop[key].name] += drop_p * drop_c;
            //}
        }
    },
    //_set_actual_enemy: function () {
    //    var count, key;

    //    this._actual_enemy = {};

    //    for (key in this._enemy) {
    //        count = 0;

    //        if (this._actual_enemy[this._enemy[key].name] === undefined) {
    //            this._actual_enemy[this._enemy[key].name] = 0;
    //        }

    //        //if (this._bonus[this._enemy[key].name]) {
    //        //    if (/%/.test(this._bonus[this._enemy[key].name])) {
    //        //        count = Number(this._bonus[this._enemy[key].name].match(/\d+/g)) * 0.01;

    //        //        if (/-/.test(this._bonus[this._enemy[key].name])) {
    //        //            count *= -1;
    //        //        }

    //        //    } else {
    //        //        count = Number(this._bonus[this._enemy[key].name].match(/\d+/g));
    //        //    }
    //        //}

    //        this._actual_enemy[this._enemy[key].name] += count + this._enemy[key].p;
    //    }

    //    for (key in this._actual_enemy) {
    //        if (this._bonus.enemy.type_A[this._enemy[key].type]) {

    //            //1 + Number(this._bonus.enemy.type_A[this._enemy[key].type])
    //        }
    //    }
            
    //},
    //_set_actual_drop: function () {
    //    var drop_p, drop_c, key;
    //    for (key in this._drop) {
    //        drop_p = this._drop[key].p;
    //        drop_c = this._drop[key].count;
    //        if (this._actual_drop[this._drop[key].name] === undefined) {
    //            this._actual_drop[this._drop[key].name] = 0;
    //        }

    //        if (this._bonus[this._drop[key].name]) {
    //            if (/%/.test(this._bonus[this._drop[key].name])) {
    //                drop_p += Number(this._bonus[this._enemy[key].name].match(/\d+/g)) * 0.01;
    //            } else {
    //                drop_c += Number(this._bonus[this._enemy[key].name].match(/\d+/g));
    //            }

    //        }
    //        this._actual_drop[this._drop[key].name] += drop_p * drop_c;
    //    }
    //}
    _copy_enemy_list: function () {
        this._copied_enemy_list = [];
        JIE.base.extendDeep(this._copied_enemy_list, this._enemy_list);
        //for (var index1 in this._enemy_list) {
        //    this._copied_enemy_list[index1] = {};
        //    for (var key1 in this._enemy_list[index1]) {
        //        if (key1 !== "drop") {
        //            this._copied_enemy_list[index1][key1] = this._enemy_list[index1][key1];
        //        } else {
        //            this._copied_enemy_list[index1][key1] = [];
        //            for (var index2 in this._enemy_list[index1][key1]) {
        //                if (this._copied_enemy_list[index1][key1][index2] === undefined) this._copied_enemy_list[index1][key1][index2] = {};
        //                for (var key2 in this._enemy_list[index1][key1][index2]) {
        //                    this._copied_enemy_list[index1][key1][index2][key2] = this._enemy_list[index1][key1][index2][key2];
        //                }
        //            }
        //        }
        //    }
        //}
    }
};