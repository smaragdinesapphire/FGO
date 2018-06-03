JIE.optimization.Ant = function (options) {
    this.options = {
        NC_max: 200,    //迭代數
        map: null,
        m_max: 20,  //螞蟻數
        alpha: 1,   //費洛蒙影響力控制系數 
        beta: 5,    //洛蒙影響力控制系數
        rho: 0.1,   //費洛蒙的蒸發系數
        q: 100,     //費洛蒙增加強度係數
        road_manager: null,
        no_change_limit: 10
    };
    JIE.base.marge(this.options, options);

    this._ans = null;
};

JIE.optimization.Ant.prototype.set = function (options) {
    JIE.base.marge(this.options, options);
};

JIE.optimization.Ant.prototype.play = function () {
    var map = this.map,
        NC = 0, NC_max = this.options.NC_max,
        m, m_max = this.options.m_max,
        alpha = this.options.alpha,
        beta = this.options.beta,
        rho = this.options.rho,
        road_manager = this.options.road_manager,
        no_change_limit = this.options.no_change_limit;

    var no_change = 0;

    var T_past = [], T_now = [], P;
    var ant_list = new Array(m_max);
    var ant_fit = new Array(m_max);

    var road_length, road_options_count_list, options_count, options_list;

    var i, i_max, j, j_max, k, k_max;
    var value, total, den, P, fn;

    var PSO = new JIE.optimization.PSO();
    var PSO_ans, best_PSO_ans = null, best_road;

    //default T_past
    road_options_count_list = road_manager.get_options_count_list();
    road_length = road_options_count_list.length;
    reset_T(T_past, 1);
    

    //function reset_T(T, value) {
    //    for (i = 0, i_max = road_length - 1; i < i_max; i += 1) {
    //        if (!T[i]) T[i] = [];
    //        for (j = 0, j_max = road_options_count_list[i].options_count; j < j_max; j += 1) {
    //            if (!T[i][j]) T[i][j] = [];
    //            for (k = 0, k_max = road_options_count_list[i + 1].options_count; k < k_max; k += 1) {
    //                T[i][j][k] = value;
    //            }
    //        }
    //    }
    //}

    function reset_T(T, value) {
        for (i = 0, i_max = road_length; i < i_max; i += 1) {
            if (!T[i]) T[i] = [];
            if (i === 0) {
                T[i][0] = [];
                for (k = 0, k_max = road_options_count_list[i].options_count; k < k_max; k += 1) {
                    T[i][0][k] = value;
                }
            } else {
                for (j = 0, j_max = road_options_count_list[i - 1].options_count; j < j_max; j += 1) {
                    if (!T[i][j]) T[i][j] = [];
                    for (k = 0, k_max = road_options_count_list[i].options_count; k < k_max; k += 1) {
                        T[i][j][k] = value;
                    }
                }
            }
        }
    }

    for (NC = 0; NC < NC_max; NC += 1) {
        for (m = 0; m < m_max; m += 1) {
            ant_list[m] = [];

            for (i = 0, i_max = road_length; i < i_max; i += 1) {
                //get options count for now part
                //start = road_manager.get_start(ant_list[m]);
                options_list = road_manager.get_options_list(ant_list[m]);
                options_count = options_list.length;

                total = den = 0;
                P = [];
                if (JIE.isDebug) value = rand();
                else value = Math.random();

                //分母
                for (j = 0, j_max = options_count; j < j_max; j += 1) {
                    if (ant_list[m].length === 0) {
                        den += 1 / T_past[i][0][options_list[j]];
                    } else {
                        den += 1 / T_past[i][ant_list[m][i - 1]][options_list[j]];
                    }
                }

                //分子
                for (j = 0, j_max = options_count; j < j_max; j += 1) {
                    if (ant_list[m].length === 0) {
                        P[j] = 1 / T_past[i][0][options_list[j]] / den;
                    } else {
                        P[j] = 1 / T_past[i][ant_list[m][i - 1]][options_list[j]] / den;
                    }
                }

                for (j = 0, j_max = options_count; j < j_max; j += 1) {
                    total += P[j];
                    if (total > value) break;
                }
                if (j === j_max) j -= 1;
                ant_list[m].push(options_list[j]);
            }

            //PSO_data = create_PSO_data();
            PSO.set(create_PSO_data(ant_list[m]));
            PSO_ans = PSO.play();


            if (best_PSO_ans === null || PSO_ans.fit < best_PSO_ans) {
                no_change = 0;
                best_PSO_ans = PSO_ans;
                best_road = JIE.base.extendDeep([], ant_list[m]);
            }

            ant_fit[m] = PSO_ans.fit;
        }

        //跟新T
        reset_T(T_now, 0);
        for (m = 0; m < m_max; m += 1) {
            for (i = 0, i_max = ant_fit[m].length; i < i_max; i += 1) {
                if (i === 0) {
                    T_now[i][0][ant_list[m][i]] = 1 / ant_fit[m];
                } else {
                    T_now[i][ant_list[m][i - 1]][ant_list[m][i]] = 1 / ant_fit[m];
                }
                
            }
        }

        for (m = 0; m < m_max; m += 1) {
            for (i = 0, i_max = road_options_count_list.length - 1; i < i_max; i += 1) {
                for (j = 0, j_max = road_options_count_list[i].length; j < j_max; j += 1) {
                    for (k = 0, k_max = road_options_count_list[i + 1].length; k < k_max; k += 1) {
                        T_past[i][j][k] = T_past[i][j][k] * (1-rho) + T_now[i][j][k];
                    }
                }
            }
        }

        if (no_change_limit) {
            if (no_change >= no_change_limit) break;
            no_change += 1;
        }
    }

    return {    //需改良成分段各關次數
        road: best_road,
        ans: best_PSO_ans
    };

    function create_PSO_data(selected_list) {
        //var PSO_data = {};
        //PSO_data.quest_list = road_manager.get_quest_list();
        //PSO_data.fn = road_manager.get_fn(selected_list);
        //PSO_data.bound = road_manager.get_bound();
        //PSO_data.v_max = road_manager.v_max();
        //PSO_data.fixed_method = road_manager.get_fixed_method();
        //PSO_data.is_integer = true;
        //PSO_data.is_minimazation = true;
        ////PSO_data.g_best = null;
        //PSO_data.p_max = 40;
        //PSO_data.iter_max = 4000;
        //PSO_data.no_change_limit = 20;

        //return PSO_data;
        return road_manager.get_PSO_data(selected_list);
    }

};