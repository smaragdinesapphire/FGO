FGO.panel.Header_panel = function (options) {
    var me = this;
    var cookie = FGO.cookie;
    var last_language = cookie.load_language() || 'JP';
    var header = FGO.component.factory('Header');
    var language = FGO.language_manager;
    header.set_language_list(language.get_language_list());
    header.set_language(language.get_language());
    header.onChange.subscribe(function (type, args) {
        me.onChange.fire(args[0]);
    });

    this.render = function (dom) {
        header.render(dom);
    };
    this.onChange = new JIE.event.Publisher("change", this);
};

