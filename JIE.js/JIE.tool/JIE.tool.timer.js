JIE.tool.Timer = function () {
    this._start = null;
    this._end = null;
    this._time = null;
    this._tmp = null;
    this._isRecoding = false;
    this._isPausing = false;
};
JIE.tool.Timer.prototype = {
    start: function () {
        this._isRecoding = true;
        this._time = 0;
        this._start = Date.now();
    },
    pause: function () {
        if (!this._isPausing && this._isRecoding) {
            this._end = Date.now();
            this._isPausing = true;
            this._time += this._end - this._start;
            this._start = this._end;
        }
    },
    end: function () {
        if (this._isRecoding) {
            this._end = Date.now();
            this._isRecoding = false;
            this._time += this._end - this._start;
        }
    },
    get_time: function () {
        return this._time / 1000;
    }
};