JIE.optimization.GA = function (options) {
    this.options = {
        t: 1000,   //termination criterion 終止條件
        pop: 100,    //population size 群體大小
        length: 10, //染色體長度
        c: 0.5,    //crossover rate 交配率
        m: 0.01,   //mutation rate 突變率
        elit: 0.3,     //elitism preserving rate 菁英保留率
        is_min: true
    };

    JIE.base.marge(this.options, options);

    this._t = this.options.t;
    this._pop = this.options.pop;
    this._len = this.options.length;
    this._c = this.options.c;
    this._m = this.options.m;
    this._elit = this.options.elit;
    this._isMin = this.options.is_min; //是否為最小化

    this._chromosomesLength = [];

    this._argsLength = 1;
    this._condition = null;
    this._fitFn = null; //適應函數

    this._boundary = [];    //邊界
    this._pool;
};

JIE.optimization.GA.prototype = {
    setFitnessFunction: function (fn) {

        if (!JIE.base.isFunction(fn)) {
            if (JIE.isDebug) console.log("Argument is not a function.");
            return;
        }

        this._fitFn = fn;
    },
    setCondition: function (arr) {

        if (!Array.isArray(arr)) {
            if (JIE.isDebug) console.log("Argument is not array.");
            return;
        }

        this._condition = arr;
        //c[0] = "3 * t1 + t2 + t3 + 3* t4 >= 300";
        //c[1] = "t1 + 2 * t2 + t3 + t4 >= 150";
        //...
    },
    setBoundary: function (arr) {

        if (!Array.isArray(arr)) {
            if (JIE.isDebug) console.log("Argument is not array.");
            return;
        }

        this._boundary = arr.slice();
        this._getLengthOfChromosome();
    },
    calculate: function () {

        if (!this._argsLength || !this._fitFn || !this._boundary) {
            if (JIE.isDebug) console.log("Please check the setting.");
            return;
        }

        var elitLength = Math.ceil(this._elit * this._pop),
            newElit = {},
            oldElit = {},
            p = [],
            length, i, j, k, t,
            sortedObj,
            crossLength = this._pop / 2,
            fitness = new Array(this._pop),
            bestFit,
            bestArgs = [];

        newElit.fitArr = new Array(elitLength);
        newElit.argsArr = new new Array(elitLength);
        oldElit.fitArr = new Array(elitLength);
        oldElit.argsArr = new new Array(elitLength);

        //產生初始族群
        length = this._chromosomesLength.length;
        for (i = 0; i < this._pop; ij++) {
            p[i] = [];
            for (j = 0; j < length; j++) {
                p[i][j] = this._randArr(this._chromosomesLength[j]);
            }
        }

        for (t = 0; t < this._t; t++) {

            //get fitness
            for (i = 0; i < this._pop; i++) {
                fitness[i] = this._fitFn(this._decode(p[i]));
            }

            if (t === this._t) break;

            //elitism
            sortedObj = this._sortFit(fitness);
            this._set_elit(sortedObj, oldElit, newElit, fitness, elitLength, p, (t === 1) ? true : false);
            /*
            if (t === 0) {
                for (i = 0; i < elitLength; i++) {
                    oldElit.fitArr[i] = sortedObj[i].value;
                    oldElit.argsArr[i] = p[sortedObj[i].index];
                }
            } else {
                for (i = j = k = 0; i < elitLength; i++) {
                    if (this._isMin) {
                        if (oldElit.fitArr[j] < fitness[k]) {
                            newElit.fitArr[j] = oldElit.fitArr[j];
                            newElit.argsArr[j] = oldElit.argsArr[i];
                            j = j + 1;
                        } else {
                            newElit.fitArr[j] = sortedObj[i].value;
                            newElit.argsArr[j] = p[sortedObj[i].index];
                            k = k + 1;
                        }
                    }
                }
            }
            */

            //reproduction
            this._reproduction(sortedObj);


            //crossover
            for (i = 0; i < crossLength / 2; i++) {
                this._crossover(p[i * 2], p[i * 2 + 1]);
            }

            //mutation
            for (i; i < this._pop; i++) {
                this._mutation(this._pop[i]);
            }


        }
    },
    _getLengthOfChromosome: function () {
        var i, length, def, j;
        for (i = 0, length = this._boundary.length; i < length; i++) {
            def = Math.abs(this._boundary[i][0] - this._boundary[i][1]);

            for (j = 1; ; j++) {
                if (def <= Math.pow(2, j + 1) && def > Math.pow(2, j)) break;
            }
            this._chromosomesLength[i] = j + 1;
        }
    },
    _randArr: function (length) {
        var arr = new Array(length),
            i;

        for (i = 0; i < length; i++) {
            arr[i] = (Math.random() > 0.5) ? 1 : 0;
        }
        return arr;
    },
    _sortFit: function (fitArr) {
        var length = fitArr.length, sortedObj, indexArr = new Array(length), i;

        if (this._isMin) {
            sortedObj = JIE.base.sortWithIndeces(fitArr);
        } else {
            sortedObj = JIE.base.sortWithIndeces(fitArr);
            sortedObj.value.reverse();
            sortedObj.index.reverse();
        }

        return sortedObj;

    },
    _set_elit: function (sortedObj, oldElit, newElit, fitness, elitLength, p, first) {
        var i, j, k, t;
        if (first) {
            for (i = 0; i < elitLength; i++) {
                oldElit.fitArr[i] = sortedObj[i].value;
                oldElit.argsArr[i] = p[sortedObj[i].index];
            }
        } else {
            for (i = j = k = 0; i < elitLength; i++) {
                if (this._isMin) {
                    if (oldElit.fitArr[j] < fitness[k]) {
                        newElit.fitArr[j] = oldElit.fitArr[j];
                        newElit.argsArr[j] = oldElit.argsArr[i];
                        j = j + 1;
                    } else {
                        newElit.fitArr[j] = sortedObj[i].value;
                        newElit.argsArr[j] = p[sortedObj[i].index];
                        k = k + 1;
                    }
                }
            }
        }
    },
    _crossover: function (arr1, arr2) {
        var length = arr1.length, i, tmp,
            length2;
        for (i = 0; i < length; i++) {
            length2 = arr1[0].length;
            for (j = 0; j < length2; j++) {
                if (this._c > Math.random()) {
                    tmp = arr1[i][j];
                    arr1[i][j] = arr2[i][j];
                    arr2[i][j] = tmp;
                }
            }
        }
    },
    _mutation: function (chrom) {
        var length = chrom.length, i,
            length2, j;
        for (i = 0; i < length; i++) {
            for (j = 0; j < length2; j++) {
                if (this._m > Math.random()) {
                    (chrom[i][j] === 1) ? 0 : 1;
                }
            }
        }
    },
    _decode: function (arr) {
        var i, length = arr.length, gn,
            numArr = new Array(length),
            g, b, j, length2;

        for (i = 0; i < length; i++) {
            g = arr[i];
            length2 = g.length;
            b = [];
            b[0] = g[0];
            for (j = 1; j < length2; j++) {
                b[j] = g[j] ^ b[j - 1];
            }
            numArr[i] = parseInt(b.join(""), 2);
        }

        return numArr;
    },
    _reproduction: function (arr) {
        var i, i_max = this._pop;
        if (this._isMin) {

        }
            roulette;

        arr;

    }
};