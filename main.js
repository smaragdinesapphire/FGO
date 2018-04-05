var ZERO = FGO.event.zero;

JIE.debug = true;

ZERO.set_user_card("應至之地", 5);
ZERO.set_user_card("月靈髓液", 1);

ZERO.set_enemy_type({
    "自動人偶系": ["自動人偶", "殺戮人偶", "陳舊裝置"],
    "魔偶系": ["水晶魔偶", "紅寶石魔偶"]
});

ZERO.set_bonus({
    "劍之印章": 16,
    "弓之印章": 16,
    "槍之印章": 16,
    "騎之印章": 16,
    "殺之印章": 19,
    "術之印章": 16,
    "狂之印章": 16
});

ZERO.set_default_items({
    "劍之印章": 780,
    "弓之印章": 722,
    "槍之印章": 889,
    "騎之印章": 735,
    "殺之印章": 1235,
    "術之印章": 191,
    "狂之印章": 378
});

ZERO.set_targets({
    items: {
        /*
        "劍之印章": 500,
        "弓之印章": 0,
        "槍之印章": 0,
        "騎之印章": 0,
        "殺之印章": 0,
        "術之印章": 0,
        "狂之印章": 0
        */
    },
    quests: {
        /*
        "武家住宅": 2,
        "穗群原學園": 3,
        "打倒水之愛麗 真": 1,
        "打倒風之愛麗 極": 1
        */
    },
    enemies: {
        //"自動人偶系": 12,
        //"大食海魔": 1,
        "魔偶系": 5
    }
});

/*
ZERO.play_quest("主線關卡", "打倒水之愛麗 序", 1);
ZERO.play_quest("主線關卡", "打倒土之愛麗 序", 1);
ZERO.play_quest("主線關卡", "打倒火之愛麗 序", 1);
ZERO.play_quest("主線關卡", "打倒風之愛麗 序", 1);
ZERO.play_quest("主線關卡", "打倒土之愛麗 真", 1);
ZERO.play_quest("主線關卡", "打倒水之愛麗 真", 1);
ZERO.play_quest("主線關卡", "打倒火之愛麗 真", 1);
ZERO.play_quest("主線關卡", "打倒風之愛麗 真", 1);
ZERO.play_quest("主線關卡", "打倒土之愛麗 極", 1);
ZERO.play_quest("主線關卡", "打倒水之愛麗 極", 1);
ZERO.play_quest("主線關卡", "打倒火之愛麗 極", 1);
ZERO.play_quest("主線關卡", "打倒風之愛麗 極", 1);
ZERO.play_quest("主線關卡", "死之風，波斯之王", 1);
*/
not_enough = ZERO.get_not_enough();
enemy_wiki = ZERO.get_enemy_wiki();
drops = ZERO.get_drops();
future = ZERO.get_future_quests();
alert();