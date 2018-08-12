JIE.optimization.PSO = function (options) {
	this.options = {
		fn: null,
		w: 1,				//上一代權重, 大多都設在 [0.0 , 1.5 ] 之間
		c1: 2,				//全域權重, 多設 2, 其它也多設 [0,4]
		c2: 2,				//區域權重, 多設 2, 其它也多設 [0,4]
		v_max: null,		//各arg最高速 obj
		p_max: 50,			//全體大小
		iter_max: 100,		//迭代上限
		bound: null,		//參數邊界
		fixed_method: null,	//修正方法
		is_integer: false,
		is_minimazation: true,
		first_gen : null,		//初始族群,
        advanced_search: null,
        g_best: null,
        no_change_limit: null
	};
	JIE.base.marge(this.options, options);

	this._ans = null;
};

JIE.optimization.PSO.prototype.set = function (options) {
    JIE.base.marge(this.options, options);
};

JIE.optimization.PSO.prototype.play = function () {
	if (!this.options.fn || !this.options.bound || !this.options.fixed_method) {
		if (JIE.isDebug) {
			alert("Please check the PSO's options");
		}
		return false;
	}

    var fixed_method    = this.options.fixed_method,
		fn				= this.options.fn,
		p_max			= this.options.p_max,
		bound			= this.options.bound,
		is_integer		= this.options.is_integer,
		is_minimazation = this.options.is_minimazation,
		v_max			= this.options.v_max,
		first_gen		= this.options.first_gen,
		w				= this.options.w,
		c1				= this.options.c1,
		c2				= this.options.c2,
        advanced_search = this.options.advanced_search,
        g_best          = this.options.g_best,
        no_change_limit = this.options.no_change_limit;

	var iter, iter_max, p_list = [], index, p, fit, arg_index, new_p, no_change = 0, last_g_fit,
		last_v_list = [], v, new_v,
		p_best_list = [], obj,
		isFixed;

		
	//=== 產生初始族群 ===
	var arg_count = fn.length, value, length;

	if (g_best) {
	    p_list.push(g_best.args);
	    p_best_list.push(g_best);

	    v = [];
	    for (arg_index = 0; arg_index < arg_count; arg_index++) {
	        v.push(Math.random() * v_max[arg_index] * (Math.random() > 0.5 ? 1 : -1));
	    }
	    last_v_list.push(v);

	    index = 1;
	}
	else {
	    index = 0;
	}

	for (; index < p_max; index++) {
		//=== position ===
		if (first_gen === null) {
			p = [];
			for (var arg_index = 0; arg_index < arg_count; arg_index++) {
			    if (JIE.isDebug) value = (bound[arg_index].max - bound[arg_index].min) * rand() + bound[arg_index].min;
			    else value = (bound[arg_index].max - bound[arg_index].min) * Math.random() + bound[arg_index].min;
				if (is_integer) value = Math.round(value);
				p.push(value);
			}
		} else {
			p = first_gen[index];
		}
		p_list[index] = p;

		//=== best position ===
		if (fixed_method) {     //修正不合條件的初始族群
		    obj = fixed_method(p, bound);
		    if (obj.fit === undefined) {
		        obj = { args: obj, fit: fn.get_fit.apply(this, obj) };
		    }
		} else {
		    for (index = 0; index < bound.length; index++) {
		        if (p[index] < bound[index].min) p[index] = bound[index].min;
		        if (p[index] > bound[index].max) p[index] = bound[index].max;
		    }
		    obj = { args: p, fit: fn.get_fit.apply(this, p) };
		}

		p_best_list[index] = obj;

		if (g_best === null) {
			g_best = obj;
		} else {
			if (is_minimazation) {
			    if (obj.fit < g_best.fit) {
					g_best = obj;
				}
			} else {
				if (obj.fit > g_best.fit) {
					g_best = obj;
				}
			}
		}

		//=== speed ===
		v = [];
		for (arg_index = 0; arg_index < arg_count; arg_index++) {
		    //v.push(0);
		    v.push(Math.random() * v_max[arg_index] * (Math.random() > 0.5 ? 1 : -1));
		}
		last_v_list[index] = v;
	}


	last_g_fit = g_best.fit;

	//=== 開始迭代 ===
	for (iter = 0, iter_max = this.options.iter_max; iter <iter_max; iter++) {
		for (index = 0; index < p_max; index++) {
			p = [];
			for (arg_index = 0; arg_index < arg_count; arg_index++) {

                //=== get new speed ===
			    if (JIE.isDebug) {    //for rand('seed')
				    new_v = w * last_v_list[index][arg_index] +
						c1 * rand() * (p_best_list[index].args[arg_index] - p_list[index][arg_index]) +
						c2 * rand() * (g_best.args[arg_index] - p_list[index][arg_index]);
				} else {
				    new_v = w * last_v_list[index][arg_index] +
						c1 * Math.random() * (p_best_list[index].args[arg_index] - p_list[index][arg_index]) +
						c2 * Math.random() * (g_best.args[arg_index] - p_list[index][arg_index]);
				}

				if (new_v > v_max[arg_index])       new_v =  v_max[arg_index];
                else if (new_v < -v_max[arg_index]) new_v = -v_max[arg_index];

                last_v_list[index][arg_index] = new_v;
				p[arg_index] = p_list[index][arg_index] + new_v;

                if (is_integer) p[arg_index] = Math.round(p[arg_index]);
			}

		    //=== fix position ===
            if (fixed_method) {
                obj = fixed_method(p, bound);
                if (obj.fit === undefined) {
                    obj = { args: obj, fit: fn.get_fit.apply(this, obj) };
                }
            } else {
                for (index = 0; index < bound.length; index++) {
                    if (p[index] < bound[index].min) p[index] = bound[index].min;
                    if (p[index] > bound[index].max) p[index] = bound[index].max;
                }
            }
		    //=== fix v ===
            isFixed = false;
            for (arg_index = 0; arg_index < arg_count; arg_index++) {
                if (p[arg_index] !== obj[arg_index]) {
                    isFixed = true;
                    break;
                }
            }
            if (isFixed) {
                for (arg_index = 0; arg_index < arg_count; arg_index++) {
                    last_v_list[index][arg_index] = obj.args[arg_index] - p_list[index][arg_index];
                }
            }

            //=== advanced search ===
            if (advanced_search && (no_change_limit - no_change <= 3) && (Math.abs(g_best.fit - obj.fit) <= 100)) {
                obj.args = advanced_search(obj.args, fn, fixed_method);
                obj.fit = fn.get_fit.apply(this, obj.args);

                for (arg_index = 0; arg_index < arg_count; arg_index++) {
                    if (obj.args[arg_index] !== p_list[arg_index]) 
                        last_v_list[index][arg_index] = obj.args[arg_index] - p_list[index][arg_index];
                }
            }

			//=== update ===
			p_list[index] = obj.args;
			if (is_minimazation) {
				if (obj.fit < p_best_list[index].fit) p_best_list[index] = obj;
				if (obj.fit < g_best.fit) {
				    g_best = obj;
				}
			} else {
				if (obj.fit > p_best_list[index].fit) p_best_list[index] = obj;
				if (obj.fit > g_best.fit) g_best = obj;
			}
		}

        if (no_change_limit) {
            if (last_g_fit !== g_best.fit) {
                last_g_fit = g_best.fit;
                no_change = 0;
            } else {
                no_change += 1;
                if (no_change === no_change_limit) {
                    break;
                }
            }
        }

	}
	return g_best;
};