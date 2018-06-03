/*
 * 用於讀/寫cookie
 */
FGO.cookie = (function () {
    var cookie = JIE.cookie;
    var language = FGO.language_manager;

    var save_language = function (language) {
        cookie.set('language', language, 365);
    };
    
    var load_language = function () {
        return cookie.get('language') || 'JP';
    };

    var save_user_setting = function (list) {
        var item_list = {}, event = {}, schedule = null;
        var name, i;

        //Other language transform to JP
        for (i in list.item_list) {
            item_list[language.get_JP_word(i)] = list.item_list[i];
        }
        for (i in list.other_setting.event) {
            event[language.get_JP_word(i)] = list.other_setting.event[i];
        }
        schedule = language.get_JP_word(list.other_setting.schedule);



        var items_arr = [];
        for (name in item_list) {
            items_arr.push(encodeURI(name) + "|" + item_list[name]);
        }
        cookie.set('item', items_arr.toString(), 365);

        var event_arr = [];
        for (name in event) {
            event_arr.push(encodeURI(name) + "|" + event[name]);
        }
        cookie.set('event', event_arr.toString(), 365);

        cookie.set('schedule', encodeURI(schedule), 365);
    };
    var load_user_setting = function () {
        var list = {
            item_list: {},
            other_setting: {
                event: {},
                schedule: null
            }
        };
        var item_list = parser(JIE.cookie.get('item'));
        var event = parser(JIE.cookie.get('event'));
        var schedule = decodeURI(JIE.cookie.get('schedule'));

        var i;

        for (i in item_list) {
            list.item_list[language.get_word(i)] = Number(item_list[i]);
        }
        for (i in event) {
            list.other_setting.event[language.get_word(i)] = Number(event[i]);
        }
        list.other_setting.schedule = language.get_word(schedule);
        
        return list;

        function parser(str) {
            var arr = str.split(',');
            var i, part;
            var list = {};
            for (i in arr) {
                part = arr[i].split('|');
                list[decodeURI(part[0])] = part[1];
            }
            return list;
        }
    };

    return {
        save_language: save_language,
        load_language: load_language,
        save_user_setting: save_user_setting,
        load_user_setting: load_user_setting
    };
})();