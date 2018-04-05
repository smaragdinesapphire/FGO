FGO.ui.processing_dialog = function () {
	this.onChick = new JIE.event.Publisher("chick", this);
	this.onClose = new JIE.event.Publisher("close", this);
	this.onReset = new JIE.event.Publisher("reset", this);

	JIE.component.dialog.uber.constructor.call(this);
}
JIE.base.inherit(FGO.ui.processing_dialog, JIE.component.control_base, {
	prepareNode: function (myself) {
		var me = this;
		this._body = myself;
		myself.className = "processing_dialog";
		var container = NewObj("div", "text", "計算中...");
		var FUFU = NewObj("div", "FUFU");
		myself.appendChild(container);
		myself.appendChild(FUFU);
	}
});