self.addEventListener('message', function (e) {
    self.isWorker = true;

    if (e.data.isWebSite) {
        //web side
        if (typeof LP_interface === 'undefined') {
            importScripts("/FGO/release/LP_interface/LPdefs.min.js" + e.data.ver);
            importScripts("/FGO/release/LP_interface/LPmethods.min.js" + e.data.ver);
            importScripts("/FGO/release/LP_interface.min.js" + e.data.ver);
            //JIE.isDebug = true;
        }
    }
    else {
        //for local
        if (typeof LP_interface === 'undefined') {
            importScripts("/release/LP_interface/LPdefs.js?" + e.data.ver);
            importScripts("/release/LP_interface/LPmethods.js?" + e.data.ver);
            importScripts("/release/LP_interface.js?" + e.data.ver);
            //JIE.isDebug = true;
        }
    }

    LP_interface.solve(e.data, function (ans) {
        self.postMessage(ans);
    });

}, false);