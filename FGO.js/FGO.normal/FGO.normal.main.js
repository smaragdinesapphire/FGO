/*
 * 產生介面及連動數據
 * 
 * @function main
 */
FGO.normal.main = function () {

    //資料處理
    var quest_data_manager = FGO.normal.quest_data_manager();
    var schedule_list = quest_data_manager.get_schedule();
    var all_item_list = quest_data_manager.get_item_list();

    //節點處理
    var node = document.querySelector("#user_input .chess");
    var user_chess_list = create_chess_grid(document.querySelector("#user_input .chess"));   //棋子與餅乾
    var user_item_list = create_item_grid(document.querySelector("#user_input .item"));      //其他素材(銅銀金)
    var schedule_node = create_schedule_options(document.querySelector("#user_input .schedule"), schedule_list);                //進度
    var event_node = document.querySelector("#user_input .event");
    var result_quest = document.querySelector("#result .quest .grid_area");
    var result_item = document.querySelector("#result .item .grid_area");
    var result_AP = document.querySelector("#result .AP_result");

    //test
    if (JIE.debug) {
        var count = 0;
        for (var key in user_chess_list) {
            user_chess_list[key].value = 1;
            count += 1;
            //if (count >= 10) break;
        }
    }

    var user_data = {};
        user_data.target_item = {};
        user_data.event = {};
        user_data.schedule = null;

        var schedule_default = schedule_list[schedule_list.length - 1];
    schedule_node.value = schedule_default;

    var reset_btn = document.querySelector("#user_input .reset");
    var start_btn = document.querySelector("#user_input .start");
    reset_btn.onclick = function () { reset_data(); };
    start_btn.onclick = function () {
        var useful = get_data();
        var ans = null;
        if (!useful) return;
        minimazed_method.set_data(user_data);
        ans = minimazed_method.get_minimization();
        create_result_grid(ans);
    };

    var minimazed_method = FGO.normal.minimized_method();

    //===== 資料重置 =====
    function reset_data() {
        var key;
        for (key in user_chess_list) {
            user_chess_list[key].value = 0;
        }
        for (key in user_item_list) {
            user_item_list[key].value = 0;
        }
        schedule_node.value = schedule_default;
        
    }

    //===== 收集資料 =====
    function get_data() {
        var key, node, useful = false;
        user_data = {};
        user_data.target_item = {};
        user_data.event = {};
        user_data.schedule = null;

        for (key in user_chess_list) {
            if (user_chess_list[key].value > 0) {
                user_data.target_item[key] = user_chess_list[key].value;
                if (!useful) useful = true;
            }
        }
        for (key in user_item_list) {
            if (user_item_list[key].value > 0) {
                user_data.target_item[key] = user_item_list[key].value;
                if (!useful) useful = true;
            }
        }
        
        for (i = 0, i_max = event_node.children.length; i < i_max; i++) {
            node = event_node.children[i];
            if (node.type === "checkbox") {
                if (node.checked) user_data.event[node.value] = 1;
            }
        }
        user_data.schedule = schedule_node.value;

        return useful;
    }

    //===== 產生使用者輸入介面 =====
    /*
     * 產生輸入棋子與餅乾的function
     * 
     * @function user_input_1
     * param {Object} 目標節點
     */
    function create_chess_grid(node) {
        var table = NewObj("table", "grid");

        var input_list1 = all_item_list.chess_and_stone.class_list,
            input_list2 = all_item_list.chess_and_stone.name_list;
        var i, i_max, j, j_max,
            tr, td, input;
        var input_data = {};

        tr = NewObj("tr", "tr");
        for (i = 0; i < 5; i++) {
            tr.appendChild(NewObj("td", "header", "名稱"));
            tr.appendChild(NewObj("td", "header", "數量"));
        }
        table.appendChild(tr);

        for (i = 0, i_max = input_list1.length; i < i_max; i++) {
            tr = NewObj("tr", "tr");
            for (j = 0, j_max = input_list2.length; j < j_max; j++) {

                input = num_input();

                tr.appendChild(NewObj("td", "", input_list1[i] + input_list2[j]));
                td = NewObj("td","",input);
                tr.appendChild(td);

                input_data[input_list1[i] + input_list2[j]] = input;
            }
            table.appendChild(tr);
        }

        node.appendChild(table);
        return input_data;
    }
    function create_item_grid(node) {
        var copper = all_item_list.other_items.copper,
            silver = all_item_list.other_items.silver,
            gold = all_item_list.other_items.gold;
        var tr, td;
        var copper_list, silver_list, gold_list, all_list = {};

        var copper_table = NewObj("table", "copper");
        tr = NewObj("tr");
        tr.appendChild(NewObj("td", "header", "銅素材名稱"));
        tr.appendChild(NewObj("td", "header", "數量"));
        copper_table.appendChild(tr);
        copper_list = create_item(copper_table, copper);
        
        var silver_table = NewObj("table", "silver");
        tr = NewObj("tr");
        tr.appendChild(NewObj("td", "header", "銀素材名稱"));
        tr.appendChild(NewObj("td", "header", "數量"));
        silver_table.appendChild(tr);
        silver_list = create_item(silver_table, silver);

        var gold_table = NewObj("table", "gold");
        tr = NewObj("tr");
        tr.appendChild(NewObj("td", "header", "金素材名稱"));
        tr.appendChild(NewObj("td", "header", "數量"));
        gold_table.appendChild(tr);
        gold_list = create_item(gold_table, gold);

        node.appendChild(copper_table);
        node.appendChild(silver_table);
        node.appendChild(gold_table);

        extend(all_list, copper_list);
        extend(all_list, silver_list);
        extend(all_list, gold_list);

        return all_list;

        function create_item(node, arr) {
            var i, i_max, tr, td, input;
            var input_list = {};
            for (i = 0, i_max = arr.length; i < i_max; i++) {
                tr = NewObj("tr");
                td = NewObj("td", "", arr[i]);
                input = num_input();

                tr.appendChild(td);
                tr.appendChild(input);
                node.appendChild(tr);

                input_list[arr[i]] = input;
            }
            return input_list;
        }
        function extend(target, source) {
            for (var key in source) {
                target[key] = source[key];
            }
        }
    }
    function num_input() {
        var input = NewObj("input");
        input.type = "text";
        input.value = "0";
        
        var backup = 0;
        input.addEventListener("change", function (event) {
            var x = Number(this.value);
            if (isNaN(x)) this.value = backup;
            else {
                
                backup = this.value = x >= 0 ? x : 0;
            }
        });

        return input;
    }
    function create_schedule_options(node, list) {
        var i, i_max, option;
        for (i = 0, i_max = list.length; i < i_max; i++) {
            option = NewObj("option", "", list[i]);
            option.value = list[i];
            node.appendChild(option);
        }
        return node;
    }
    function create_result_grid(data) {
        //remove odd grid
        while (result_quest.firstChild) {
            result_quest.removeChild(result_quest.firstChild);
        }
        while (result_item.firstChild) {
            result_item.removeChild(result_item.firstChild);
        }

        //AP
        result_AP.innerText = data.AP;

        //quest
        var header = NewObj("tr");
        header.appendChild(NewObj("td", "header", "任務種類"));
        header.appendChild(NewObj("td", "header", "任務區域"));
        header.appendChild(NewObj("td", "header", "任務副本"));
        header.appendChild(NewObj("td", "header", "次數"));
        result_quest.appendChild(header);
        
        var i, j, k, tr, td;
        for (i in data.quest_count_list) {
            for (j in data.quest_count_list[i]) {
                for (k in data.quest_count_list[i][j]) {
                    if (data.quest_count_list[i][j][k] === 0) continue;
                    tr = NewObj("tr");
                    tr.appendChild(NewObj("td", "", i));
                    tr.appendChild(NewObj("td", "", j));
                    tr.appendChild(NewObj("td", "", k));
                    tr.appendChild(NewObj("td", "", data.quest_count_list[i][j][k]));
                    result_quest.appendChild(tr);
                }
            }
        }

        //item
        header = NewObj("tr");
        header.appendChild(NewObj("td", "header", "名稱"));
        header.appendChild(NewObj("td", "header", "數量"));
        result_item.appendChild(header);
        for (i in data.item_list) {
            tr = NewObj("tr");
            tr.appendChild(NewObj("td", "", i));
            tr.appendChild(NewObj("td", "", data.item_list[i]));
            result_item.appendChild(tr);
        }
    }
};

window.onload = function () {
    //JIE.debug = true;
    FGO.normal.main();
};