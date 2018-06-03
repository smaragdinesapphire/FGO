(function () {
    /*
     * 該程式碼為贋作計算器
     * @namespace FGO.event
     * @class fake_works
     */
    FGO.event.fake_works = {
        _free_quest: [],
        _story_quest: [],
        _bonus_quest: [],
        _user_card: {},
        setUser_card: function (key, value) {
            this._user_card[key].value = Number(value);
        },
        refresh: function () {

        },
        _calculate: function () {

        }
    };
    var card = {};

    //=============== defualt ===================== 
    card["迦勒底的學者"] = 0;
    card["無慈悲者"] = 0;
    card["引導迦勒底的少女"] = 0;
    card["柔軟的慈愛"] = 0;
    card["毒蛇一藝"] = 0;
    card["死之藝術"] = 0;
    FGO.event.fake_works.user_card = card;

    create_data_base(); //add data to free_quest
 
    



    /*
        * 回傳掉落資訊的物件
        * 
        * @method  drop
        * @param   {String} 掉落物名稱
        * @param   {Number} p 掉落率
        * @param   {Number} total_box 總箱子數
        * @param   {Number} max_per_box 一箱有幾個
        * @param   {Number} max_box_per_quest 一關最多幾箱
        * @param   {Boolean} real 是否為真
        * @return  {Object} 回傳掉落率物件
        */
    function drop(name, p, total_box, max_per_box, max_box_per_quest, real) {
        return {
            name: name,
            p: p / 100 / total_box,
            max_per_box: max_per_box,
            max_box_per_quest: max_box_per_quest,
            real: (real === undefined) ? null : real
        }
    }

    function create_data_base() {
        var free = [],
            d; //方便輸入

        free["初級"] = {};
        free["初級"].ap = 10;
        d = free["初級"].drop = [];
        d.push(drop("英雄之證", 12 , 12, 1, 6));
        d.push(drop("術階銀旗", 5, 1, 1, 1, false));
        d.push(drop("殺階銀旗", 5, 1, 1, 1, true));
        d.push(drop("迦勒底的學者", 0.1 , 2, 1, 1));
        d.push(drop("迦勒底的學者", 0.1 , 2, 1, 1));
        d.push(drop("人體圖（偽）", 300 , 12, 2, 1));
        d.push(drop("手稿（真）", 50, 1, 2, 1, true));
        d.push(drop("手稿（偽）", 50, 1, 2, 1, false));

        free["術關"] = {};
        free["術關"].ap = 40;
        d = free["術關"].drop = [];
        d.push(drop("禁斷書頁", 24, 24 , 1, 12));
        d.push(drop("蠻神心臟", 40, 8, 1, 4));
        d.push(drop("術階金像", 16, 2, 1, 1));
        d.push(drop("迦勒底的學者", 1, 2, 1, 1));
        d.push(drop("引導迦勒底的少女", 0.25, 1, 1, 1, false));
        d.push(drop("無慈悲者", 0.25,1 ,1 ,1 ,true));
        d.push(drop("蒙娜麗莎（偽）", 696, 24, 2, 12));
        d.push(drop("蒙娜麗莎（偽）", 280, 8, 24, 4));
        d.push(drop("手稿（真）", 180, 12, 1, 12, true));
        d.push(drop("手稿（真）", 50, 1, 6, 1, true));
        d.push(drop("手稿（偽）", 180, 12, 1, 12, false));
        d.push(drop("手稿（偽）", 50, 1, 6, 1, false));

        free["羅浮宮"] = {};
        free["羅浮宮"].ap = 40;
        d = free["羅浮宮"].drop = []
        d.push(drop("虛影之塵", 3, 1, 1, 1, true));
        d.push(drop("蠻神心臟", 3, 1, 1, 1, false));
        d.push(drop("劍階銀棋", 10, 2, 1, 1));
        d.push(drop("弓階銀棋", 10, 2, 1, 1));
        d.push(drop("槍階銀棋", 10, 2, 1, 1));
        d.push(drop("騎階銀棋", 10, 2, 1, 1));
        d.push(drop("術階銀棋", 10, 2, 1, 1));
        d.push(drop("殺階銀棋", 10, 2, 1, 1));
        d.push(drop("狂階銀棋", 10, 2, 1, 1));
        d.push(drop("劍階金像", 5, 2, 1, 1));
        d.push(drop("弓階金像", 5, 2, 1, 1));
        d.push(drop("槍階金像", 5, 2, 1, 1));
        d.push(drop("騎階金像", 5, 2, 1, 1));
        d.push(drop("術階金像", 5, 2, 1, 1));
        d.push(drop("殺階金像", 5, 2, 1, 1));
        d.push(drop("狂階金像", 5, 2, 1, 1));
        d.push(drop("迦勒底的學者", 2, 2, 1, 1));
        d.push(drop("引導迦勒底的少女", 0.5, 1, 1, 1, false));
        d.push(drop("無慈悲者", 0.5, 1, 1, 1, true));
        d.push(drop("手稿（真）", 490, 14, 3, 14, true));
        d.push(drop("手稿（真）", 50, 1, 10, 1, true));
        d.push(drop("手稿（偽）", 490, 14, 3, 14, false));
        d.push(drop("手稿（偽）", 50, 1, 10, 1, false));

        FGO.event.fake_works.free_quest = free;
    }
}());

    /*
    var node = document.querySelector("#div_content > div.container > article > dl > dd:nth-child(2) > table:nth-child(20) > tbody > tr:nth-child(15) > td > table > tbody");
    var iconNode = node.querySelectorAll("tr:nth-child(1) div");
    var data = node.querySelectorAll("tr:nth-child(2) td");
    var length = iconNode.length;
    var code;
    var name,
        p,
        total_box,
        max_per_box,
        i;

    for (i = 0, code = ""; i < length; i++) {
        name = iconNode[i].getAttribute("title");
        p = Number(data[i].innerHTML.split("%")[0]);
        total_box = Number(data[i].innerHTML.split("%")[1].replace(/[^0-9]/g, ""));
        max_per_box = (iconNode[i].innerText) ? Number(iconNode[i].innerText) : 1;
        real = (/真/.test(name)) ? ", true" : (/偽/.test(name)) ? ", false" : "";
        code += 'd.push(drop("' + name + '", ' + p + ', ' + total_box + ', ' + max_per_box + ', ' + real + '));\n';
    }
*/


var P = function (total, box, num) {
    var p = total / 100 / box;
    var hope = 0,
        i, max;

    for (i = 1, max = box; i <= max; i++) {
        hope += i * Jie.math.c(box, i) * Math.pow(p, i) * Math.pow((1 - p), (max - i)); //一場幾箱的期望值
    }

    return hope*num;
}
console.log("======")
var p = 160/16/0.5/100;
var hope = 0,
    i, max;

for (i = 1, max = 8; i <= max; i++) {
    hope += i * Jie.math.c(8, i) * Math.pow(p, i) * Math.pow((1 - p), (max - i)); //一場幾箱的期望值
}
console.log(hope)