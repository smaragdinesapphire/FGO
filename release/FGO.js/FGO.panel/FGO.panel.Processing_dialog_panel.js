FGO.panel.Processing_dialog_panel = function () {
    FGO.panel.Processing_dialog_panel.uber.constructor.call(this);
}
JIE.base.inherit(FGO.panel.Processing_dialog_panel, JIE.component.Control_base, {
	prepareNode: function (myself) {
	    var me = this;
		this._body = myself;
		myself.className = "processing_dialog_panel";
		var container = NewObj("div", "textContainer");
		this.schedule = NewObj("div", "schedule", "");
		container.appendChild(NewObj("div", "text", FGO.language_manager.get_word("ただいま計算中")));
		container.appendChild(this.schedule);
		var FUFU = NewObj("div", "FUFU");
		myself.appendChild(container);
		myself.appendChild(FUFU);
	},
	set_schedule: function (str) {
	    this.schedule.innerText = str;
	}
});