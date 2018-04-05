/*
 * 產生介面及連動數據
 * 
 * @function main
 */
FGO.normal.main = function () {

    //資料處理
    var quest_data_manager = FGO.normal.quest_data_manager();
    var all_quest_list = quest_data_manager.get_all_quest_list();
    var schedule_list = quest_data_manager.get_schedule();
    var all_item_list = quest_data_manager.get_item_list();
    var item2quest_list = quest_data_manager.get_item2quest_list();

    //節點處理
    var user_input_node = document.querySelector("#user_input");
    var user_chess_list = create_chess_grid(user_input_node.querySelector(".chess .grid_area"));   //棋子與餅乾
    var user_item_list = create_item_grid(user_input_node.querySelector(".item .grid_area"));      //其他素材(銅銀金)
    var schedule_node = create_schedule_options(user_input_node.querySelector(".schedule"), schedule_list);                //進度
    var event_node = document.querySelector("#user_input .event");

    var result_node = document.querySelector("#result");
    result_node.classList.add("hide");
    var result_quest_node = result_node.querySelector(".quest .grid_area");
    //var result_item_node = result_node.querySelector(".item .grid_area");
    var result_item_node = result_node.querySelector(".item");
    var result_AP_node = result_node.querySelector(".AP_result");
    //var not_enough_node = document.querySelector("#result .not_enough .grid_area");
    var not_enough_table_node = NewObj("table", "grid_area");
    var not_enough_node = NewObj("div", "not_enough", NewObj("span", "title_2", "無法獲得物品數"));
        not_enough_node.appendChild(not_enough_table_node);
    var has_not_enough_table = false;

    var item_dialog = JIE.component.dialog.factory("simple");
    item_dialog.render(document.body);
    item_dialog.hide();

    var result_item_table = null;

    var expansion = user_input_node.querySelectorAll(".unfold_btn");
    for (var i = 0, i_max = expansion.length; i < i_max; i += 1) {
        expansion[i].onclick = function () {
            var grid = this.parentNode.parentNode.querySelector(".grid_area");
            grid.classList.toggle("unfold");
            grid.classList.toggle("fold");
            if (this.value === "1") {
                this.value = "0";
                this.innerText = "-";
            } else {
                this.value = "1";
                this.innerText = "+";
            }
        };
    }

    var processing_dialog = new FGO.ui.processing_dialog();
    //processing_dialog.render(document.body);
    //processing_dialog.hide();
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
        //processing_dialog.show();
        processing_dialog.render(document.body);
        setTimeout(function () {
            minimazed_method.set_data(user_data);
            ans = minimazed_method.get_minimization();
            create_result_grid(ans);
            result_node.classList.remove("hide");
            setTimeout(function () {
                processing_dialog.unrender(document.body);
                //processing_dialog.hide();
                window.scrollTo(0, result_node.scrollHeight);
            }, 2000);
        }, 500);
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
        
        var input_list1 = all_item_list.chess_and_stone.name_list,
            input_list2 = all_item_list.chess_and_stone.class_list;
        
        var i, i_max = input_list1.length, j, j_max = input_list2.length,
            tr, td, input, question;
        var table, input_data = {};
        for (i = 0; i < i_max; i += 1) {
            table = NewObj("table", "grid");
            tr = NewObj("tr", "tr");
            tr.appendChild(NewObj("td", "header", "名稱"));
            tr.appendChild(NewObj("td", "header", "數量"));
            table.appendChild(tr);

            for (j = 0; j < j_max; j += 1) {
                tr = NewObj("tr", "tr");
                input = num_input();
                td = NewObj("td", "", NewObj("span", "", input_list2[j] + input_list1[i]));
                question = NewObj("div", "question", "?");
                question.value = input_list2[j] + input_list1[i];
                td.appendChild(question);
                tr.appendChild(td);
                tr.appendChild(NewObj("td", "", input));

                input_data[input_list2[j] + input_list1[i]] = input;
                table.appendChild(tr);
            }
            node.appendChild(table);
        }

        node.addEventListener("click", function () {
            var target = event.target;
            if (target.classList.contains("question")) {
                item2quest_dialog(target.value);
            }
        });

        return input_data;
    }
    function create_item_grid(node) {
        var copper = all_item_list.other_items.copper,
            silver = all_item_list.other_items.silver,
            gold = all_item_list.other_items.gold;
        var tr, td;
        var copper_list, silver_list, gold_list, all_list = {};

        var copper_table = NewObj("table", "copper grid");
        tr = NewObj("tr");
        tr.appendChild(NewObj("td", "header", "銅素材名稱"));
        tr.appendChild(NewObj("td", "header", "數量"));
        copper_table.appendChild(tr);
        copper_list = create_item(copper_table, copper);
        
        var silver_table = NewObj("table", "silver grid");
        tr = NewObj("tr");
        tr.appendChild(NewObj("td", "header", "銀素材名稱"));
        tr.appendChild(NewObj("td", "header", "數量"));
        silver_table.appendChild(tr);
        silver_list = create_item(silver_table, silver);

        var gold_table = NewObj("table", "gold grid");
        tr = NewObj("tr");
        tr.appendChild(NewObj("td", "header", "金素材名稱"));
        tr.appendChild(NewObj("td", "header", "數量"));
        gold_table.appendChild(tr);
        gold_list = create_item(gold_table, gold);

        node.appendChild(copper_table);
        node.appendChild(silver_table);
        node.appendChild(gold_table);

        JIE.base.marge(all_list, copper_list);
        JIE.base.marge(all_list, silver_list);
        JIE.base.marge(all_list, gold_list);

        node.addEventListener("click", function () {
            var target = event.target;
            if (target.classList.contains("question")) {
                item2quest_dialog(target.value);
            }
        });

        return all_list;

        function create_item(node, arr) {
            var i, i_max, tr, td, input, question;
            var input_list = {};
            for (i = 0, i_max = arr.length; i < i_max; i++) {
                tr = NewObj("tr");
                td = NewObj("td", "", NewObj("span", "", arr[i]));
                question = NewObj("div", "question", "?");
                question.value = arr[i];
                td.appendChild(question);

                input = num_input();

                tr.appendChild(td);
                tr.appendChild(NewObj("td", "", input));

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
        while (result_quest_node.firstChild) {
            result_quest_node.removeChild(result_quest_node.firstChild);
        }
        while (result_item_node.firstChild) {
            result_item_node.removeChild(result_item_node.firstChild);
        }

        //if (data.no_support.length) {
        //    while (not_enough_table_node.firstChild) {
        //        not_enough_table_node.removeChild(not_enough_table_node.firstChild);
        //    }
        //} else if (has_not_enough_table) {
        //    has_not_enough_table = false;
        //    result_node.removeChild(not_enough_node);
        //}

        result.classList.remove("hide");

        //AP
        result_AP_node.innerText = data.AP;

        //quest
        var table = NewObj("table", "grid");
        var header = NewObj("tr");
        header.appendChild(NewObj("td", "header", "種類"));
        header.appendChild(NewObj("td", "header", "區域"));
        header.appendChild(NewObj("td", "header", "副本"));
        header.appendChild(NewObj("td", "header", "次數"));
        result_quest_node.appendChild(table);
        table.appendChild(header);
        var h, i, j, k, tr, td;
        var sequence = ["每日任務"].concat(schedule_list);
        for (h in sequence) {
            i = sequence[h];
            for (j in data.quest_count_list[i]) {
                for (k in data.quest_count_list[i][j]) {
                    if (data.quest_count_list[i][j][k] === 0) continue;
                    tr = NewObj("tr");
                    tr.appendChild(NewObj("td", "", i));
                    tr.appendChild(NewObj("td", "", j));
                    tr.appendChild(NewObj("td", "", k));
                    tr.appendChild(NewObj("td", "", data.quest_count_list[i][j][k]));
                    table.appendChild(tr);
                }
            }
        }

        var text, i_max;
        if (result_item_table === null) {
            result_item_table = user_input_node.querySelector(".target_item").cloneNode(true);
            //result_item_table.removeChild(result_item_table.querySelector(".title_2"));
        }
        tr = result_item_table.querySelectorAll("tr");
        for (i = 0, i_max = tr.length; i < i_max; i += 1) {
            
            td = tr[i].querySelectorAll("td");
            if (td[0].classList.contains("header")) continue;
            text = td[0].querySelector("span").innerText;

            if (data.item_list[text]) {
                if (user_data.target_item[text]) {
                    td[0].classList.add("finish");
                    td[0].classList.remove("no_enough");
                    td[1].innerText = Math.round(data.item_list[text]*1000)/1000;
                } else {
                    td[1].innerText = Math.round(data.item_list[text] * 100) / 100;
                }
            } else {
                if (user_data.target_item[text]) {
                    td[0].classList.add("not_enough");
                    td[0].classList.remove("finish");
                    td[1].innerText = user_data.target_item[text] * -1;
                } else {
                    td[1].innerText = 0;
                }
            }
        }
        result_item_node.appendChild(result_item_table);

        ////not enough
        //if (data.no_support.length) {
        //    has_not_enough_table = true;
        //    header = NewObj("tr");
        //    header.appendChild(NewObj("td", "header", "名稱"));
        //    header.appendChild(NewObj("td", "header", "數量"));
        //    not_enough_table_node.appendChild(header);
        //    for (i in data.no_support.item_list) {
        //        tr = NewObj("tr");
        //        tr.appendChild(NewObj("td", "", i));
        //        tr.appendChild(NewObj("td", "", data.no_support.item_list[i]));
        //        not_enough_table_node.appendChild(tr);
        //    }
        //    result_node.appendChild(not_enough_node);
        //}

        var expansion = result_node.querySelectorAll(".unfold_btn");
        for (var i = 0, i_max = expansion.length; i < i_max; i += 1) {
            var grid = expansion[i].parentNode.parentNode.querySelector(".grid_area");
            grid.className = "grid_area unfold";
            expansion[i].value = "0";
            expansion[i].innerText = "-";
            expansion[i].onclick = function () {
                var grid = this.parentNode.parentNode.querySelector(".grid_area");
                grid.classList.toggle("unfold");
                grid.classList.toggle("fold");
                if (this.value === "1") {
                    this.value = "0";
                    this.innerText = "-";
                } else {
                    this.value = "1";
                    this.innerText = "+";
                }
            };
        }
        result_item_table.addEventListener("click", function () {
            var target = event.target;
            if (target.classList.contains("question")) {
                item2quest_dialog(event.target.parentNode.querySelector("span").innerText);
            }
        });
    }
    function item2quest_dialog(key) {
        var grid = NewObj("table", "grid");
        var i, tr, td, quest, type;
        tr = NewObj("tr");
        tr.appendChild(NewObj("td", "header", "種類"));
        tr.appendChild(NewObj("td", "header", "區域"));
        tr.appendChild(NewObj("td", "header", "副本"));
        tr.appendChild(NewObj("td", "header", "AP"));
        tr.appendChild(NewObj("td", "header", "掉落率"));
        tr.appendChild(NewObj("td", "header", "1個/AP"));
        grid.appendChild(tr);

        for (i in item2quest_list[key]) {
            //item2quest_list[key][i]
            quest = item2quest_list[key][i];
            type = quest.type;
            tr = NewObj("tr");
            tr.appendChild(NewObj("td", "", type[0]));
            tr.appendChild(NewObj("td", "", type[1]));
            tr.appendChild(NewObj("td", "", type[2]));
            tr.appendChild(NewObj("td", "", all_quest_list[type[0]][type[1]][type[2]].AP));
            tr.appendChild(NewObj("td", "", Math.round(all_quest_list[type[0]][type[1]][type[2]].drop[key] * 1000) / 1000));
            tr.appendChild(NewObj("td", "", Math.round(quest.CP*1000)/1000));
            grid.appendChild(tr);
        }

        item_dialog.set_title(key);
        item_dialog.set_contain(grid);
        item_dialog.show();
    }
};

window.onload = function () {
    //JIE.debug = true;
    FGO.normal.main();
};