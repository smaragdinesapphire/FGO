FGO.event.zero = (function () {


    var quests = {},        //關卡資訊(ap, enemy, drop items)
        missions = {},      //設置任務
        bonus = {},         //加成
        gets = {},          //因通關而獲得道具
        history = {},       //遊玩關卡紀錄
        ap = 0,             //花費ap
        user_card = {},     //持有禮裝
        targets = {},       //目標(敵人數量、關卡次數、道具數量)
        killed = {},        //打倒的敵人及數量
        enemy_types = {},   //歸類敵人類型
        default_items = {}, //原本持有的道具
        new_targets = {},   //經計算後的目標
        future_quests = [], //缺乏甚麼可以打甚麼關卡
        enemys_wiki = {};   //怪物分布圖鑑
    
    /**
     * 紀錄關卡遊玩次數
     * 紀錄獲得道具次數
     * 
     * @method  play_quest
     * param {String} quest_type 任務類型名稱(EX: 主線關卡)
     * param {String} quest_name 任務名稱(EX: ACT-1 「通曉冬木的男子」)
     * param {Number} count 遊玩次數
     */
    function play_quest(quest_type, quest_name, count) {
        if (!quests[quest_type.trim()] || !quests[quest_type.trim()][quest_name]) {
            if (JIE.debug) console.log("查無關卡資訊");
            return;
        }
        var quest = quests[quest_type.trim()][quest_name.trim()], drops = quest.drops,
            enemies = quest.enemies,
            actually_drops = [], i, i_max,
            drop_count, hope, j, j_max, p, name, box;

        //record the count
        if (history[quest_type + "-" + quest_name]) {
            history[quest_type + "-" + quest_name] += count;
        } else {
            history[quest_type + "-" + quest_name] = count;
        }
        //record the costed ap
        ap += quest.ap;

        //transfor actually drops
        for (i = 0, i_max = drops.length; i < i_max; i++) {
            /*
            actually_drops.push({
                name: quest.drop[i].name,
                p: quest.drop[i].p,
                box: quest.drop[i].box,
                count: quest.drop[i].count + (bonus[quest.drop[i].name] || 0),
                hope: quest.drop[i].hope
            });
            */
            actually_drops.push(drops[i].count + (bonus[drops[i].name] || 0));
        }

        //record the droped items
        for (i = 0, i_max = actually_drops.length; i < i_max; i++) {
            /*
            hope = 0;
            p = actually_drops[i].p;
            name = actually_drops[i].name;
            box = actually_drops[i].box;

            for (j = 1, j_max = box; j <= j_max; j++) {
                hope += j * JIE.math.c(j_max, j) * Math.pow(p, j) * Math.pow((1 - p), (j_max - j)); //一場幾箱的期望值
            }

            hope *= actually_drops[i].count * count;
            */

            name = drops[i].name;
            hope = drops[i].hope * count * actually_drops[i];

            if (!gets[name]) gets[name] = 0;

            gets[name] += hope;
        }

        //record the killed enemies
        for (i = 0, i_max = enemies.length; i < i_max; i++) {

            if (!killed[enemies[i].name]) killed[enemies[i].name] = 0;

            killed[enemies[i].name] += enemies[i].p;
        }

    };

    function get_not_enough() {
        var not_enought_obj = { items: {}, quests: {}, enemies: {} },
            not_enought = 0,
            key, i, i_max;

        //get not enought items 
        for (key in targets.items) {
            not_enought = targets.items[key] - (gets[key] || 0) - (default_items[key] || 0);
            if (not_enought > 0) not_enought_obj.items[key] = Math.ceil(not_enought);
        }

        //get not enought quests
        for (key in targets.quests) {
            not_enought = targets.quests[key] - (history[key] || 0);
            if (not_enought > 0) not_enought_obj.quests[key] = Math.ceil(not_enought);
        }

        //get not enought enemies
        for (key in targets.enemies) {

            if (/系/.test(key)) {
                not_enought = not_enought_obj.enemies[key];
                for (i = 0, i_max = enemy_types[key].length; i < i_max; i++) {
                    not_enought -= (killed[enemy_types[key][i]] || 0);
                }
            } else {
                not_enought = targets.enemies[key] - (killed[key] || 0);
            }
            if (not_enought > 0) not_enought_obj.enemies[key] = Math.ceil(not_enought);
        }
        new_targets = not_enought_obj;
        return not_enought_obj;
    }

    function get_future_quests() {
        var type_key, key, item, tt, title, type, enemy_name;
        clean_array(future_quests);
        for (type_key in new_targets) {

            switch (type_key) {
                case "enemies":
                    for (enemy_name in new_targets[type_key]) {
                        for (type in enemys_wiki[enemy_name]) {
                            for (title in enemys_wiki[enemy_name][type]) {
                                if (future_quests[type] === undefined) future_quests[type] = [];
                                if (future_quests[type][title] === undefined) future_quests[type][title] = true;
                            }
                        }
                    }
                    break;
                case "quests":
                    for (tt in new_targets[type_key]) {
                        if (!quests[tt]) {  //若不是標題類的關卡(EX: ACT-14 「狙擊愛麗絲菲爾之影」)
                            for (title in quests[tt]) {
                                if (!quests[tt][title]) { //該子關卡不屬於此大關
                                    continue;
                                } else {
                                    if (!future_quests[tt]) future_quests[tt] = [];
                                    if (!future_quests[tt][title]) future_quests[tt][title] = true;
                                }
                            }
                        } else {    //若是標題類的關卡(EX: 主線任務)，表示該子關卡均可累計數量
                            for (title in quests[tt]) {
                                if (!future_quests[tt]) future_quests[tt] = [];
                                if (!future_quests[tt][title]) future_quests[tt][title] = true;
                            }
                        }
                    }
                    break;
                
                case "items":
                    for (type in quests) {
                        for (title in quests[type]) {
                            for (item in new_targets[type_key]) {
                                for (i in quests[type][title].drops) {
                                    if (quests[type][title].drops[i].name === item) {
                                        if (!future_quests[type]) future_quests[type] = [];
                                        if (!future_quests[type][title]) future_quests[type][title] = true;
                                    }
                                }
                            }
                        }
                    }
                    break;
                default:
                    break;
            }


            
        }
        return future_quests;
    };

    function set_enemy_wiki() {
        var title_key, type_key, enemy_key;
        for (type_key in quests) {
            for (title_key in quests[type_key]) {
                for (index in quests[type_key][title_key].enemies) {
                    enemys_name = quests[type_key][title_key].enemies[index].name;
                    if (!enemys_wiki[enemys_name]) {
                        enemys_wiki[enemys_name] = [];
                    }
                    if (!enemys_wiki[enemys_name][type_key]) {
                        enemys_wiki[enemys_name][type_key] = [];
                    }

                    if (enemys_name === "Assassin" && title_key === "ACT-11 「孔明的陷阱」") {
                        tasdfasf = 0;
                    }

                    if (!enemys_wiki[enemys_name][type_key][title_key]) {
                        enemys_wiki[enemys_name][type_key][title_key] = {
                            count: quests[type_key][title_key].enemies[index].p,
                            ap: quests[type_key][title_key].ap
                        };
                    } else {
                        enemys_wiki[enemys_name][type_key][title_key].count += quests[type_key][title_key].enemies[index].p;
                    }
                }
            }
        }

        for (enemy_key in enemys_wiki) {
            for (title_key in enemys_wiki[enemy_key]) {
                for (type_key in enemys_wiki[enemy_key][title_key]) {
                    enemys_wiki[enemy_key][title_key][type_key].cp =
                        enemys_wiki[enemy_key][title_key][type_key].count / enemys_wiki[enemy_key][title_key][type_key].ap;
                }
            }
        }
    }

    function clean_array(arr) {
        var length = arr.length;
        while (length--) arr.pop();
    }

    return {
        set_user_card: function (key, value) {

            if (!user_card[key]) user_card[key] = {};

            user_card[key].value = Number(value);
        },
        set_quest: function (data) {
            quests = data;
            set_enemy_wiki();
        },
        set_mission: function (data) {
            missions = data;
        },
        set_bonus: function (data) {
            bonus = data;
        },
        play_quest: function (quest_type, quest_name, count) {
            play_quest(quest_type, quest_name, count);
        },
        get_drops: function () {
            return gets;
        },
        set_targets: function (data) {
            targets = data;
        },
        get_not_enough: function () {
            return get_not_enough();
        },
        set_enemy_type: function (data) {
            enemy_types = data;
        },
        get_killed: function () {
            return killed;
        },
        set_default_items: function (data) {
            default_items = data;
        },
        get_future_quests: function () {
            return get_future_quests();
        },
        get_enemy_wiki: function () {
            return enemys_wiki;
        }
    };
})();

//該立即函示用於設定任務資料
(function () {

    var quest = {};

    /*
     * 回傳掉落資訊的物件
     * 
     * @method  drop
     * @param   {String} 掉落物名稱
     * @param   {Number} p 茹西掉落率
     * @param   {Number} total_box 總箱子數
     * @param   {Number} count_of_base 一箱有幾個
     * @return  {Object} 回傳掉落資料物件
     */
    function base_drop(name, p, total_box, base_count) {
        return {
            name: name,
            //p: p / 100 / total_box,
            count: base_count,
            //box: total_box,
            hope: p / 100
        }
    };

    q = quest['主線關卡'] = {};
    q['ACT-1 「通曉冬木的男子」'] = {}
    q['ACT-1 「通曉冬木的男子」'].ap = 5
    d = q['ACT-1 「通曉冬木的男子」'].drops = []
    e = q['ACT-1 「通曉冬木的男子」'].enemies = []
    e.push({ name: 'Assassin', p: 1 })
    d.push(base_drop('殺之印章', 100, 1, 4));
    q['ACT-2 「武力介入」'] = {}
    q['ACT-2 「武力介入」'].ap = 5
    d = q['ACT-2 「武力介入」'].drops = []
    e = q['ACT-2 「武力介入」'].enemies = []
    e.push({ name: '阿爾托莉亞', p: 1 })
    d.push(base_drop('劍階銀棋', 100, 1, 1));
    q['ACT-3 「管理者」'] = {}
    q['ACT-3 「管理者」'].ap = 5
    d = q['ACT-3 「管理者」'].drops = []
    e = q['ACT-3 「管理者」'].enemies = []
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '咒語書', p: 1 })
    d.push(base_drop('術之印章', 500, 5, 4));
    d.push(base_drop('狂之印章', 100, 1, 4));
    q['ACT-4 「暗影下蠢動之物」'] = {}
    q['ACT-4 「暗影下蠢動之物」'].ap = 5
    d = q['ACT-4 「暗影下蠢動之物」'].drops = []
    e = q['ACT-4 「暗影下蠢動之物」'].enemies = []
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    d.push(base_drop('弓之印章', 600, 6, 4));
    q['ACT-5 「埃爾梅羅會談」'] = {}
    q['ACT-5 「埃爾梅羅會談」'].ap = 5
    d = q['ACT-5 「埃爾梅羅會談」'].drops = []
    e = q['ACT-5 「埃爾梅羅會談」'].enemies = []
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '咒語書', p: 1 })
    d.push(base_drop('術之印章', 700, 7, 4));
    d.push(base_drop('狂之印章', 100, 1, 4));
    q['ACT-6 「共鬥開始」'] = {}
    q['ACT-6 「共鬥開始」'].ap = 5
    d = q['ACT-6 「共鬥開始」'].drops = []
    e = q['ACT-6 「共鬥開始」'].enemies = []
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    d.push(base_drop('弓之印章', 800, 8, 4));
    d.push(base_drop('弓之印章', 100, 1, 8));
    q['ACT-7 「狩獵藍鬍子」'] = {}
    q['ACT-7 「狩獵藍鬍子」'].ap = 5
    d = q['ACT-7 「狩獵藍鬍子」'].drops = []
    e = q['ACT-7 「狩獵藍鬍子」'].enemies = []
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '大食海魔', p: 1 })
    e.push({ name: '吉爾', p: 1 })
    e.push({ name: '海魔', p: 1 })
    d.push(base_drop('術階銀棋', 100, 1, 1));
    d.push(base_drop('弓之印章', 400, 4, 4));
    d.push(base_drop('弓之印章', 400, 4, 8));
    q['ACT-8 「Irregular」'] = {}
    q['ACT-8 「Irregular」'].ap = 5
    d = q['ACT-8 「Irregular」'].drops = []
    e = q['ACT-8 「Irregular」'].enemies = []
    e.push({ name: 'Assassin？', p: 1 })
    d.push(base_drop('殺階銀棋', 100, 1, 1));
    q['ACT-9 「騎士王再現」'] = {}
    q['ACT-9 「騎士王再現」'].ap = 5
    d = q['ACT-9 「騎士王再現」'].drops = []
    e = q['ACT-9 「騎士王再現」'].enemies = []
    e.push({ name: '阿爾托莉亞', p: 1 })
    d.push(base_drop('劍階銀棋', 100, 1, 1));
    q['ACT-10 「謎之暗殺者」'] = {}
    q['ACT-10 「謎之暗殺者」'].ap = 5
    d = q['ACT-10 「謎之暗殺者」'].drops = []
    e = q['ACT-10 「謎之暗殺者」'].enemies = []
    e.push({ name: 'Assassin？', p: 1 })
    d.push(base_drop('殺階銀棋', 100, 1, 1));
    q['ACT-11 「孔明的陷阱」'] = {}
    q['ACT-11 「孔明的陷阱」'].ap = 5
    d = q['ACT-11 「孔明的陷阱」'].drops = []
    e = q['ACT-11 「孔明的陷阱」'].enemies = []
    e.push({ name: 'Assassin', p: 1 })
    e.push({ name: 'Assassin', p: 1 })
    e.push({ name: 'Assassin', p: 1 })
    e.push({ name: 'Assassin', p: 1 })
    e.push({ name: 'Assassin', p: 1 })
    e.push({ name: 'Assassin', p: 1 })
    e.push({ name: 'Assassin', p: 1 })
    d.push(base_drop('殺之印章', 400, 4, 4));
    d.push(base_drop('殺之印章', 300, 3, 8));
    q['ACT-12 「聖杯問答」'] = {}
    q['ACT-12 「聖杯問答」'].ap = 5
    d = q['ACT-12 「聖杯問答」'].drops = []
    e = q['ACT-12 「聖杯問答」'].enemies = []
    e.push({ name: '吉爾伽美什', p: 1 })
    d.push(base_drop('弓階金像', 100, 1, 1));
    q['ACT-13 「亂戰」'] = {}
    q['ACT-13 「亂戰」'].ap = 5
    d = q['ACT-13 「亂戰」'].drops = []
    e = q['ACT-13 「亂戰」'].enemies = []
    e.push({ name: 'Berserker', p: 1 })
    d.push(base_drop('狂階金像', 100, 1, 1));
    q['ACT-14 「狙擊愛麗絲菲爾之影」'] = {}
    q['ACT-14 「狙擊愛麗絲菲爾之影」'].ap = 5
    d = q['ACT-14 「狙擊愛麗絲菲爾之影」'].drops = []
    e = q['ACT-14 「狙擊愛麗絲菲爾之影」'].enemies = []
    e.push({ name: 'Assassin？', p: 1 })
    d.push(base_drop('殺階金像', 100, 1, 1));
    q['ACT-15 「目標為大聖杯」'] = {}
    q['ACT-15 「目標為大聖杯」'].ap = 5
    d = q['ACT-15 「目標為大聖杯」'].drops = []
    e = q['ACT-15 「目標為大聖杯」'].enemies = []
    e.push({ name: 'Assassin', p: 1 })
    e.push({ name: 'Assassin', p: 1 })
    e.push({ name: 'Assassin', p: 1 })
    e.push({ name: 'Assassin', p: 1 })
    e.push({ name: 'Assassin', p: 1 })
    e.push({ name: 'Assassin', p: 1 })
    e.push({ name: 'Assassin', p: 1 })
    e.push({ name: 'Assassin', p: 1 })
    e.push({ name: 'Assassin', p: 1 })
    e.push({ name: 'Assassin', p: 1 })
    d.push(base_drop('殺階金像', 100, 1, 1));
    d.push(base_drop('殺之印章', 300, 3, 4));
    d.push(base_drop('殺之印章', 600, 6, 8));
    q['ACT-16 「王的矜持」'] = {}
    q['ACT-16 「王的矜持」'].ap = 5
    d = q['ACT-16 「王的矜持」'].drops = []
    e = q['ACT-16 「王的矜持」'].enemies = []
    e.push({ name: '伊斯坎達爾', p: 1 })
    d.push(base_drop('騎階金像', 100, 1, 1));
    q['ACT-17 「御三家的悲願」'] = {}
    q['ACT-17 「御三家的悲願」'].ap = 5
    d = q['ACT-17 「御三家的悲願」'].drops = []
    e = q['ACT-17 「御三家的悲願」'].enemies = []
    e.push({ name: '蘭斯洛特', p: 1 })
    d.push(base_drop('狂階金像', 100, 1, 1));
    q['ACT-18 「墮落之杯」'] = {}
    q['ACT-18 「墮落之杯」'].ap = 5
    d = q['ACT-18 「墮落之杯」'].drops = []
    e = q['ACT-18 「墮落之杯」'].enemies = []
    e.push({ name: '黑聖杯', p: 1 })
    d.push(base_drop('虛影之塵', 100, 1, 10));
    q['ACT-EX 「輪轉聖杯回收」'] = {}
    q['ACT-EX 「輪轉聖杯回收」'].ap = 5
    d = q['ACT-EX 「輪轉聖杯回收」'].drops = []
    e = q['ACT-EX 「輪轉聖杯回收」'].enemies = []
    e.push({ name: 'Avenger', p: 1 })
    d.push(base_drop('虛影之塵', 100, 1, 10));
    q['打倒土之愛麗 序'] = {}
    q['打倒土之愛麗 序'].ap = 40
    d = q['打倒土之愛麗 序'].drops = []
    e = q['打倒土之愛麗 序'].enemies = []
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '土之愛麗', p: 1 })
    d.push(base_drop('人工生命體幼體', 34, 12, 1));
    d.push(base_drop('槍之印章', 156, 4, 4));
    d.push(base_drop('槍之印章', 312, 8, 8));
    d.push(base_drop('槍之印章', 300, 3, 10));
    q['打倒水之愛麗 序'] = {}
    q['打倒水之愛麗 序'].ap = 40
    d = q['打倒水之愛麗 序'].drops = []
    e = q['打倒水之愛麗 序'].enemies = []
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '大食海魔', p: 1 })
    e.push({ name: '水之愛麗', p: 1 })
    e.push({ name: '大食海魔', p: 1 })
    d.push(base_drop('蛇之寶玉', 22, 10, 1));
    d.push(base_drop('劍之印章', 300, 3, 10));
    d.push(base_drop('弓之印章', 390, 10, 8));
    q['打倒火之愛麗 序'] = {}
    q['打倒火之愛麗 序'].ap = 40
    d = q['打倒火之愛麗 序'].drops = []
    e = q['打倒火之愛麗 序'].enemies = []
    e.push({ name: '魔導書', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '魔導書', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '火之愛麗', p: 1 })
    e.push({ name: '水晶魔偶', p: 1 })
    e.push({ name: '魔導書', p: 1 })
    d.push(base_drop('禁斷書頁', 24, 6, 1));
    d.push(base_drop('八連雙晶', 14, 6, 1));
    d.push(base_drop('術之印章', 234, 6, 8));
    d.push(base_drop('狂之印章', 156, 4, 4));
    d.push(base_drop('狂之印章', 78, 2, 8));
    d.push(base_drop('狂之印章', 300, 3, 10));
    q['打倒風之愛麗 序'] = {}
    q['打倒風之愛麗 序'].ap = 40
    d = q['打倒風之愛麗 序'].drops = []
    e = q['打倒風之愛麗 序'].enemies = []
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '風之愛麗', p: 1 })
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    d.push(base_drop('虛影之塵', 13.5, 10, 1));
    d.push(base_drop('騎之印章', 300, 3, 10));
    d.push(base_drop('殺之印章', 117, 3, 4));
    d.push(base_drop('殺之印章', 273, 7, 8));
    q['打倒土之愛麗 真'] = {}
    q['打倒土之愛麗 真'].ap = 40
    d = q['打倒土之愛麗 真'].drops = []
    e = q['打倒土之愛麗 真'].enemies = []
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '土之愛麗', p: 1 })
    d.push(base_drop('人工生命體幼體', 39.5, 13, 1));
    d.push(base_drop('槍之印章', 117, 3, 4));
    d.push(base_drop('槍之印章', 390, 10, 8));
    d.push(base_drop('槍之印章', 300, 3, 10));
    q['打倒水之愛麗 真'] = {}
    q['打倒水之愛麗 真'].ap = 40
    d = q['打倒水之愛麗 真'].drops = []
    e = q['打倒水之愛麗 真'].enemies = []
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '大食海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '大食海魔', p: 1 })
    e.push({ name: '水之愛麗', p: 1 })
    e.push({ name: '大食海魔', p: 1 })
    d.push(base_drop('蛇之寶玉', 25, 11, 1));
    d.push(base_drop('劍之印章', 300, 3, 10));
    d.push(base_drop('弓之印章', 429, 11, 8));
    q['打倒火之愛麗 真'] = {}
    q['打倒火之愛麗 真'].ap = 40
    d = q['打倒火之愛麗 真'].drops = []
    e = q['打倒火之愛麗 真'].enemies = []
    e.push({ name: '魔導書', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '魔導書', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '水晶魔偶', p: 1 })
    e.push({ name: '火之愛麗', p: 1 })
    e.push({ name: '水晶魔偶', p: 1 })
    e.push({ name: '魔導書', p: 1 })
    d.push(base_drop('禁斷書頁', 24, 6, 1));
    d.push(base_drop('八連雙晶', 18, 7, 1));
    d.push(base_drop('術之印章', 234, 6, 8));
    d.push(base_drop('狂之印章', 117, 3, 4));
    d.push(base_drop('狂之印章', 156, 4, 8));
    d.push(base_drop('狂之印章', 300, 3, 10));
    q['打倒風之愛麗 真'] = {}
    q['打倒風之愛麗 真'].ap = 40
    d = q['打倒風之愛麗 真'].drops = []
    e = q['打倒風之愛麗 真'].enemies = []
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '風之愛麗', p: 1 })
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    d.push(base_drop('虛影之塵', 14, 10, 1));
    d.push(base_drop('騎之印章', 300, 3, 10));
    d.push(base_drop('殺之印章', 78, 2, 4));
    d.push(base_drop('殺之印章', 312, 8, 8));
    q['打倒土之愛麗 極'] = {}
    q['打倒土之愛麗 極'].ap = 40
    d = q['打倒土之愛麗 極'].drops = []
    e = q['打倒土之愛麗 極'].enemies = []
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '土之愛麗', p: 1 })
    d.push(base_drop('人工生命體幼體', 35, 10, 1));
    d.push(base_drop('槍之印章', 390, 10, 8));
    d.push(base_drop('槍之印章', 300, 3, 10));
    q['打倒水之愛麗 極'] = {}
    q['打倒水之愛麗 極'].ap = 40
    d = q['打倒水之愛麗 極'].drops = []
    e = q['打倒水之愛麗 極'].enemies = []
    e.push({ name: '大食海魔', p: 1 })
    e.push({ name: '大食海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '大食海魔', p: 1 })
    e.push({ name: '水之愛麗', p: 1 })
    e.push({ name: '大食海魔', p: 1 })
    d.push(base_drop('蛇之寶玉', 22, 9, 1));
    d.push(base_drop('劍之印章', 300, 3, 10));
    d.push(base_drop('弓之印章', 351, 9, 8));
    q['打倒火之愛麗 極'] = {}
    q['打倒火之愛麗 極'].ap = 40
    d = q['打倒火之愛麗 極'].drops = []
    e = q['打倒火之愛麗 極'].enemies = []
    e.push({ name: '水晶魔偶', p: 1 })
    e.push({ name: '水晶魔偶', p: 1 })
    e.push({ name: '魔導書', p: 1 })
    e.push({ name: '火之愛麗', p: 1 })
    e.push({ name: '水晶魔偶', p: 1 })
    e.push({ name: '魔導書', p: 1 })
    d.push(base_drop('禁斷書頁', 16, 4, 1));
    d.push(base_drop('八連雙晶', 18, 6, 1));
    d.push(base_drop('術之印章', 156, 4, 8));
    d.push(base_drop('狂之印章', 234, 6, 8));
    d.push(base_drop('狂之印章', 300, 3, 10));
    q['打倒風之愛麗 極'] = {}
    q['打倒風之愛麗 極'].ap = 40
    d = q['打倒風之愛麗 極'].drops = []
    e = q['打倒風之愛麗 極'].enemies = []
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '風之愛麗', p: 1 })
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    d.push(base_drop('虛影之塵', 10, 7, 1));
    d.push(base_drop('騎之印章', 300, 3, 10));
    d.push(base_drop('殺之印章', 39, 1, 4));
    d.push(base_drop('殺之印章', 234, 6, 8));
    q['死之風，波斯之王'] = {}
    q['死之風，波斯之王'].ap = 40
    d = q['死之風，波斯之王'].drops = []
    e = q['死之風，波斯之王'].enemies = []
    e.push({ name: '不死兵團', p: 1 })
    e.push({ name: '不死兵團', p: 1 })
    e.push({ name: '不死兵團', p: 1 })
    e.push({ name: '不死兵團', p: 1 })
    e.push({ name: '不死兵團', p: 1 })
    e.push({ name: '不死兵團', p: 1 })
    e.push({ name: '大流士三世', p: 1 })
    d.push(base_drop('鳳凰羽毛', 100, 1, 5));
    d.push(base_drop('劍之印章', 200, 2, 10));
    d.push(base_drop('弓之印章', 200, 2, 10));
    d.push(base_drop('槍之印章', 200, 2, 10));
    q = quest['住宅街'] = {};
    q['隱匿而來的面具 Rank D'] = {}
    q['隱匿而來的面具 Rank D'].ap = 10
    d = q['隱匿而來的面具 Rank D'].drops = []
    e = q['隱匿而來的面具 Rank D'].enemies = []
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    d.push(base_drop('虛影之塵', 2, 2, 1));
    d.push(base_drop('殺之印章', 138, 2, 4));
    q['隱匿而來的面具 Rank C'] = {}
    q['隱匿而來的面具 Rank C'].ap = 15
    d = q['隱匿而來的面具 Rank C'].drops = []
    e = q['隱匿而來的面具 Rank C'].enemies = []
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    d.push(base_drop('虛影之塵', 4, 4, 1));
    d.push(base_drop('殺之印章', 216, 4, 4));
    q['隱匿而來的面具 Rank B'] = {}
    q['隱匿而來的面具 Rank B'].ap = 25
    d = q['隱匿而來的面具 Rank B'].drops = []
    e = q['隱匿而來的面具 Rank B'].enemies = []
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    d.push(base_drop('虛影之塵', 10.5, 8, 1));
    d.push(base_drop('應至之地', 0.5, 1, 1));
    d.push(base_drop('殺之印章', 117, 3, 4));
    d.push(base_drop('殺之印章', 254.5, 5, 8));
    q['隱匿而來的面具 Rank A'] = {}
    q['隱匿而來的面具 Rank A'].ap = 30
    d = q['隱匿而來的面具 Rank A'].drops = []
    e = q['隱匿而來的面具 Rank A'].enemies = []
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    d.push(base_drop('虛影之塵', 16.5, 11, 1));
    d.push(base_drop('應至之地', 1, 1, 1));
    d.push(base_drop('殺之印章', 488.5, 11, 8));
    q['隱匿而來的面具 Rank EX'] = {}
    q['隱匿而來的面具 Rank EX'].ap = 30
    d = q['隱匿而來的面具 Rank EX'].drops = []
    e = q['隱匿而來的面具 Rank EX'].enemies = []
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '影從者', p: 1 })
    e.push({ name: '凝視者', p: 1 })
    d.push(base_drop('虛影之塵', 28, 18, 1));
    d.push(base_drop('血之淚石', 20, 2, 1));
    d.push(base_drop('應至之地', 3, 2, 1));
    d.push(base_drop('劍之印章', 194, 2, 8));
    d.push(base_drop('弓之印章', 177, 2, 8));
    d.push(base_drop('殺之印章', 156, 4, 4));
    d.push(base_drop('殺之印章', 468, 12, 8));
    q = quest['冬木大橋'] = {};
    q['BRIDGE BATTLE Rank D'] = {}
    q['BRIDGE BATTLE Rank D'].ap = 10
    d = q['BRIDGE BATTLE Rank D'].drops = []
    e = q['BRIDGE BATTLE Rank D'].enemies = []
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    d.push(base_drop('虛影之塵', 3, 3, 1));
    d.push(base_drop('殺之印章', 177, 3, 4));
    q['BRIDGE BATTLE Rank C'] = {}
    q['BRIDGE BATTLE Rank C'].ap = 15
    d = q['BRIDGE BATTLE Rank C'].drops = []
    e = q['BRIDGE BATTLE Rank C'].enemies = []
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    d.push(base_drop('禁斷書頁', 3, 3, 1));
    d.push(base_drop('八連雙晶', 2, 1, 1));
    d.push(base_drop('術之印章', 177, 3, 4));
    d.push(base_drop('狂之印章', 39, 1, 4));
    q['BRIDGE BATTLE Rank B'] = {}
    q['BRIDGE BATTLE Rank B'].ap = 25
    d = q['BRIDGE BATTLE Rank B'].drops = []
    e = q['BRIDGE BATTLE Rank B'].enemies = []
    e.push({ name: '雷電咒書', p: 1 })
    e.push({ name: '火焰咒書', p: 1 })
    e.push({ name: '冰雪咒書', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '雷電咒書', p: 1 })
    e.push({ name: '疾風咒書', p: 1 })
    e.push({ name: '火焰咒書', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    d.push(base_drop('禁斷書頁', 12, 6, 1));
    d.push(base_drop('八連雙晶', 6, 3, 1));
    d.push(base_drop('應至之地', 0.5, 1, 1));
    d.push(base_drop('術之印章', 293, 6, 8));
    d.push(base_drop('狂之印章', 176, 3, 4));
    q['BRIDGE BATTLE Rank A'] = {}
    q['BRIDGE BATTLE Rank A'].ap = 30
    d = q['BRIDGE BATTLE Rank A'].drops = []
    e = q['BRIDGE BATTLE Rank A'].enemies = []
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '冰雪咒書', p: 1 })
    e.push({ name: '雷電咒書', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '雷電咒書', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 0.5 })
    e.push({ name: '水晶魔偶', p: 0.5 })
    e.push({ name: '魔導書', p: 1 })
    d.push(base_drop('禁斷書頁', 14, 5, 1));
    d.push(base_drop('八連雙晶', 12, 7, 1));
    d.push(base_drop('應至之地', 1, 1, 1));
    d.push(base_drop('術之印章', 252, 5, 8));
    d.push(base_drop('狂之印章', 175.5, 5, 4));
    d.push(base_drop('狂之印章', 39, 2, 8));
    q['BRIDGE BATTLE Rank EX'] = {}
    q['BRIDGE BATTLE Rank EX'].ap = 30
    d = q['BRIDGE BATTLE Rank EX'].drops = []
    e = q['BRIDGE BATTLE Rank EX'].enemies = []
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '魔導書', p: 1 })
    e.push({ name: '水晶魔偶', p: 1 })
    e.push({ name: '雷電咒書', p: 1 })
    e.push({ name: '魔導書', p: 1 })
    e.push({ name: '影從者', p: 1 })
    e.push({ name: '水晶魔偶', p: 1 })
    e.push({ name: '魔導書', p: 1 })
    d.push(base_drop('虛影之塵', 6, 2, 1));
    d.push(base_drop('禁斷書頁', 26, 7, 1));
    d.push(base_drop('八連雙晶', 16, 6, 1));
    d.push(base_drop('應至之地', 3, 2, 1));
    d.push(base_drop('騎之印章', 191, 2, 8));
    d.push(base_drop('術之印章', 273, 7, 8));
    d.push(base_drop('狂之印章', 78, 2, 4));
    d.push(base_drop('狂之印章', 156, 4, 8));
    q = quest['埠頭'] = {};
    q['魔物盤踞之港 Rank D'] = {}
    q['魔物盤踞之港 Rank D'].ap = 10
    d = q['魔物盤踞之港 Rank D'].drops = []
    e = q['魔物盤踞之港 Rank D'].enemies = []
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    d.push(base_drop('鳳凰羽毛', 2, 2, 1));
    d.push(base_drop('騎之印章', 136, 2, 4));
    d.push(base_drop('概念禮裝EXP卡：刻印蟲', 4, 2, 1));
    q['魔物盤踞之港 Rank C'] = {}
    q['魔物盤踞之港 Rank C'].ap = 20
    d = q['魔物盤踞之港 Rank C'].drops = []
    e = q['魔物盤踞之港 Rank C'].enemies = []
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    d.push(base_drop('鳳凰羽毛', 5, 5, 1));
    d.push(base_drop('騎之印章', 311, 5, 4));
    d.push(base_drop('概念禮裝EXP卡：刻印蟲', 10, 5, 1));
    q['魔物盤踞之港 Rank B'] = {}
    q['魔物盤踞之港 Rank B'].ap = 25
    d = q['魔物盤踞之港 Rank B'].drops = []
    e = q['魔物盤踞之港 Rank B'].enemies = []
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    d.push(base_drop('鳳凰羽毛', 10.4, 9, 1));
    d.push(base_drop('蛇之寶玉', 2, 1, 1));
    d.push(base_drop('應至之地', 0.5, 1, 1));
    d.push(base_drop('弓之印章', 39, 1, 8));
    d.push(base_drop('騎之印章', 273, 7, 4));
    d.push(base_drop('騎之印章', 135.3, 2, 8));
    d.push(base_drop('概念禮裝EXP卡：刻印蟲', 18, 9, 1));
    q['魔物盤踞之港 Rank A'] = {}
    q['魔物盤踞之港 Rank A'].ap = 30
    d = q['魔物盤踞之港 Rank A'].drops = []
    e = q['魔物盤踞之港 Rank A'].enemies = []
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    e.push({ name: '大食海魔', p: 1 })
    d.push(base_drop('鳳凰羽毛', 17.6, 12, 1));
    d.push(base_drop('蛇之寶玉', 5, 2, 1));
    d.push(base_drop('應至之地', 1, 1, 1));
    d.push(base_drop('弓之印章', 136.5, 2, 8));
    d.push(base_drop('騎之印章', 156, 4, 4));
    d.push(base_drop('騎之印章', 369.3, 8, 8));
    d.push(base_drop('概念禮裝EXP卡：刻印蟲', 24, 12, 1));
    q['魔物盤踞之港 Rank EX'] = {}
    q['魔物盤踞之港 Rank EX'].ap = 30
    d = q['魔物盤踞之港 Rank EX'].drops = []
    e = q['魔物盤踞之港 Rank EX'].enemies = []
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '影從者', p: 1 })
    e.push({ name: '雙角獸', p: 1 })
    d.push(base_drop('鳳凰羽毛', 20, 13, 1));
    d.push(base_drop('虛影之塵', 6, 2, 1));
    d.push(base_drop('戰馬的幼角', 20, 2, 1));
    d.push(base_drop('應至之地', 3, 2, 1));
    d.push(base_drop('槍之印章', 177, 2, 8));
    d.push(base_drop('騎之印章', 117, 3, 4));
    d.push(base_drop('騎之印章', 390, 10, 8));
    d.push(base_drop('狂之印章', 194, 2, 8));
    d.push(base_drop('概念禮裝EXP卡：刻印蟲', 26, 13, 1));
    q = quest['新都'] = {};
    q['小巷怪物 Rank D'] = {}
    q['小巷怪物 Rank D'].ap = 10
    d = q['小巷怪物 Rank D'].drops = []
    e = q['小巷怪物 Rank D'].enemies = []
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    d.push(base_drop('蛇之寶玉', 3, 3, 1));
    d.push(base_drop('弓之印章', 177, 3, 4));
    q['小巷怪物 Rank C'] = {}
    q['小巷怪物 Rank C'].ap = 20
    d = q['小巷怪物 Rank C'].drops = []
    e = q['小巷怪物 Rank C'].enemies = []
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    d.push(base_drop('蛇之寶玉', 12, 7, 1));
    d.push(base_drop('弓之印章', 78, 2, 4));
    d.push(base_drop('弓之印章', 254, 5, 8));
    q['小巷怪物 Rank B'] = {}
    q['小巷怪物 Rank B'].ap = 30
    d = q['小巷怪物 Rank B'].drops = []
    e = q['小巷怪物 Rank B'].enemies = []
    e.push({ name: '自動人偶', p: 1 })
    e.push({ name: '自動人偶', p: 1 })
    e.push({ name: '自動人偶', p: 1 })
    e.push({ name: '自動人偶', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    d.push(base_drop('無間齒輪', 8, 6, 1));
    d.push(base_drop('應至之地', 0.5, 1, 1));
    d.push(base_drop('劍之印章', 156, 4, 4));
    d.push(base_drop('劍之印章', 137, 2, 8));
    q['小巷怪物 Rank A'] = {}
    q['小巷怪物 Rank A'].ap = 30
    d = q['小巷怪物 Rank A'].drops = []
    e = q['小巷怪物 Rank A'].enemies = []
    e.push({ name: '自動人偶', p: 1 })
    e.push({ name: '自動人偶', p: 1 })
    e.push({ name: '自動人偶', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '自動人偶', p: 1 })
    e.push({ name: '自動人偶', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '陳舊裝置', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    d.push(base_drop('無間齒輪', 19, 10, 1));
    d.push(base_drop('應至之地', 1, 1, 1));
    d.push(base_drop('劍之印章', 195, 5, 4));
    d.push(base_drop('劍之印章', 252, 5, 8));
    q['小巷怪物 Rank EX'] = {}
    q['小巷怪物 Rank EX'].ap = 30
    d = q['小巷怪物 Rank EX'].drops = []
    e = q['小巷怪物 Rank EX'].enemies = []
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '陳舊裝置', p: 1 })
    e.push({ name: '影從者', p: 1 })
    e.push({ name: '陳舊裝置', p: 1 })
    e.push({ name: '陳舊裝置', p: 1 })
    d.push(base_drop('虛影之塵', 6, 2, 1));
    d.push(base_drop('無間齒輪', 34, 11, 1));
    d.push(base_drop('應至之地', 3, 2, 1));
    d.push(base_drop('劍之印章', 429, 11, 8));
    d.push(base_drop('槍之印章', 191, 2, 8));
    q = quest['蓄水槽'] = {};
    q['噁心的觸手 Rank D'] = {}
    q['噁心的觸手 Rank D'].ap = 20
    d = q['噁心的觸手 Rank D'].drops = []
    e = q['噁心的觸手 Rank D'].enemies = []
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    d.push(base_drop('蛇之寶玉', 5, 4, 1));
    d.push(base_drop('弓之印章', 117, 3, 4));
    d.push(base_drop('弓之印章', 98, 1, 8));
    q['噁心的觸手 Rank C'] = {}
    q['噁心的觸手 Rank C'].ap = 20
    d = q['噁心的觸手 Rank C'].drops = []
    e = q['噁心的觸手 Rank C'].enemies = []
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    d.push(base_drop('蛇之寶玉', 9, 6, 1));
    d.push(base_drop('弓之印章', 117, 3, 4));
    d.push(base_drop('弓之印章', 176, 3, 8));
    q['噁心的觸手 Rank B'] = {}
    q['噁心的觸手 Rank B'].ap = 30
    d = q['噁心的觸手 Rank B'].drops = []
    e = q['噁心的觸手 Rank B'].enemies = []
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '小魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '大食海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    d.push(base_drop('蛇之寶玉', 16, 9, 1));
    d.push(base_drop('應至之地', 0.5, 1, 1));
    d.push(base_drop('弓之印章', 117, 3, 4));
    d.push(base_drop('弓之印章', 292.5, 6, 8));
    q['噁心的觸手 Rank A'] = {}
    q['噁心的觸手 Rank A'].ap = 30
    d = q['噁心的觸手 Rank A'].drops = []
    e = q['噁心的觸手 Rank A'].enemies = []
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '大食海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '大食海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '影從者', p: 1 })
    d.push(base_drop('虛影之塵', 6, 2, 1));
    d.push(base_drop('蛇之寶玉', 22, 10, 1));
    d.push(base_drop('應至之地', 2, 2, 1));
    d.push(base_drop('弓之印章', 390, 10, 8));
    d.push(base_drop('術之印章', 192, 2, 8));
    q['噁心的觸手 Rank EX'] = {}
    q['噁心的觸手 Rank EX'].ap = 30
    d = q['噁心的觸手 Rank EX'].drops = []
    e = q['噁心的觸手 Rank EX'].enemies = []
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '大食海魔', p: 1 })
    e.push({ name: '大食海魔', p: 1 })
    e.push({ name: '惡魔', p: 1 })
    e.push({ name: '海魔', p: 1 })
    e.push({ name: '大食海魔', p: 1 })
    d.push(base_drop('蛇之寶玉', 25, 11, 1));
    d.push(base_drop('蠻神心臟', 15, 2, 1));
    d.push(base_drop('應至之地', 3, 2, 1));
    d.push(base_drop('弓之印章', 429, 11, 8));
    d.push(base_drop('術之印章', 182, 2, 8));
    q = quest['愛因茲貝倫城'] = {};
    q['生命躍動之庭 Rank C'] = {}
    q['生命躍動之庭 Rank C'].ap = 20
    d = q['生命躍動之庭 Rank C'].drops = []
    e = q['生命躍動之庭 Rank C'].enemies = []
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    d.push(base_drop('人工生命體幼體', 7.5, 5, 1));
    d.push(base_drop('槍之印章', 254.5, 5, 4));
    q['生命躍動之庭 Rank B'] = {}
    q['生命躍動之庭 Rank B'].ap = 30
    d = q['生命躍動之庭 Rank B'].drops = []
    e = q['生命躍動之庭 Rank B'].enemies = []
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    d.push(base_drop('人工生命體幼體', 17.5, 9, 1));
    d.push(base_drop('應至之地', 0.5, 1, 1));
    d.push(base_drop('槍之印章', 273, 7, 4));
    d.push(base_drop('槍之印章', 135.5, 2, 8));
    q['生命躍動之庭 Rank A'] = {}
    q['生命躍動之庭 Rank A'].ap = 30
    d = q['生命躍動之庭 Rank A'].drops = []
    e = q['生命躍動之庭 Rank A'].enemies = []
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    d.push(base_drop('人工生命體幼體', 24.5, 11, 1));
    d.push(base_drop('應至之地', 1, 1, 1));
    d.push(base_drop('槍之印章', 273, 7, 4));
    d.push(base_drop('槍之印章', 213.5, 4, 8));
    q['生命躍動之庭 Rank EX'] = {}
    q['生命躍動之庭 Rank EX'].ap = 30
    d = q['生命躍動之庭 Rank EX'].drops = []
    e = q['生命躍動之庭 Rank EX'].enemies = []
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '影從者', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    d.push(base_drop('虛影之塵', 6, 2, 1));
    d.push(base_drop('人工生命體幼體', 34, 12, 1));
    d.push(base_drop('應至之地', 3, 2, 1));
    d.push(base_drop('劍之印章', 191, 2, 8));
    d.push(base_drop('槍之印章', 156, 4, 4));
    d.push(base_drop('槍之印章', 312, 8, 8));
    q = quest['大空洞'] = {};
    q['大地之底 Rank A'] = {}
    q['大地之底 Rank A'].ap = 30
    d = q['大地之底 Rank A'].drops = []
    e = q['大地之底 Rank A'].enemies = []
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '人工生命體', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    e.push({ name: '原型人工生命體', p: 1 })
    e.push({ name: '影從者', p: 1 })
    d.push(base_drop('虛影之塵', 14, 8, 1));
    d.push(base_drop('人工生命體幼體', 18.5, 7, 1));
    d.push(base_drop('應至之地', 3, 2, 1));
    d.push(base_drop('槍之印章', 117, 3, 4));
    d.push(base_drop('槍之印章', 156, 4, 8));
    d.push(base_drop('殺之印章', 78, 2, 4));
    d.push(base_drop('殺之印章', 347, 6, 8));
    q['大地之底 Rank EX'] = {}
    q['大地之底 Rank EX'].ap = 30
    d = q['大地之底 Rank EX'].drops = []
    e = q['大地之底 Rank EX'].enemies = []
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    e.push({ name: '龍', p: 1 })
    d.push(base_drop('虛影之塵', 13, 9, 1));
    d.push(base_drop('龍之逆鱗', 15, 2, 1));
    d.push(base_drop('應至之地', 3, 2, 1));
    d.push(base_drop('騎之印章', 182, 2, 8));
    d.push(base_drop('殺之印章', 39, 1, 4));
    d.push(base_drop('殺之印章', 312, 8, 8));
    q = quest['冬木教會'] = {};
    q['愉悅之宴 Rank D'] = {}
    q['愉悅之宴 Rank D'].ap = 15
    d = q['愉悅之宴 Rank D'].drops = []
    e = q['愉悅之宴 Rank D'].enemies = []
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '自動人偶', p: 1 })
    e.push({ name: '自動人偶', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    d.push(base_drop('虛影之塵', 2, 2, 1));
    d.push(base_drop('無間齒輪', 2, 2, 1));
    d.push(base_drop('劍之印章', 138, 2, 4));
    d.push(base_drop('殺之印章', 78, 2, 4));
    q['愉悅之宴 Rank C'] = {}
    q['愉悅之宴 Rank C'].ap = 20
    d = q['愉悅之宴 Rank C'].drops = []
    e = q['愉悅之宴 Rank C'].enemies = []
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '自動人偶', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '自動人偶', p: 1 })
    e.push({ name: '自動人偶', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '基底之紮伊德', p: 1 })
    e.push({ name: '自動人偶', p: 1 })
    d.push(base_drop('虛影之塵', 4, 4, 1));
    d.push(base_drop('無間齒輪', 6, 5, 1));
    d.push(base_drop('劍之印章', 156, 4, 4));
    d.push(base_drop('劍之印章', 98, 1, 8));
    d.push(base_drop('殺之印章', 156, 4, 4));
    q['愉悅之宴 Rank B'] = {}
    q['愉悅之宴 Rank B'].ap = 30
    d = q['愉悅之宴 Rank B'].drops = []
    e = q['愉悅之宴 Rank B'].enemies = []
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    d.push(base_drop('虛影之塵', 4.5, 3, 1));
    d.push(base_drop('無間齒輪', 12, 6, 1));
    d.push(base_drop('應至之地', 0.5, 1, 1));
    d.push(base_drop('劍之印章', 293, 6, 8));
    d.push(base_drop('殺之印章', 176.5, 3, 8));
    q['愉悅之宴 Rank A'] = {}
    q['愉悅之宴 Rank A'].ap = 30
    d = q['愉悅之宴 Rank A'].drops = []
    e = q['愉悅之宴 Rank A'].enemies = []
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    e.push({ name: '陳舊裝置', p: 1 })
    e.push({ name: '迅速之馬庫爾', p: 1 })
    d.push(base_drop('虛影之塵', 7.5, 5, 1));
    d.push(base_drop('無間齒輪', 16, 6, 1));
    d.push(base_drop('應至之地', 1, 1, 1));
    d.push(base_drop('劍之印章', 291, 6, 8));
    d.push(base_drop('殺之印章', 254.5, 5, 8));
    q['愉悅之宴 Rank EX'] = {}
    q['愉悅之宴 Rank EX'].ap = 30
    d = q['愉悅之宴 Rank EX'].drops = []
    e = q['愉悅之宴 Rank EX'].enemies = []
    e.push({ name: '迅速之馬庫爾', p: 1 })
    e.push({ name: '殺戮人偶', p: 1 })
    e.push({ name: '陳舊裝置', p: 1 })
    e.push({ name: '陳舊裝置', p: 1 })
    e.push({ name: '怪腕之戈茲爾', p: 1 })
    e.push({ name: '陳舊裝置', p: 1 })
    e.push({ name: '影從者', p: 1 })
    e.push({ name: '噬魂者', p: 1 })
    d.push(base_drop('虛影之塵', 10.5, 5, 1));
    d.push(base_drop('無間齒輪', 26, 7, 1));
    d.push(base_drop('黑獸脂', 20, 2, 1));
    d.push(base_drop('應至之地', 3, 2, 1));
    d.push(base_drop('劍之印章', 273, 7, 8));
    d.push(base_drop('弓之印章', 194, 2, 8));
    d.push(base_drop('殺之印章', 294, 5, 8));
    q = quest['武家住宅'] = {};
    q['劃破靜寂的翅音 Rank D'] = {}
    q['劃破靜寂的翅音 Rank D'].ap = 20
    d = q['劃破靜寂的翅音 Rank D'].drops = []
    e = q['劃破靜寂的翅音 Rank D'].enemies = []
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    d.push(base_drop('鳳凰羽毛', 5, 5, 1));
    d.push(base_drop('騎之印章', 253, 5, 4));
    d.push(base_drop('概念禮裝EXP卡：刻印蟲', 10, 5, 1));
    q['劃破靜寂的翅音 Rank C'] = {}
    q['劃破靜寂的翅音 Rank C'].ap = 20
    d = q['劃破靜寂的翅音 Rank C'].drops = []
    e = q['劃破靜寂的翅音 Rank C'].enemies = []
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    d.push(base_drop('鳳凰羽毛', 7, 7, 1));
    d.push(base_drop('騎之印章', 331, 7, 4));
    d.push(base_drop('概念禮裝EXP卡：刻印蟲', 14, 7, 1));
    q['劃破靜寂的翅音 Rank B'] = {}
    q['劃破靜寂的翅音 Rank B'].ap = 30
    d = q['劃破靜寂的翅音 Rank B'].drops = []
    e = q['劃破靜寂的翅音 Rank B'].enemies = []
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    d.push(base_drop('鳳凰羽毛', 13.8, 11, 1));
    d.push(base_drop('應至之地', 0.5, 1, 1));
    d.push(base_drop('騎之印章', 273, 7, 4));
    d.push(base_drop('騎之印章', 213.3, 4, 8));
    d.push(base_drop('概念禮裝EXP卡：刻印蟲', 22, 11, 1));
    q['劃破靜寂的翅音 Rank A'] = {}
    q['劃破靜寂的翅音 Rank A'].ap = 30
    d = q['劃破靜寂的翅音 Rank A'].drops = []
    e = q['劃破靜寂的翅音 Rank A'].enemies = []
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    d.push(base_drop('鳳凰羽毛', 16.2, 12, 1));
    d.push(base_drop('應至之地', 1, 1, 1));
    d.push(base_drop('騎之印章', 234, 6, 4));
    d.push(base_drop('騎之印章', 291.3, 6, 8));
    d.push(base_drop('概念禮裝EXP卡：刻印蟲', 24, 12, 1));
    q['劃破靜寂的翅音 Rank EX'] = {}
    q['劃破靜寂的翅音 Rank EX'].ap = 30
    d = q['劃破靜寂的翅音 Rank EX'].drops = []
    e = q['劃破靜寂的翅音 Rank EX'].enemies = []
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃蟲', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    e.push({ name: '翅刃群蟲', p: 1 })
    e.push({ name: '影從者', p: 1 })
    e.push({ name: '奇美拉', p: 1 })
    d.push(base_drop('鳳凰羽毛', 10.8, 8, 1));
    d.push(base_drop('虛影之塵', 6, 2, 1));
    d.push(base_drop('混沌之爪', 25, 2, 1));
    d.push(base_drop('應至之地', 3, 2, 1));
    d.push(base_drop('騎之印章', 156, 4, 4));
    d.push(base_drop('騎之印章', 347, 6, 8));
    d.push(base_drop('狂之印章', 175, 2, 8));
    d.push(base_drop('概念禮裝EXP卡：刻印蟲', 16, 8, 1));
    q = quest['遠阪宅邸'] = {};
    q['秉持優雅 Rank D'] = {}
    q['秉持優雅 Rank D'].ap = 20
    d = q['秉持優雅 Rank D'].drops = []
    e = q['秉持優雅 Rank D'].enemies = []
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    d.push(base_drop('八連雙晶', 8, 4, 1));
    d.push(base_drop('狂之印章', 215, 4, 4));
    q['秉持優雅 Rank C'] = {}
    q['秉持優雅 Rank C'].ap = 20
    d = q['秉持優雅 Rank C'].drops = []
    e = q['秉持優雅 Rank C'].enemies = []
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 0.5 })
    e.push({ name: '水晶魔偶', p: 0.5 })
    d.push(base_drop('八連雙晶', 14, 8, 1));
    d.push(base_drop('狂之印章', 273.5, 6, 4));
    d.push(base_drop('狂之印章', 39, 2, 8));
    q['秉持優雅 Rank B'] = {}
    q['秉持優雅 Rank B'].ap = 30
    d = q['秉持優雅 Rank B'].drops = []
    e = q['秉持優雅 Rank B'].enemies = []
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '水晶魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 0.5 })
    e.push({ name: '水晶魔偶', p: 0.5 })
    d.push(base_drop('八連雙晶', 20, 10, 1));
    d.push(base_drop('應至之地', 0.5, 1, 1));
    d.push(base_drop('狂之印章', 214.5, 6, 4));
    d.push(base_drop('狂之印章', 175, 4, 8));
    q['秉持優雅 Rank A'] = {}
    q['秉持優雅 Rank A'].ap = 30
    d = q['秉持優雅 Rank A'].drops = []
    e = q['秉持優雅 Rank A'].enemies = []
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '水晶魔偶', p: 1 })
    e.push({ name: '水晶魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    d.push(base_drop('八連雙晶', 26, 11, 1));
    d.push(base_drop('應至之地', 1, 1, 1));
    d.push(base_drop('狂之印章', 273, 7, 4));
    d.push(base_drop('狂之印章', 214, 4, 8));
    q['秉持優雅 Rank EX'] = {}
    q['秉持優雅 Rank EX'].ap = 30
    d = q['秉持優雅 Rank EX'].drops = []
    e = q['秉持優雅 Rank EX'].enemies = []
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '紅寶石魔偶', p: 1 })
    e.push({ name: '水晶魔偶', p: 1 })
    e.push({ name: '水晶魔偶', p: 1 })
    e.push({ name: '水晶魔偶', p: 1 })
    e.push({ name: '水晶魔偶', p: 1 })
    e.push({ name: '影從者', p: 1 })
    d.push(base_drop('虛影之塵', 6, 2, 1));
    d.push(base_drop('八連雙晶', 32, 12, 1));
    d.push(base_drop('應至之地', 3, 2, 1));
    d.push(base_drop('弓之印章', 191, 2, 8));
    d.push(base_drop('狂之印章', 156, 4, 4));
    d.push(base_drop('狂之印章', 312, 8, 8));
    q = quest['穗群原學園'] = {};
    q['學不可以已 Rank C'] = {}
    q['學不可以已 Rank C'].ap = 20
    d = q['學不可以已 Rank C'].drops = []
    e = q['學不可以已 Rank C'].enemies = []
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '咒語書', p: 1 })
    e.push({ name: '咒語書', p: 1 })
    d.push(base_drop('禁斷書頁', 5, 5, 1));
    d.push(base_drop('術之印章', 255, 5, 4));
    q['學不可以已 Rank B'] = {}
    q['學不可以已 Rank B'].ap = 30
    d = q['學不可以已 Rank B'].drops = []
    e = q['學不可以已 Rank B'].enemies = []
    e.push({ name: '火焰咒書', p: 1 })
    e.push({ name: '疾風咒書', p: 1 })
    e.push({ name: '冰雪咒書', p: 1 })
    e.push({ name: '雷電咒書', p: 1 })
    e.push({ name: '火焰咒書', p: 1 })
    e.push({ name: '雷電咒書', p: 1 })
    e.push({ name: '冰雪咒書', p: 1 })
    d.push(base_drop('禁斷書頁', 14, 7, 1));
    d.push(base_drop('應至之地', 0.5, 1, 1));
    d.push(base_drop('術之印章', 332, 7, 8));
    q['學不可以已 Rank A'] = {}
    q['學不可以已 Rank A'].ap = 30
    d = q['學不可以已 Rank A'].drops = []
    e = q['學不可以已 Rank A'].enemies = []
    e.push({ name: '火焰咒書', p: 1 })
    e.push({ name: '雷電咒書', p: 1 })
    e.push({ name: '疾風咒書', p: 1 })
    e.push({ name: '疾風咒書', p: 1 })
    e.push({ name: '冰雪咒書', p: 1 })
    e.push({ name: '火焰咒書', p: 1 })
    e.push({ name: '雷電咒書', p: 1 })
    e.push({ name: '火焰咒書', p: 1 })
    e.push({ name: '魔導書', p: 1 })
    d.push(base_drop('禁斷書頁', 24, 10, 1));
    d.push(base_drop('應至之地', 1, 1, 1));
    d.push(base_drop('術之印章', 447, 10, 8));
    q['學不可以已 Rank EX'] = {}
    q['學不可以已 Rank EX'].ap = 30
    d = q['學不可以已 Rank EX'].drops = []
    e = q['學不可以已 Rank EX'].enemies = []
    e.push({ name: '火焰咒書', p: 1 })
    e.push({ name: '雷電咒書', p: 1 })
    e.push({ name: '疾風咒書', p: 1 })
    e.push({ name: '冰雪咒書', p: 1 })
    e.push({ name: '雷電咒書', p: 1 })
    e.push({ name: '魔導書', p: 1 })
    e.push({ name: '魔導書', p: 1 })
    e.push({ name: '魔導書', p: 1 })
    e.push({ name: '守護者', p: 1 })
    d.push(base_drop('禁斷書頁', 34, 11, 1));
    d.push(base_drop('精靈根', 15, 2, 1));
    d.push(base_drop('應至之地', 3, 2, 1));
    d.push(base_drop('劍之印章', 182, 2, 8));
    d.push(base_drop('術之印章', 429, 11, 8));

    FGO.event.zero.set_quest(quest);
})();

//用於抓本次活動之fn
/*
(function catch_data() {
    var root = document.getElementsByClassName("accordion")[0],
        quest_type_title = root.getElementsByTagName("dt"),
        quest_type_sub_element = root.getElementsByTagName("dd"),
        quest_code = [], i, j, k, i_max, j_max, k_max,
        quest_type_title_name = "",
        missions = null,
        mission_name = "",
        ap = 0,
        drop = dropName = dorpData = null,
        item_name = "",
        item_count = item_p = item_box = 0,
        tmp, tmp2, enemy, w1, w2, w1_max, w2_max, enemy_name, enemies;

    for (i = 0, i_max = quest_type_title.length; i < i_max; i++) {
        quest_type_title_name = quest_type_title[i].innerText;
        missions = root.getElementsByTagName("dd")[i].children;

        quest_code.push("q = quest['" + quest_type_title_name.trim() + "'] = {};"); //主線任務
        for (j = 0, j_max = missions.length; j < j_max; j++) {
            mission_name = missions[j].querySelector("tr:nth-child(1) font").innerText.trim();
            ap = Number(missions[j].querySelector("tr:nth-child(3) > td").innerText);
            drop = missions[j].querySelectorAll("tbody > tr:last-child tbody:first-child > tr");
            dropName = drop[0].getElementsByTagName("div");
            dorpData = drop[1].getElementsByTagName("td");
            tmp = missions[j].querySelectorAll("tbody > tr");//前面訊息及掉落物訊息
            tmp2 = [];

            for (w1 = 0, w1_max = tmp.length; w1 < w1_max; w1++) {
                if (tmp[w1].parentNode.parentNode === missions[j]) {
                    tmp2.push(tmp[w1]);
                }
            }


            enemy = [];
            for (w1 = 0, w1_max = tmp2.length - 5 - 1; w1 < w1_max; w1++) {

                enemies = tmp2[w1 + 5].lastChild.innerText.trim().split(/\n/);
                for (w2 = 0, w2_max = enemies.length; w2 < w2_max; w2++) {
                    enemy_name = enemies[w2].trim();
                    enemy_name = enemy_name.split(" ");
                    enemy_name = enemy_name.slice(1, -1).join("");
                    enemy.push({ name: enemy_name, p: 1 / w2_max });
                }
            }


            quest_code.push("q['" + mission_name + "'] = {}");  //ACT-1 「通曉冬木的男子」
            quest_code.push("q['" + mission_name + "'].ap = " + ap);
            quest_code.push("d = q['" + mission_name + "'].drops = []");
            quest_code.push("e = q['" + mission_name + "'].enemies = []");

            for (k = 0, k_max = enemy.length; k < k_max; k++) {
                quest_code.push("e.push(" +
                    "{ name: '" + enemy[k].name +"', p: " + enemy[k].p + "})");
            }

            for (k = 0, k_max = dropName.length; k < k_max; k++) {
                item_name = dropName[k].getAttribute("title");
                item_count = Number(dropName[k].innerText) || 1;
                item_p = Number(dorpData[k].innerHTML.split("%")[0]);
                item_box = Number(dorpData[k].innerHTML.split("%")[1].replace(/[^0-9]/g, ""));
                
                quest_code.push("d.push(base_drop('" +
                    item_name.trim() + "'," + item_p + "," + item_box + "," + item_count + "));");
            }
        }
    }

    var report = "";
    for (var i = 0, i_max = quest_code.length; i < i_max; i++) {
        report += quest_code[i] + "\n";
    }
    console.log(report);
})();

*/