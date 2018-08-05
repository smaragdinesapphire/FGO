﻿/*
 * 該程式為worker所載入之js
 */
self.addEventListener('message', function (e) {
    //for web
    if (typeof JIE === 'undefined') {
        importScripts("/FGO/release/JIE.js/JIE.min.js");
        importScripts("/FGO/release/JIE.js/JIE.base.min.js");
        importScripts("/FGO/release/JIE.js/JIE.math.min.js");
        importScripts("/FGO/release/JIE.js/JIE.optimization/JIE.optimization.PSO.min.js");
        importScripts("/FGO/release/FGO.js/FGO.min.js");
        importScripts("/FGO/release/FGO.js/FGO.info_manager.min.js");
        importScripts("/FGO/release/FGO.js/FGO.info.min.js");
        //JIE.isDebug = true;
    }

    ////for local
    //if (typeof JIE === 'undefined') {
    //    importScripts("/release/JIE.js/JIE.min.js");
    //    importScripts("/release/JIE.js/JIE.base.min.js");
    //    importScripts("/release/JIE.js/JIE.math.min.js");
    //    importScripts("/release/JIE.js/JIE.optimization/JIE.optimization.PSO.min.js");
    //    importScripts("/release/FGO.js/FGO.min.js");
    //    importScripts("/release/FGO.js/FGO.info_manager.min.js");
    //    importScripts("/release/FGO.js/FGO.info.min.js");
    //    //JIE.isDebug = true;
    //}

    var obj = e.data;
    var team = obj.team;
    var quest_list = obj.quest_list;
    var item2quest_list = obj.item2quest_list;
    var target_items = obj.target_items;
    //var finish_state = obj.finish_state;
    //var quest_table = obj.quest_table;

    var quest_manager = FGO.info_manager;

    var options = (function (team) {
        var PSO_data = {};
        PSO_data.fn = create_fn();
        PSO_data.bound = create_bound();
        PSO_data.v_max = create_v_max();
        PSO_data.fixed_method = fixed_method;
        PSO_data.is_integer = true;
        PSO_data.is_minimazation = true;
        PSO_data.g_best = get_g_best();
        PSO_data.p_max = 40;
        PSO_data.iter_max = 4000;
        PSO_data.no_change_limit = 20;

        return PSO_data;

        /*
         * 製造目標函數
         * 
         * @function create_fn
         * @return {Object} fn 目標函數
         */
        function create_fn() {
            var fn = {};
            fn.length = team.quest_list.length;
            fn.get_fit = function () {
                var list = get_quest_times(arguments, team);
                var AP = quest_manager.get_played_result_AP(list);
                return AP;
            };
            return fn;
        };

        /*
         * 計算各關卡最多打幾場
         * 
         * @function create_bound
         */
        function create_bound() {
            var bound = [], type, i, quest, max, tmp, item, index;
            for (i in team.quest_list) {
                type = team.quest_list[i];
                quest = quest_list[type[0]][type[1]];
                max = null;
                for (index in team.item_list) {
                    item = team.item_list[index];
                    if (quest.drop_list[item]) {
                        tmp = Math.ceil(target_items[item] / quest.drop_list[item]);
                        if (!max || max < tmp) {
                            max = tmp;
                        }
                    }
                }
                bound.push({ min: 0, max: max });
            }
            return bound;
        };

        /*
         * 設定每個關卡次數最多的增減數
         */
        function create_v_max() {
            var v_max = [], index, length;
            for (index = 0, length = team.quest_list.length; index < length; index += 1) {
                v_max.push(Math.ceil(PSO_data.bound[index].max / 10));
            }
            return v_max;
        };

        /*
         * 修正各關卡通關次數
         * 
         * @function fixed_method
         * @param  {Array}  arr   該team各關卡次數
         * @param  {Object} bound 該team各關卡上下限次數
         * @return {Object} ans   修正後關卡次數
         */
        function fixed_method(arr, bound) {
            var i, type, quest, item_list = {}, diff, ans = [], item;
            JIE.base.extend(ans, arr);

            for (i in ans) {
                if (ans[i] < bound[i].min) ans[i] = bound[i].min;
                if (ans[i] > bound[i].max) ans[i] = bound[i].max;
            }

            item_list = quest_manager.get_played_result_items(get_quest_times(ans, team));

            for (item in target_items) {
                if ((item_list[item] || 0) < target_items[item]) {

                    if (!item2quest_list[item] || !item2quest_list[item].length) continue;  //沒關卡有該道具

                    diff = target_items[item] - (item_list[item] || 0);
                    type = item2quest_list[item][0].type;
                    quest = quest_list[type[0]][type[1]];

                    //if (diff <= 0) continue; //充足

                    for (i in team.quest_list) {
                        if (team.quest_list[i].toString() === type.toString()) {
                            ans[i] += Math.ceil(diff / quest.drop_list[item]);

                            //test
                            var count = ans[i] * quest.drop_list[item];

                            break;
                        }
                    }
                }
            }

            return ans;
        };

        /*
         * 產生初始解
         * 先預設各關卡通關次數為0，再透過修正方法找出初始解
         */
        function get_g_best() {
            //產生初始解
            var arr = [], i;
            for (i in team.quest_list) {
                arr.push(0);
            }

            var args = fixed_method(arr, PSO_data.bound)
            //var fit = quest_manager.get_played_result_AP(get_quest_times(args, team))
            var fit = (function (list) {
                var AP = 0,
                quest = null,
                type1, type2, times;

                    for (type1 in list) {
                        for (type2 in list[type1]) {
                            quest = quest_list[type1][type2];
                            times = list[type1][type2]
                            AP += quest.AP * times;
                        }
                    }

                return AP;
            })(get_quest_times(args, team));

            return {
                args: args,
                fit: fit
            };
        };
    })(team);

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

    var PSO = new JIE.optimization.PSO(options);
    var result = PSO.play();

    result.quest_times = get_quest_times(result.args, team);
    //result.finish_state = finish_state;
    //result.quest_table = quest_table;


    self.postMessage(result);

}, false);