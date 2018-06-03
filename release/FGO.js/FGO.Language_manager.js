FGO.language_manager = (function () {
    var language_list = [{ name: '日本語', value: 'JP' }, { name: '中文(簡体)', value: 'CN' }, { name: '中文(繁體)', value: 'TW' }, { name: 'English', value: 'EN'}],
        user_language = 'JP',
        data_base = null;

    function get_language_list() {
        return language_list;
    };
    function get_language() {
        return user_language;
    };
    function set_language(language) {
        user_language = language;
    };
    function get_word(index) {
        if (user_language === 'JP' || !data_base[index] || !data_base[index][user_language].trim()) {
            return index;
        } else {
            return data_base[index][user_language];
        }
    };
    function set_data_base(obj) {
        data_base = obj;
    };
    function get_JP_word(name) {
        if (user_language === 'JP') return name;

        for (var i in data_base) {
            if (data_base[i][user_language] === name) {
                return i;
            }
        }
        return name;
    }


    return {
        set_data_base: set_data_base,
        set_language: set_language,
        get_language: get_language,
        get_language_list: get_language_list,
        get_word: get_word,
        get_JP_word: get_JP_word
    };
})();

//(function () {
//    var data_base = {};

//    FGO.language_manager.set_data_base(data_base);
//})();