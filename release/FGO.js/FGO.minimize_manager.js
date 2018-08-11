/*
 * 該程式用於將使用者資料轉換成PSO所需的資料
 * 功能有:
 *  1. 產生PSO的目標方程式
 *  2. 產生修正方法
 *  3. 參數設定
 *  4. 將PSO答案format
 */
FGO.minimize_manager = (function () {
    //var info_manager = FGO.info_manager;
    var quest_list = {};
    var target_items = {};
    var item2quest_list = {};
    var event_status = {};

    var onFinish = new JIE.event.Publisher("finish", this);
    var quest_manager = null;
    var times_per_PSO = 3;  //同個問題要反覆計算的次數

    //record
    var quest_table = [];
    var quest_table_index = null;
    var quest_table_length = null;
    var quest_times_list = {};
    var best_ans = null;
    var PSO_finish_state = null;
    var AP = null;

    var PSO = [];
    for (var i = 0; i < times_per_PSO; i += 1) {
        PSO[i] = new Worker('release/FGO.js/FGO.PSO.js');
        PSO[i].addEventListener('message', function (e) {
            onFinish.fire(e.data);
        }, false);
    }




    /*
     * 
     * list = {
     * "修煉場（週一）": {
     *      "弓超級": {
     *          "AP": 40,
     *          "drop_list": {
     *              "血之淚石": 0.131,
     *              "弓之輝石": 0.21,
     *              "弓之魔石": 1.203,
     *          }
     *      }
     *  },
     *  ...
     * }
     * 
     * @function set_quest_list
     * @param {Object} list 任務清單
     *
     */
    //var set_quest_list = function (list) {
    //    quest_list = list;
        
    //    ////set quest_table
    //    //quest_table = [];
    //    //var type1, type2;
    //    //for (type1 in list) {
    //    //    for (type2 in list[type1]) {
    //    //        quest_table.push([type1, type2]);
    //    //    }
    //    //}
    //};

    /*
     * 
     */
    var set_event_status = function (event) {
        event_status = event;
    }

    /*
     * list = {
     *  "血之淚石": 3,
     *  "弓之魔石": 5,
     *  ...
     * }
     * 
     * @function set_target_item_list
     * @param {Object} list 物品清單
     * 
     */
    var set_target_item_list = function (list) {
        target_items = list;
        quest_list = quest_manager.get_specify_quest_list({ get_CP: false, schedule: true, item: true, event: true });
        item2quest_list = quest_manager.get_specify_item2quest_list({ get_CP: false, schedule: true, item: true, event: true });
        set_item2quest_list();
    };

    /*
     * 此清單有該物品CP值高排到低
     * 並且將目標道具塞選出來做quest_table
     * 
     * list = {
     *  "血之淚石": [
     *      {
     *          type: ["修煉場（週一）", "弓超級"],
     *          AP: 40,
     *          CP: 0.003725
     *          P: 0.131
     *      },
     *      ...
     *  ]
     * }
     * 
     * @function set_item2quest_list
     * @param {Object} list 物品清單
     */
    var set_item2quest_list = function () {
        var tmp_list = {};
        for (var name in target_items) {
            tmp_list[name] = item2quest_list[name];
        }

        get_quest_table(tmp_list);
    };

    /*
     * 將任務分類並產生對照表
     * 
     * @function get_quest_table
     */
    var get_quest_table = function (item2quest_list) {
        var list = item2quest_list;

        var queue = {
                item_list: [],
                quest_list: [],
            },
            quest_record = {},
            item_has_team = {},
            team = [],
            team_list = [],
            type1, type2, item;

        //initial
        for (item in list) {
            item_has_team[item] = false;
        }

        //while (!isFinish()) {
        //    for (item in list) {
        //        if (!item_has_team[item]) {
        //            queue.item_list = [];  //清空
        //            queue.quest_list = [];
        //            team = [];

        //            queue.item_list.push(item);
        //            //team.push(item);
        //            //item_has_team[item] = true;

        //            create_team();
        //            team_list.push(team);
        //        }
        //    }
        //}

        for (item in list) {
            if (!item_has_team[item]) {
                queue.item_list = [];  //清空
                queue.quest_list = [];
                team = [];

                queue.item_list.push(item);
                //team.push(item);
                //item_has_team[item] = true;

                create_team();
                team_list.push(team);
            }
        }

        /*
         * 檢查是否全部物品都有隊伍了
         * 
         * @function isFinish
         * @return {Boolean} 
         */
        function isFinish() {
            for (var item in item_has_team) {
                if (!item_has_team[item]) {
                    return false;
                }
            }
            return true;
        }

        function create_team() {
            var finish = false,
                item, type, quest,
                i, j;
            while (!finish) {
                //將queue.item_list的關卡都放到queue.quest_list
                //並將用過的關卡記錄下來quest_record
                for (i in queue.item_list) {
                    item = queue.item_list[i];
                    item2quest = list[item];
                    team.push(item);
                    if (!item_has_team[item]) item_has_team[item] = true;
                    for (j in item2quest) {
                        type = item2quest[j].type;
                        if (quest_record[type[0]] && quest_record[type[0]][type[1]]) {
                            continue;
                        } else {
                            if (!quest_record[type[0]]) quest_record[type[0]] = {};
                            quest_record[type[0]][type[1]] = 1;

                            queue.quest_list.push(type);
                        }
                    }
                }
                if (queue.item_list.length === 0) {
                    finish = true;
                } else {
                    //清空
                    queue.item_list = [];
                    for (i in queue.quest_list) {
                        type = queue.quest_list[i];
                        quest = quest_list[type[0]][type[1]];
                        for (item in quest.drop_list) {
                            if (target_items[item] && !item_has_team[item]) {
                                item_has_team[item] = true;
                                queue.item_list.push(item);
                            }
                        }
                    }
                }
            }
        }

        ////分類任務
        //var type1, type2, item1, item2,
        //    item_has_team = {}, //記載是否分組了
        //    team = [],
        //    team_list = [];

        

        ////產生隊伍成員表
        //for (item1 in list) {
        //    item_has_team[item1] = false;
        //}
        //for (item1 in list) {
        //    if (item_has_team[item1]) continue; //已分組
        //    team = [];
        //    team.push(item1);
        //    item_has_team[item1] = true;

        //    for (item2 in list) {
        //        if (item_has_team[item2]) continue; //已分組

        //        if (check_has_same_quest(list[item1], list[item2])) {
        //            item_has_team[item2] = true;
        //            team.push(item2);
        //        }
        //    }
        //    team_list.push(team);
        //}

        ///*
        // * 比對兩個物品的關卡是否有重疊
        // * 
        // * @function check_has_same_quest
        // * @param {Object} list1 物品1的關卡清單 
        // * @param {Object} list2 物品2的關卡清單
        // * @return {Boolean} 
        // */
        //function check_has_same_quest(list1, list2) {
        //    var index1, index2;
        //    for (index1 in list1) {
        //        for (index2 in list2) {
        //            if (list1[index1].type[0] === list2[index2].type[0] &&
        //                list1[index1].type[1] === list2[index2].type[1]) {
        //                return true;
        //            }
        //        }
        //    }
        //    return false;
        //}

        //製造各隊伍的任務表
        var tmp_quest_list = {},
            i, j, item, quest, tmp_table = [],
            type1, type2;

        quest_table = [];

        for (team in team_list) {
            tmp_quest_list = {};
            tmp_table = [];
            for (i in team_list[team]) {
                item = team_list[team][i];
                for (j in list[item]) {
                    quest = list[item][j];
                    if (!tmp_quest_list[quest.type[0]]) tmp_quest_list[quest.type[0]] = {};
                    if (!tmp_quest_list[quest.type[0]][quest.type[1]]) tmp_quest_list[quest.type[0]][quest.type[1]] = 1;
                }
            }
            for (type1 in tmp_quest_list) {
                for (type2 in tmp_quest_list[type1]) {
                    tmp_table.push([type1, type2]);
                }
            }
            quest_table.push({ item_list: team_list[team], quest_list: tmp_table });
        }
    };

    /*
     * 設置PSO參數並啟用
     * 最後將結論透過callback回傳
     * 
     * @function get_result
     * @param {Function} callback 回傳資料給外界
     */
    var get_result = function (callback) {
        var i, i_max, j, j_max;
            //quest_times_list = {},
            //best_ans,
            //PSO_finish_state = null,
            //AP = 0,
            //quest_table_index = 0,
            //quest_table_length = quest_table.length;

        //initial
        quest_table_index = 0;
        quest_table_length = quest_table.length;
        quest_times_list = {};
        AP = 0;

        //for (i = 0, i_max = times_per_PSO; i < i_max; i += 1) {
        //    PSO_finish_state.push(0);
        //}

        onFinish.subscribe(function (type, args) {
            check_team_finish(args[0]);
        });

        start_PSO();

        /*
         * 
         */
        function start_PSO() {
            //initial
            best_ans = null;
            PSO_finish_state = 0;

            var index, item;
            var team_target_item = {};
            for (index in quest_table[quest_table_index].item_list) {
                item = quest_table[quest_table_index].item_list[index];
                team_target_item[item] = target_items[item];
            }

            for (j = 0, j_max = times_per_PSO; j < j_max; j += 1) {
                PSO[j].postMessage({
                    team: quest_table[quest_table_index],
                    quest_list: quest_list,
                    item2quest_list: item2quest_list,
                    target_items: team_target_item,
                    event: event_status
                });
            }
        }

        /*
         * 檢查同team其他worker是否結束
         * 更新quest_times_list
         */
        function check_team_finish(result) {
            //var finish_state = result.finish_state;
            //finish_state.count += 1;
            PSO_finish_state += 1;

            if (!best_ans || best_ans.fit > result.fit) {
                best_ans = result;
            }

            //檢查其他PSO是否都完成
            if (PSO_finish_state < times_per_PSO) {
                return;
            }

            //var quest_table = result.quest_table;
            //quest_table.index += 1;

            quest_table_index += 1;

            //PSO均完成, 更新quest_times_list及AP
            var list = best_ans.quest_times;
            
            //mix
            var type1, type2;
            for (type1 in list) {
                if (!quest_times_list[type1]) {
                    quest_times_list[type1] = {};
                }
                for (type2 in list[type1]) {
                    if (quest_times_list[type1][type2]) {
                        var bug = 1;
                    }
                    quest_times_list[type1][type2] = list[type1][type2];
                }
            }
            //JIE.base.marge(quest_times_list, list);
            AP += best_ans.fit;

            if (quest_table_index < quest_table_length) {
                next();
            } else {
                end();
            }
        }

        function next() {
            start_PSO();
        }

        function end() {
            onFinish.clear_all_subscribe();
            if (callback) callback({ times_list: quest_times_list, AP: AP, item_list: quest_manager.get_played_result_items(quest_times_list) });
        }

    };

    ///*
    // * 產生PSO的Options
    // * 
    // * @function creat_PSO_options
    // * @param  {Number} team_index 第幾個team的索引
    // * @return {Object} PSO_data PSO的Options
    // */
    //var creat_PSO_options = function (team) {
    //    var PSO_data = {};
    //    PSO_data.fn = create_fn();
    //    PSO_data.bound = create_bound();
    //    PSO_data.v_max = create_v_max();
    //    PSO_data.fixed_method = fixed_method;
    //    PSO_data.is_integer = true;
    //    PSO_data.is_minimazation = true;
    //    PSO_data.g_best = get_g_best();
    //    PSO_data.p_max = 40;
    //    PSO_data.iter_max = 4000;
    //    PSO_data.no_change_limit = 20;
        
    //    return PSO_data;

    //    /*
    //     * 製造目標函數
    //     * 
    //     * @function create_fn
    //     * @return {Object} fn 目標函數
    //     */
    //    function create_fn() {
    //        var fn = {};
    //        fn.length = team.quest_list.length;
    //        fn.get_fit = function () {
    //            var list = get_quest_times(arguments);
    //            var AP = quest_manager.get_played_result_AP(list);
    //            return AP;
    //        };
    //        return fn;
    //    };

    //    /*
    //     * 計算各關卡最多打幾場
    //     * 
    //     * @function create_bound
    //     */
    //    function create_bound() {
    //        var bound = [], type, i, quest, max, tmp, item;
    //        for (i in team.quest_list) {
    //            type = team.quest_list[i];
    //            quest = quest_list[type[0]][type[1]];
    //            max = null;
    //            for (item in team.item_list) {
    //                if (quest.drop_list[item]) {
    //                    tmp = Math.ceil(target_items[item] / quest.drop_list[item]);
    //                    if (!max || max < tmp) {
    //                        max = tmp;
    //                    }
    //                }
    //            }
    //            bound.push({ min: 0, max: max });
    //        }
    //        return bound;
    //    };

    //    /*
    //     * 設定每個關卡次數最多的增減數
    //     */
    //    function create_v_max() {
    //        var v_max = [], index, length;
    //        for (index = 0, length = team.quest_list.length; index < length; index += 1) {
    //            v_max.push(Math.ceil(PSO_data.bound[index].max / 10));
    //        }
    //        return v_max;
    //    };

    //    /*
    //     * 修正各關卡通關次數
    //     * 
    //     * @function fixed_method
    //     * @param  {Array}  arr   該team各關卡次數
    //     * @param  {Object} bound 該team各關卡上下限次數
    //     * @return {Object} ans   修正後關卡次數
    //     */
    //    function fixed_method(arr, bound) {
    //        var i, type, quest, item_list = {}, diff, ans = [], item;
    //        JIE.base.extend(ans, arr);

    //        for (i in ans) {
    //            if (ans[i] < bound[i].min) ans[i] = bound[i].min;
    //            if (ans[i] > bound[i].max) ans[i] = bound[i].max;
    //        }

    //        item_list = quest_manager.get_played_result_items(get_quest_times(arr, team));

    //        for (item in target_items) {
    //            if ((item_list[item] || 0) < target_items[item]) {
                    
    //                if (!item2quest_list[item] || !item2quest_list[item].length) continue;  //沒關卡有該道具

    //                diff = target_items[item] - item_list[item];
    //                type = item2quest_list[item][0].type;
    //                quest = quest_list[type[0]][type[1]];

    //                if (diff <= 0) continue; //充足

    //                for (i in team.quest_list) {
    //                    if (team.quest_list[i].toString() === type.toString()) {
    //                        ans[i] += Math.ceil(diff / quest.drop_list[item]);
    //                    }
    //                }
    //            }
    //        }

    //        return ans;
    //    };

    //    /*
    //     * 產生初始解
    //     * 先預設各關卡通關次數為0，再透過修正方法找出初始解
    //     */
    //    function get_g_best() {
    //        //產生初始解
    //        var arr = [], i;
    //        for (i in team.quest_list) {
    //            arr.push(0);
    //        }

    //        var args = fixed_method(arr, PSO_data.bound)
    //        var fit = quest_manager.get_played_result_AP(get_quest_times(args, team))

    //        return {
    //            args: args,
    //            fit: fit
    //        };
    //    };
    //};
    
    /*
     * 取得各關卡遊玩次數
     * 
     * @function get_quest_times
     * @param {Array} arr 各關卡通關次數
     * @param {Array} team 各組所包含的關卡
     * @return {Object} list
     * 
     * list = {
     *  "修煉場（週一）": {
     *      "弓超級": 3
     *  },
     *  ...
     * }
     */
    function get_quest_times(arr, team) {
        var i, i_max, type,
            list = {};
        for (i = 0, i_max = team.quest_list.length; i < i_max; i += 1) {
            type = team.quest_list[i];
            if (!list[type[0]]) list[type[0]] = {};
            list[type[0]][type[1]] = arr[i];
        }
        return list;
    };

    var set_quest_manager = function (manager) {
        quest_manager = manager;
        

    };

    return {
        //set_quest_list: set_quest_list,
        //set_item2quest_list: set_item2quest_list,
        set_target_item_list: set_target_item_list,
        get_result: get_result,
        set_quest_manager: set_quest_manager,
        set_event_status: set_event_status
    }
})();