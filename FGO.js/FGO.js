/*
 * 該程式碼為FGO的namespace
 * @namespace FGO
 * @class dataBass
 */
JIE.FGO = {
    events: {},
    ui: {},
    component: {},
    normal: {},
};

if (typeof FGO === "undefined") {
    FGO = JIE.FGO;
} else {
    if (JIE.debug) {
        alert("namespace FGO 已經存在");
    }
}