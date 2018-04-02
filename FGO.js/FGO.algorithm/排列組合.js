

function combination(item) {
    var key, ans = [], name_list = [],
        index = 0;

    var temp = {
        total: 0
    };

    //var temp = {
    //        total: 0,
            //calculate_total: function () {
            //    var key, total = 0;
            //    for (key in this) {
            //        if (key !== "total" && typeof this[key] !== "function") total += this[key];
            //    }
            //    this.total = total;
    //        }
    //    };

    for (key in item) {
        //temp[key] = 0;
        name_list.push(key);
    }
    
    next (temp, 0);

    function next(obj, index){
        var i, i_max = item[name_list[index]], 
            has_next = typeof item[name_list[index + 1]] === "number";
        for (var i = 0; i <= i_max; i++) {
            obj[name_list[index]] = i;
            if (has_next) {
                next(obj, index + 1);
            } else {
                var total = 0;
                for (key in obj) {
                    if (key !== "total") total += obj[key];
                }
                obj.total = total;

                ans.push(clone(obj));
            }
        }
        return;
    }

    return ans;
}

function clone(target) {
    var key, temp = {};
    for (key in target) {
        temp[key] = target[key];
    }
    return temp;
}