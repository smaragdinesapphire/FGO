
/**
 * LP-solve interface
 * 
 * @namespace LP_interface
 */
var LP_interface = (function () {

    var Q,
        lp_demo_mode = 2, //1: integers, 2: fractions, 3:decimal
        optimize_mode = "Maximize",
        load_finish = false,
        timer;

    /**
     * import LPdefs.js and LPmethods.js
     */
    (function () {
        if (!lpProblem) {  
            var dh = document.getElementsByTagName('head')[0];
            var list = [];
            list.push("LP_interface/LPdefs.js");
            list.push("LP_interface/LPmethods.js");
            var finish_counter = 0,
                list_length = list.length,
                i = 0;

            load_next();
        }
        else {  //worker
            load_finish = true;
            initalize_config();
        }
        
        function load_next() {
            var s = document.createElement('script');
            s.type = 'text/javascript';

            if (s.onreadystatechange === undefined) {
                s.onload = function () {
                    this.onload = null;
                    check_finish();
                }
            } else {
                s.onreadystatechange = function () {
                    if (this.readyState == 'loaded' || this.readyState == 'complete') {
                        check_finish();
                    }
                }
            }

            s.src = list[i];
            dh.appendChild(s);
        }

        function check_finish() {
            i += 1;
            if (i < list_length) {
                load_next();
            }
            else {
                load_finish = true;
                initalize_config();
            }
        }

    })();

    /**
     * initalize global value
     * 
     * @function initalize_config
     */
    function initalize_config() {
        //global, maybe LPdefs or LPmethods need to use.
        lp_verboseLevel = lp_verbosity_none;
        lp_demo_accuracy = 13;
    }

    /**
     * set config 
     * 
     * config = {
     *  accuracy: 13                //1~13
     *  display_mode: "integer",    //integer, fraction, decimal
     * }
     * 
     * @function set_config
     * @config {Object} config
     */
    function set_config(config) {
        if (config.accuracy > 0 && config.accuracy <= 13) {
            lp_demo_accuracy = config.accuracy;
        }
        if (config.display_mode) {
            switch (config.display_mode) {
                case "integer":     //整數
                    lp_demo_mode = 1;
                    break;
                case "fraction":    //分數
                    lp_demo_mode = 2;
                    break;
                case "decimal":     //十進制
                default:
                    lp_demo_mode = 3;
            }
        }
        //if (config.minimize) {
        //    optimize_mode = "Minimize";
        //}
        //else {
        //    optimize_mode = "Maximize";
        //}
    };

    /**
     * 輸入字串(含目標方程式, 限制條件, 哪些數值為整數)
     * EX:
     * problem = "Maximize p = x1+6y1\n" +  //目標方程式(含最大化Maximize/最小化Minimize)
     * "x1+y1 <= 100\n" +                   //限制條件(僅可使用>=,=,<=)
     * "x1+y1 >= 0\n" +                     //限制條件
     * "integer x1,y1";                     //整數對象
     * 
     * @function solve
     * @param   {String} problem
     * @return  {String} 
     */
    function solve(data, callback) {

        if (load_finish) {
            clearTimeout(timer);
            Q = new lpProblem(data.data);
            Q.maxNumTableaus = data.maxNumTableaus || Q.maxNumTableaus;
            Q.mode = lp_demo_mode;
            Q.sigDigits = lp_demo_accuracy;
            try { Q.solve() }
            finally {
                if (callback) {
                    callback(Q.solutionToString());
                }
                else {
                    return Q.solutionToString();
                }
            }
        }
        else {

            clearTimeout(timer);
            timer = setTimeout(function () { solve(data); }, 1000)
        }

        
    }

    return {
        solve: solve,
        set_config: set_config
    };
}());