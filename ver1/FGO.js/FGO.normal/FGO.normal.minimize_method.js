FGO.normal.minimized_method = function () {
    var quest_data_manager = FGO.normal.quest_data_manager();
    var user_data = null;
    var original_quest_list = quest_data_manager.get_all_quest_list();
    var all_quest_list = null;
    var useful_quest_list = null;
    var useful_item2quest_list = null;
    var optimized_quest_list = [];
    var no_optimized_quest_list = [];

    var default_ans = null;
    var final_ans = null;

    var default_ans_ap = 0; //test

    var PSO_again = 3;

    function get_optimization() {
        reset_data();
        get_all_quest_list();
        classify_quest();
        optimize();
        return final_ans;
    }

    function reset_data() {
        useful_quest_list = null;
        useful_item2quest_list = null;
        optimized_quest_list = [];
        no_optimized_quest_list = [];
        default_ans = {};
        final_ans = {
            quest_count_list: {},
            AP: null,
            item_list: {},
            no_support: {
                item_list: {},
                length: 0
            }
        };
        all_quest_list = {};
    }

    function get_all_quest_list() {
        var i, j, k, AP;
        JIE.base.extendDeep(all_quest_list, original_quest_list);
        for (i in all_quest_list) {
            if (i === "每日任務") {
                if (user_data.event["訓練場體力減半"] != 1) continue;
            } else {
                if (user_data.event["FQ體力減半"] != 1) continue;
            }
            for (j in all_quest_list[i]) {
                for (k in all_quest_list[i][j]) {
                    AP = Math.floor(all_quest_list[i][j][k].AP / 2);
                    all_quest_list[i][j][k].AP = (AP !== 0) ? AP : 1;
                }
            }
        }
    }

    function classify_quest() {
        var filter_list = {};
        filter_list.quest_list = [];
        filter_list.item_list = [];
        var schedule_list = quest_data_manager.get_schedule();
        var boss_need_optimize, target_need_optimize, quest_boss, quest_target, type, team;
        var i, i_max, item, j, quest_count;

        //schedule
        filter_list.quest_list.push("每日任務");

        for (i = 0, i_max = schedule_list.length; i < i_max; i += 1) {
            filter_list.quest_list.push(schedule_list[i]);
            if (schedule_list[i] === user_data.schedule) break;
        }

        //item
        for (item in user_data.target_item) {
            filter_list.item_list.push(item);
        }

        useful_item2quest_list = quest_data_manager.get_item2quest_list_by_filter(filter_list);

        useful_quest_list = quest_data_manager.transform_item2quest(useful_item2quest_list);

        //區分是否最佳化的關卡
        quest_count = useful_quest_list.length;
        for (i = 0; i < quest_count; i += 1) {
            if (useful_quest_list[i].need_optimize === true) continue;
            boss_need_optimize = false;
            type = useful_quest_list[i].type;
            quest_boss = all_quest_list[type[0]][type[1]][type[2]];
            team = [];

            for (j = i + 1; j < quest_count; j += 1) {
                if (useful_quest_list[j].need_optimize === true) continue;
                target_need_optimize = false;
                type = useful_quest_list[j].type;
                quest_target = all_quest_list[type[0]][type[1]][type[2]];

                for (item in quest_boss.drop) {
                    if (!user_data.target_item[item]) continue;
                    if (useful_item2quest_list[item].length === 1) continue;
                    if (quest_target.drop[item]) {
                        target_need_optimize = true;
                        useful_quest_list[j].need_optimize = true;
                        break;
                    }
                }

                if (target_need_optimize) {
                    if (!boss_need_optimize) boss_need_optimize = true;
                    if (useful_quest_list[i].need_optimize === undefined) {
                        useful_quest_list[i].need_optimize = true;
                        team.push(useful_quest_list[i]);
                    }

                    team.push(useful_quest_list[j]);
                }
            }

            if (boss_need_optimize) {
                optimized_quest_list.push(team);
            } else {
                no_optimized_quest_list.push(useful_quest_list[i]);
            }
        }
    }

    function get_default_ans() {
        var item, item_count, quest, type, time;
        for (item in useful_item2quest_list) {
            //無該道具掉落
            if (!useful_item2quest_list[item].length) {
                final_ans.no_support.item_list[item] = user_data.target_item[item];
                final_ans.no_support.length += 1;
                continue;
            }

            item_count = user_data.target_item[item];
            type = useful_item2quest_list[item][0].type;
            quest = all_quest_list[type[0]][type[1]][type[2]];

            time = Math.ceil(item_count / quest.drop[item]);

            if (default_ans[type[0]] === undefined) default_ans[type[0]] = {};
            if (default_ans[type[0]][type[1]] === undefined) default_ans[type[0]][type[1]] = {};
            if (default_ans[type[0]][type[1]][type[2]] === undefined) {
                default_ans[type[0]][type[1]][type[2]] = time;
            } else {
                if (default_ans[type[0]][type[1]][type[2]] < time) {
                    default_ans[type[0]][type[1]][type[2]] = time;
                }
            }

        }
        default_ans_ap = get_AP(default_ans);   //test
    }

    function optimize() {
        var iter, best_ans;
        get_default_ans();
        if (optimized_quest_list.length !== 0) {
            //PSO part
            var team, PSO_data, PSO, ans_obj, PSO_ans, quest_count_obj;
            for (team in optimized_quest_list) {
                PSO_data = create_PSO_data(optimized_quest_list[team]);
                best_ans = null;
                for (iter = 0; iter < PSO_again; iter += 1) {
                    PSO = new JIE.optimization.PSO(PSO_data);
                    PSO_ans = PSO.play();
                    if (best_ans === null) best_ans = PSO_ans;
                    else if (best_ans.fit > PSO_ans.fit) best_ans = PSO_ans;
                }
                
                //quest_count_obj = PSO_ans_parser(PSO_ans, PSO_data.quest_list);
                quest_count_obj = PSO_ans_parser(best_ans, PSO_data.quest_list);
                JIE.base.margeDeep(final_ans.quest_count_list, quest_count_obj);
            }

            function PSO_ans_parser(ans, quest_list) {
                var obj = {};
                var quest, type, index;
                for (index in quest_list) {
                    type = quest_list[index].type;
                    if (obj[type[0]] === undefined) obj[type[0]] = {};
                    if (obj[type[0]][type[1]] === undefined) obj[type[0]][type[1]] = {};
                    obj[type[0]][type[1]][type[2]] = ans.args[index];
                }
                return obj;
            }

            final_ans.item_list = get_item_list(final_ans.quest_count_list);

            //Less part
            var item, diff, time, type, quest, count;
            for (item in user_data.target_item) {
                if (final_ans.item_list[item] > user_data.target_item[item]) continue;
                if (!useful_item2quest_list[item].length) continue;
                diff = user_data.target_item[item] - (final_ans.item_list[item] || 0);
                type = useful_item2quest_list[item][0].type;
                quest = all_quest_list[type[0]][type[1]][type[2]];
                time = Math.ceil(diff / quest.drop[item]);
                if (final_ans.quest_count_list[type[0]] === undefined) final_ans.quest_count_list[type[0]] = {};
                if (final_ans.quest_count_list[type[0]][type[1]] === undefined) final_ans.quest_count_list[type[0]][type[1]] = {};
                if (final_ans.quest_count_list[type[0]][type[1]][type[2]] === undefined) final_ans.quest_count_list[type[0]][type[1]][type[2]] = 0;
                final_ans.quest_count_list[type[0]][type[1]][type[2]] += time;
            }

            final_ans.item_list = get_item_list(final_ans.quest_count_list);
            final_ans.AP = get_AP(final_ans.quest_count_list);
        } else {
            final_ans.quest_count_list = default_ans;
            final_ans.AP = get_AP(default_ans);
            final_ans.item_list = get_item_list(default_ans);
        }
        return final_ans;
    }

    function create_PSO_data(quest_list) {
        var PSO_data = {};
        PSO_data.quest_list = quest_list;
        PSO_data.fn = create_fn();
        PSO_data.bound = create_bound();
        PSO_data.v_max = create_v_max();
        PSO_data.fixed_method = fixed_method;
        PSO_data.is_integer = true;
        PSO_data.is_minimazation = true;
        //PSO_data.advanced_search = advanced_search;
        PSO_data.g_best = get_g_best();
        PSO_data.p_max = 40;
        PSO_data.iter_max = 4000;
        PSO_data.no_change_limit = 20;

        function create_fn() {
            var fn = {};
            fn.length = quest_list.length;
            fn.get_fit = function () {
                var i, length = quest_list.length, type, AP = 0;
                for (i = 0; i < length; i++) {
                    type = quest_list[i].type;
                    AP += all_quest_list[type[0]][type[1]][type[2]].AP * arguments[i];
                }
                return AP;
            };
            return fn;
        }
        function create_bound() {
            //create bound
            var bound = [], max, quest, index, type, item, time, length;
            for (index = 0, length = quest_list.length; index < length; index += 1) {
                type = quest_list[index].type;
                quest = all_quest_list[type[0]][type[1]][type[2]];
                max = 0;
                for (item in quest.drop) {
                    if (user_data.target_item[item]) {
                        time = Math.ceil(user_data.target_item[item] / quest.drop[item]);
                        if (time > max) max = time;
                    }
                }
                bound.push({
                    min: 0,
                    max: max
                });
            }
            return bound;
        }
        function create_v_max() {
            var v_max = [], index, length;
            for (index = 0, length = quest_list.length; index < length; index += 1) {
                v_max.push(Math.ceil(PSO_data.bound[index].max / 10));
            }
            return v_max;
        }
        function fixed_method(arr, bound) {
            var i, type, quest, item_list = {}, diff, ans = [], item;
            JIE.base.extend(ans, arr);

            for (i in ans) {
                if (ans[i] < bound[i].min) ans[i] = bound[i].min;
                if (ans[i] > bound[i].max) ans[i] = bound[i].max;

                type = quest_list[i].type;
                quest = all_quest_list[type[0]][type[1]][type[2]];
                for (item in quest.drop) {
                    if (user_data.target_item[item]) {
                        if (item_list[item] === undefined) item_list[item] = 0;
                        item_list[item] += quest.drop[item] * ans[i];
                    }
                }
            }

            for (item in user_data.target_item) {
                if ((item_list[item] || 0) < user_data.target_item[item]) {
                    //沒關卡有該道具
                    if (!useful_item2quest_list[item].length) continue;
                    diff = user_data.target_item[item] - item_list[item];
                    type = useful_item2quest_list[item][0].type;
                    quest = all_quest_list[type[0]][type[1]][type[2]];
                    
                    for (i in quest_list) {
                        if (quest_list[i].type.toString() === type.toString()) {
                            ans[i] += Math.ceil(diff / quest.drop[item]);
                        }
                    }
                }
            }

            return ans;
        }
        function advanced_search(p, fn, fixed_method) {
            var bound = [];
            var i, length = p.length;
            var ans;
            for (i = 0; i < length; i++) {
                bound.push({ min: ((p[i] - 10 > 0) ? p[i] - 10 : 0), max: ((p[i] - 10 > 0) ? p[i] + 10 : 10) });
            }

            var PSO = new JIE.optimization.PSO({
                quest_list: PSO_data.quest_list,
                fn: PSO_data.fn,
                bound: bound,
                v_max: create_v_max_fix(),
                fixed_method: fixed_method,
                is_integer: true,
                is_minimazation: true,
                p_max: 40,
                iter_max: 4000,
                no_change_limit: 20
            })
            ans = PSO.play();

            function create_v_max_fix() {
                var v_max = [], index, length;
                for (index = 0, length = quest_list.length; index < length; index += 1) {
                    v_max.push(5);
                }
                return v_max;
            }

            return ans.args;
        }
        function get_g_best() {
            var index, arr = [], fit = 0, type, quest, time;
            for (index in quest_list) {
                type = quest_list[index].type;
                if (default_ans[type[0]] && default_ans[type[0]][type[1]] && default_ans[type[0]][type[1]][type[2]]) {
                    time = default_ans[type[0]][type[1]][type[2]];
                } else {
                    time = 0;
                }
                arr.push(time);
                fit += all_quest_list[type[0]][type[1]][type[2]].AP * time;
            }
            return {
                args: arr,
                fit: fit
            };
        }

        return PSO_data;
    }

    function get_item_list(quest_count_list) {
        var item_list = {};
        var item, time, quest;
        var i, j, k;
        for (i in quest_count_list) {
            for (j in quest_count_list[i]) {
                for (k in quest_count_list[i][j]) {
                    time = quest_count_list[i][j][k];
                    if (!time) continue;
                    quest = all_quest_list[i][j][k];
                    for (item in quest.drop) {
                        if (item_list[item] === undefined) item_list[item] = 0;
                        item_list[item] += time * quest.drop[item];
                    }
                }
            }
        }
        return item_list;
    }

    function get_AP(quest_count_list) {
        var i, j, k, AP = 0, time;
        for (i in quest_count_list) {
            for (j in quest_count_list[i]) {
                for (k in quest_count_list[i][j]) {
                    time = quest_count_list[i][j][k];
                    AP += all_quest_list[i][j][k].AP * time;
                }
            }
        }
        return AP;
    }

    return {
        /*
         * user_data = {
         *  schedule: "第二特異點",
         *  target_item: {
         *      "劍之魔石": 3,
         *      "...": 2,
         *      ...
         *  }
         * }
         * 
         * @method set_data
         * @param  {Object} 資料結構如上
         */
        set_data: function (data) {
            user_data = data;
            
        },
        get_minimization: function () {
            return get_optimization();
        }
    }
};