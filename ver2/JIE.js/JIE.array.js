JIE.array = (function () {

    function delete_target(arr, target) {
        if (Array.isArray(arr)) {
            var i, first_part, last_part,
                        last_index = arr.length - 1;
            for (var i in arr) {
                if (arr[i] === target) {
                    if (i > 0) {
                        first_part = arr.slice(0, i);

                        if (i !== last_index) {
                            last_part = arr.slice(i + 1);
                            arr = first_part.concat(last_part);


                        } else {
                            //i is the last on
                            arr = first_part;
                        }

                    } else {
                        //i is the firt index
                        first_part = arr.slice(1, i);
                        arr = first_part.concat(arr.slice(i + 1));
                    }
                    break;
                }
            }
        } else {
            if (JIE.debug) {
                alert("JIE.array.delete_target: Arguments[0] is not Array.");
            }
        }
        
    }

    function clone(target) {
        var newArr = [];
        if (Array.isArray(target)) {
            for (var i in target) {
                newArr[i] = target[i];
            }
        }
        return newArr;
    }

    function includes(target, arr) {
        for (var i in arr) {
            if (arr[i] === target) return true;
        }
        return false;
    }
    return {
        delete_target: delete_target,
        clone: clone,
        includes: includes
    };
}())