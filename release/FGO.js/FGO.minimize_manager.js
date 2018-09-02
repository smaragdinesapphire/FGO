/**
 * 該程式用於將使用者資料轉換成LP-solve與PSO需要的格式
 * 並且呼叫LP-solve與PSO求解
 * 
 */

FGO.minimize_manager = (function () {
    var quest_list = {};
    var target_items = {};
    var item2quest_list = {};
    var event_status = {};
    var quest_manager = null;
    const LP_failed_limit = 10;
    let LP_failed_times;

    //record
    var quest_table = [];
    var quest_table_index = null;
    var quest_table_length = null;
    var quest_times_list = {};
    var PSO_finish_state = null;
    var AP = null;
    var LP_result_collection = [];
    var PSO_result_collection = [];
    var result_callback = null;
    var PSO_result_callback = null;
    var PSO_obj = {
        target_items: null,
        best: null
    };
    //worker
    var PSO = new Worker('release/FGO.js/FGO.PSO.js?' + FGO.ver);
    PSO.onmessage = function (e) {
        check_PSO_team_finish(e.data);
    };
    var LP_worker = new Worker("/release/LP_worker.js?" + FGO.ver);
    LP_worker.onmessage = function (e) {
        check_LP_team_finish(e.data);
    };
    //LP_worker.addEventListener('message', function (e) {
    //    check_LP_team_finish(e.data);
    //}, false);

    function set_quest_manager(manager) {
        quest_manager = manager;
    }

    function set_event_status(event) {
        event_status = event;
        quest_manager.set_event(event);
    }

    /**
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
    function set_target_item_list(list) {
        target_items = list;
        quest_list = quest_manager.get_specify_quest_list({ get_CP: false, schedule: true, item: true, event: true });
        item2quest_list = quest_manager.get_specify_item2quest_list({ get_CP: false, schedule: true, item: true, event: true });
        set_item2quest_list();
    }

    /**
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
    function set_item2quest_list() {
        var tmp_list = {};
        for (var name in target_items) {
            tmp_list[name] = item2quest_list[name];
        }
        get_quest_table(tmp_list);
    }

    function get_quest_table(item2quest_list) {
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

        for (item in list) {
            if (!item_has_team[item]) {
                queue.item_list = [];  //清空
                queue.quest_list = [];
                team = [];

                queue.item_list.push(item);

                create_team();
                team_list.push(team);
            }
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

        //製造各隊伍的任務表
        var tmp_quest_list = {},
            i, j, item, quest, tmp_table = [],
            type1, type2, has_quest;

        while (quest_table.length) {
            quest_table.pop();
        }

        for (team in team_list) {
            has_quest = false;
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
                    has_quest = true;
                }
            }
            if (has_quest) {
                quest_table.push({ item_list: team_list[team], quest_list: tmp_table });
            }
            else {
                var debug = 0;
            }
        }
    }

    function get_result(callback) {
        result_callback = callback;
        LP_failed_times = 0;
        get_LP_result();
    }

    function get_LP_result() {
        //initial
        quest_table_index = 0;
        quest_table_length = quest_table.length;
        LP_result_collection.length = 0;

        if (quest_table_length) {
            start_LP();
        }
        else {
            if (result_callback) result_callback({
                times_list: {},
                AP: 0,
                item_list: {}
            });
        }
    }
    function start_LP() {
        var index, item;
        var team_target_item = {};
        for (index in quest_table[quest_table_index].item_list) {
            item = quest_table[quest_table_index].item_list[index];
            team_target_item[item] = target_items[item];
        }
        if (quest_table[quest_table_index].quest_list.length) {
            var data = get_LP_data({
                team: quest_table[quest_table_index],
                quest_list: quest_list,
                item2quest_list: item2quest_list,
                target_items: team_target_item,
                event: event_status
            });
            //LP_worker.postMessage({ data: data, ver: FGO.ver, maxNumTableaus: quest_table[quest_table_index].item_list.length * 100 });
            LP_worker.postMessage({ data: data, ver: FGO.ver});
        }
    }
    function end_LP() {
        var result,
            tmp_arr,
            times,
            quest_index,
            type,
            tmp_quest_times_list = {},
            base_times_list = {},
            less_best_times_list = {},
            debug_less_best_times_list = {},
            base_item_list,
            enough = true,
            tmp_result;
        
        /**
         * 取得LP解, 解析成:
         * 1.必要過關次數(無條件捨去)
         * 2.LP最差最佳解(無條件進位)
         */
        for (var index1 in LP_result_collection) {
            result = LP_result_collection[index1];
            tmp_arr = result.match(/q\d+ = [\d\/]+/g);

            for (var index2 in tmp_arr) {
                quest_index = Number(tmp_arr[index2].match(/\d+/ig)[0]);
                times = getNum(tmp_arr[index2].replace(/q\d+ = /, ""));
                if (times) {
                    type = quest_table[index1].quest_list[quest_index];
                    if (!tmp_quest_times_list[type[0]]) {
                        tmp_quest_times_list[type[0]] = {};
                        base_times_list[type[0]] = {};
                        less_best_times_list[type[0]] = {};
                        debug_less_best_times_list[type[0]] = {};
                    }
                    tmp_quest_times_list[type[0]][type[1]] = times;
                    base_times_list[type[0]][type[1]] = Math.floor(times);
                    less_best_times_list[type[0]][type[1]] = Math.ceil(times) - base_times_list[type[0]][type[1]];
                    debug_less_best_times_list[type[0]][type[1]] = Math.ceil(times);
                }
            }
        }

        function getNum(str) {
            var arr = str.split("/");
            if (arr.length === 2) {
                return arr[0] / arr[1];
            }
            else {
                return Number(arr);
            }
        }

        //check LP 是否都符合限制條件
        var isFailed = false;
        if (LP_failed_times < LP_failed_limit) {
            var ceil_result = quest_manager.get_played_result(debug_less_best_times_list, event_status);   //debug ceil
            for (var item in ceil_result.item_list) {
                if (ceil_result.item_list[item] < target_items[item]) {
                    isFailed = true;
                    break;
                }
            }
            if (isFailed) {
                LP_failed_times += 1;
                setTimeout(get_LP_result, 0);
            }
        }
        else {
            console.log("LP-solve failed " + LP_failed_limit + "times.");
        }

        //final calculate - PSO
        if (!isFailed) {    
            base_item_list = quest_manager.get_played_result_items(base_times_list);

            //從基礎通關次數找出缺少的目標項目數量
            var new_target_item_list = {};
            var value;
            for (var item in target_items) {
                value = target_items[item] - base_item_list[item];
                if (value > 0) {
                    new_target_item_list[item] = value;
                    if (enough) {
                        enough = false;
                    }
                }
            }
            PSO_obj.target_items = new_target_item_list;
            PSO_obj.best = less_best_times_list;

            //有不足的
            if (!enough) {
                get_PSO_result(function () {
                    //mix ans
                    for (var i in PSO_result_collection) {
                        for (var type1 in PSO_result_collection[i].quest_times) {

                            for (var type2 in PSO_result_collection[i].quest_times[type1]) {
                                if (PSO_result_collection[i].quest_times[type1][type2] > 0) {
                                    if (!base_times_list[type1]) {
                                        base_times_list[type1] = {};
                                    }
                                    base_times_list[type1][type2] = base_times_list[type1][type2] ? base_times_list[type1][type2] : 0;
                                    base_times_list[type1][type2] += PSO_result_collection[i].quest_times[type1][type2];
                                }
                            }
                        }
                    }

                    tmp_result = quest_manager.get_played_result(base_times_list, event_status);

                    if (result_callback) result_callback({
                        times_list: base_times_list,
                        AP: tmp_result.AP,
                        item_list: tmp_result.item_list
                    });
                });
            }
            else {
                tmp_result = quest_manager.get_played_result(base_times_list, event_status);
                if (result_callback) result_callback({
                    times_list: base_times_list,
                    AP: tmp_result.AP,
                    item_list: tmp_result.item_list
                });

                //tmp_result = quest_manager.get_played_result(debug_less_best_times_list, event_status);   //debug ceil
                //if (result_callback) result_callback({
                //    times_list: debug_less_best_times_list,
                //    AP: tmp_result.AP,
                //    item_list: tmp_result.item_list
                //});

                //tmp_result = quest_manager.get_played_result(tmp_quest_times_list, event_status);   //debug original
                //if (result_callback) result_callback({
                //    times_list: tmp_quest_times_list,
                //    AP: tmp_result.AP,
                //    item_list: tmp_result.item_list
                //});
            }
        }
    }

    function get_LP_data(obj) {
        var str_arr = [],
            tmp_arr,
            integer_arr = [],
            AP, questArr,
            item, p;
        var index1, index2;
        //create optimize function
        str_arr.push("Minimize ");
        tmp_arr = [];
        for (index1 in obj.team.quest_list) {
            questArr = obj.team.quest_list[index1];
            AP = obj.quest_list[questArr[0]][questArr[1]].AP;
            tmp_arr.push(AP + "Q" + index1);
            integer_arr.push("Q" + index1);
        }
        str_arr.push(tmp_arr.join("+"));
        str_arr.push(" subject to \n");

        //create sub function
        for (index1 in obj.team.item_list) {
            tmp_arr = [];
            item = obj.team.item_list[index1];
            for (index2 in obj.team.quest_list) {
                questArr = obj.team.quest_list[index2];
                p = obj.quest_list[questArr[0]][questArr[1]].drop_list[item];
                if (p) {
                    tmp_arr.push(p + "Q" + index2);
                }
            }
            str_arr.push(tmp_arr.join("+"));
            str_arr.push(">=" + obj.target_items[item] + "\n");
        }

        //str_arr.push("integer ");
        //str_arr.push(integer_arr.join(","));

        return str_arr.join("");
    }

    function check_LP_team_finish(result) {
        LP_result_collection.push(result);
        quest_table_index += 1;
        if (quest_table_index < quest_table_length) {
            start_LP();
        }
        else {
            end_LP();
        }
    }

    function get_PSO_result(callback) {
        var index, item;

        //initial
        PSO_result_collection.length = 0;
        quest_table_index = 0;
        PSO_result_callback = callback;

        start_PSO();
    }

    function start_PSO() {
        var team_target_item = {};
        for (index in quest_table[quest_table_index].item_list) {
            item = quest_table[quest_table_index].item_list[index];
            team_target_item[item] = PSO_obj.target_items[item];
        }
        PSO.postMessage({
            team: quest_table[quest_table_index],
            quest_list: quest_list,
            item2quest_list: item2quest_list,
            target_items: team_target_item,
            event: event_status,
            best: PSO_obj.best
        });
    }

    function check_PSO_team_finish(result) {
        quest_table_index += 1;
        PSO_result_collection.push(result);

        if (quest_table_index < quest_table_length) {
            start_PSO();
        }
        else {
            if (PSO_result_callback) {
                PSO_result_callback();
            }
        }
    }

    return {
        set_event_status: set_event_status,
        set_target_item_list: set_target_item_list,
        set_quest_manager: set_quest_manager,
        get_result: get_result
    }
})();