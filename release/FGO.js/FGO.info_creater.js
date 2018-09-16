FGO.info_creater = function () {
    const quest_list = {};
    const quest_type = {
        "曜日クエスト": ["修練場（日）", "修練場（月）", "修練場（火）", "修練場（水）", "修練場（木）", "修練場（金）", "修練場（土）"],
        "フリークエスト": []
    };
    const item_list = {
        "stone": {
            "bronze": [
              "剣の輝石",
              "弓の輝石",
              "槍の輝石",
              "騎の輝石",
              "術の輝石",
              "殺の輝石",
              "狂の輝石"
            ],
            "silver": [
              "剣の魔石",
              "弓の魔石",
              "槍の魔石",
              "騎の魔石",
              "術の魔石",
              "殺の魔石",
              "狂の魔石"
            ],
            "golden": [
              "剣の秘石",
              "弓の秘石",
              "槍の秘石",
              "騎の秘石",
              "術の秘石",
              "殺の秘石",
              "狂の秘石"
            ]
        },
        "chess": {
            "silver": [
              "セイバーピース",
              "アーチャーピース",
              "ランサーピース",
              "ライダーピース",
              "キャスターピース",
              "アサシンピース",
              "バーサーカーピース"
            ],
            "golden": [
              "セイバーモニュメント",
              "アーチャーモニュメント",
              "ランサーモニュメント",
              "ライダーモニュメント",
              "キャスターモニュメント",
              "アサシンモニュメント",
              "バーサーカーモニュメント"
            ]
        },
        "other": {
            "bronze": [],
            "silver": [],
            "golden": []
        }
    }

    let language_path = quest_path = trans_table_path = null;
    if (FGO.isWebSite) {
        language_path = "/FGO/database/wording.txt";
        trans_table_path   = "/FGO/database/trans_table.txt";
        quest_path    = "/FGO/database/quest_data.txt";
    }
    else {
        language_path = "/database/wording.txt";
        trans_table_path   = "/database/trans_table.txt";
        quest_path    = "/database/quest_data.txt";

    }

    async function process(){
        try {
            let [str_wording, str_table, str_qeust] = await Promise.all([
                JIE.io.load_text_data(language_path),
                JIE.io.load_text_data(trans_table_path),
                JIE.io.load_text_data(quest_path)
            ])
            wording_data_parser(str_wording);
            quest_data_parser(str_qeust, trans_table_parser(str_table));
            return Promise.resolve(true);
        } 
        catch (error) {
            if (JIE.isDebug) {
                console.log(error);
            }
            return Promise.reject(false);
        }
    }

    return process();
    
    function wording_data_parser(str) {
        let arr = str2arr(str);
        const wording = {};
        for (let i in arr) {
            for (let j in arr[i]) {
                switch (j) {
                    case "0":
                        if (arr[i][0].trim()) {
                            wording[arr[i][0]] = {};
                        }
                        break;
                    case "1":
                    wording[arr[i][0]]["CN"] = arr[i][j];
                        break;
                    case "2":
                    wording[arr[i][0]]["TW"] = arr[i][j];
                        break;
                    case "3":
                    wording[arr[i][0]]["EN"] = arr[i][j];
                        break;
                }

                if (j === "0" && !arr[i][0].trim()) {
                    break;
                }
            }
        }
        if (FGO.language_manager) {
            FGO.language_manager.set_data_base(wording);
        }
        
    }
    function trans_table_parser(str) {
        let arr = str2arr(str);
        const table = {};

        for (let i in arr) {
            if (!arr[i][0]) continue;
            if (arr[i][2].trim() === "") {
                table[arr[i][0]] = arr[i][1];
            }
            else {
                table[arr[i][0]] = {};
                table[arr[i][0]].type1 = arr[i][1];
                table[arr[i][0]].type2 = arr[i][2];
            }
        } 
        return table;
    }
    function quest_data_parser(str, trans_table) {
        let arr = str2arr(str);

        const index_table = {
            "銅素材": {
                start: null,
                end: null
            },
            "銀素材": {
                start: null,
                end: null
            },
            "金素材": {
                start: null,
                end: null
            },
            "輝石": {
                start: null,
                end: null
            },
            "魔石": {
                start: null,
                end: null
            },
            "秘石": {
                start: null,
                end: null
            },
            "ピース": {
                start: null,
                end: null
            },
            "モニュ": {
                start: null,
                end: null
            },
            "エリア": null,
            "クエスト名": null,
            "AP": null
        };

        let material_index = null;
        //建立素材索引
        {
            let finish = false;
            let record_start = false;
            for (let i in arr) {
                for (let j in arr[i]) {
                    if (arr[i][j].trim() === "エリア") {
                        record_start = true;
                        index_table["エリア"] = j;
                        material_index = Number(i) + 1;
                    }

                    let n_j = Number(j);    //number of j
                    if (record_start) {
                        switch (arr[i][j].trim()) {
                            case "クエスト名":
                                index_table["クエスト名"] = n_j;
                                break;
                            case "AP":
                                index_table["AP"] = n_j;
                                break;
                            case "銅素材":
                                index_table["銅素材"].start = n_j;
                                break;
                            case "銀素材":
                                index_table["銀素材"].start = n_j;
                                index_table["銅素材"].end = get_end_index("銅素材", n_j, arr[Number(i)+1]);
                                break;
                            case "金素材":
                                index_table["金素材"].start = n_j;
                                index_table["銀素材"].end = get_end_index("銀素材", n_j, arr[Number(i)+1]);
                                break;
                            case "輝石":
                                index_table["輝石"].start = n_j;
                                index_table["金素材"].end = get_end_index("金素材", n_j, arr[Number(i)+1]);
                                break;
                            case "魔石":
                                index_table["魔石"].start = n_j;
                                index_table["輝石"].end = get_end_index("輝石", n_j, arr[Number(i)+1]);
                                break;
                            case "秘石":
                                index_table["秘石"].start = n_j;
                                index_table["魔石"].end = get_end_index("魔石", n_j, arr[Number(i)+1]);
                                break;
                            case "ピース":
                                index_table["ピース"].start = n_j;
                                index_table["秘石"].end = get_end_index("秘石", n_j, arr[Number(i)+1]);
                                break;
                            case "モニュ":
                                index_table["モニュ"].start = n_j;
                                index_table["ピース"].end = get_end_index("ピース", n_j, arr[Number(i)+1]);
                                break;
                            case "猛火":
                                index_table["モニュ"].end = get_end_index("モニュ", n_j, arr[Number(i)+1]);
                                finish = true;
                                break;
                        }
                    }
                    
                    if (finish) break;
                } 
                if (finish) break;
            }

            function get_end_index(last_item, max, arr) {
                for (let index = Number(index_table[last_item].start); index < max; index += 1) {
                    if (arr[index]) continue;
                    else return index - 1;
                }
                return max - 1;
            }
        }

        const trans_index_table = {};   //用來對照index與物品
        const row_index = [];
        //create item list & row index
        {
            const list = ["銅素材", "銀素材", "金素材", "輝石", "魔石", "秘石", "ピース", "モニュ"];
            for (let rare of list) {
                for (let i = index_table[rare].start, i_max = index_table[rare].end + 1; i < i_max; i +=1 ) {
                    row_index.push(i);
                    let short_name = arr[material_index][i];

                    let real_name = null;
                    if (/素材/.test(rare)) {
                        real_name = trans_table[short_name];
                    }
                    else if (/石/.test(rare)) {
                        real_name = trans_table[short_name].type1 + trans_table[rare];
                    }
                    else {
                        real_name = trans_table[short_name].type2 + trans_table[rare];
                    }
                    trans_index_table[i] = real_name;

                    switch (rare) {
                        case "銅素材":
                        item_list.other.bronze.push(real_name);
                        break;
                        case "銀素材":
                        item_list.other.silver.push(real_name);
                        break;
                        case "金素材":
                        item_list.other.golden.push(real_name);
                        break;
                    }
                }
            }
        }

        //create quest list and type
        {
            let start_parse = false;
            for (let i = material_index, i_max = arr.length; i < i_max; i += 1) {
                
                if (!start_parse && arr[i][index_table["エリア"]].trim()) {
                    start_parse = true;
                }

                if (start_parse) {
                    let type1 = null;
                    if (typeof arr[i][index_table["エリア"]] !== "undefined") {
                        type1 = arr[i][index_table["エリア"]].trim();
                    } 
                    else {
                        continue;
                    }
                    const drop_list = {};
                    if (type1 && type1 !== "エリア" ) {
                        let type2 = arr[i][index_table["クエスト名"]].trim();

                        if (type2) {

                            if (typeof quest_list[type1] === "undefined") {
                                if (!/修練場/.test(type1)) quest_type["フリークエスト"].push(type1);
                                quest_list[type1] = {};
                            }
                            if (typeof quest_list[type1][type2] === "undefined") {
                                quest_list[type1][type2] = {};
                                quest_list[type1][type2]["AP"] = arr[i][index_table["AP"]];
                                quest_list[type1][type2]["drop_list"] = drop_list;
                            }
    
                            let p = null;
                            for (let j of row_index) {
                                p = arr[i][j].trim();
                                if (p) {
                                    p = Math.floor(Number(p) * 10) /1000;
                                    drop_list[trans_index_table[j]] = p;
                                }
                            }
                        }
                    }
                }
                
            }
        }


        // if (JIE.isDebug) {
        //     let old = FGO.info_manager.get_all_quest_list();
        //     var type1, type2, item, tmp;
        //     try{
        //         for (type1 in old) {
        //             for (type2 in old[type1]) {
        //                 for ( item in old[type1][type2].drop_list) {
        //                     if (old[type1][type2].drop_list[item] !== quest_list[type1][type2].drop_list[item] && !quest_list[type1][type2].drop_list[item]) {
        //                         console.log(`old is ${old[type1][type2].drop_list[item]}\nnew is ${quest_list[type1][type2].drop_list[item]}\n`);
        //                     }
        //                 }
        //             }
        //         }
        //     }
        //     catch (e) {
        //         console.log(`type1 is ${type1}\ntype2 is ${type2}\nitem is ${item}`);
        //     }
        // }
        /* 資料整合 */
        const quest_info = {
            list: quest_list,
            type: quest_type
        };

        FGO.info_manager.set_quest_info(quest_info);
        FGO.info_manager.set_item_list(item_list);
    }
    function str2arr(str) {
        let tmp = str.split("\r\n");
        let arr = [];
        for (let i in tmp) {
            arr.push(tmp[i].split('\t'));
        }
        return arr;
    }
    
    
};