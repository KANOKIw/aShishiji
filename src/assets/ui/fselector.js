//@ts-check
"use strict";


/**
 * 
 * @this {JQuery<HTMLElement>}
 * @param {boolean} openned 
 */
function toggleFeslOn(openned){
    if (!openned){
        this
        .removeClass("toSel undoSel")
        .addClass("toSel popped");
        $(cssName.foptw)
        .show()
        .removeClass("toSel undoSel")
        .addClass("toSel");
    } else {
        this
        .removeClass("popped")
        .addClass("undoSel");
        $(cssName.foptw)
        .hide()
        .addClass("undoSel");
    }
}


/**
 * 
 * @param {string} [p] FloorLike
 */
function setPlaceSelColor(p){
    if (p === void 0) p = CURRENT_FLOOR;
    $(".placeOpt").each(function(index, elm){
        if (!this.textContent) return;
        const text = this.textContent?.replace(/ /g, "").replace(/\n/g, "");
        if (text === p)
            $(this).css("background-color", overlay_modes.fselector.colors.current);
        else if (text.length > 1)
            $(this).css("background-color", overlay_modes.fselector.colors.else);
    });
}


/**
 * 
 * @param {string} floor 
 * @param {DrawMapData} data 
 * @param {() => void} [callback] 
 */
function changeFloor(floor, data, callback){
    /**@ts-ignore @type {HTMLElement} */
    const fselector = document.getElementById(cssName.fselector.slice(1));
    /**@ts-ignore @type {HTMLCanvasElement} */
    const canvas = document.getElementById(cssName.mcvs);
    /**@ts-ignore @type {CanvasRenderingContext2D} */
    const ctx = canvas.getContext("2d");


    startLoad(TEXT[LANGUAGE].LOADING_MAP);
    toggleFeslOn.apply($(fselector), [true]);
    overlay_modes.fselector.opened = false;
    CURRENT_FLOOR = floor;


    const data_size = {
        width: data.tile_width*(data.xrange+1),
        height: data.tile_height*(data.yrange+1)
    };
    

    MAPDATA[CURRENT_FLOOR] = setSpareImage(data);


    drawMapWithProgressBar(data, { over: "", under: floor }, function(){
        backcanvas.canvas.coords = {
            x: 0,
            y: 0
        };
        zoomRatio = 1;
        moveMapAssistingNegative(canvas, ctx, { left: 0, top: 0 });
        clearObj();
        showDigitsOnFloor(floor, mapObjectComponent);
        showClearedOrgs();
        setBehavParam();
        endLoad(TEXT[LANGUAGE].MAP_LOADED);
        if (callback !== void 0)
            callback();
    });

    setParam(ParamName.FLOOR, CURRENT_FLOOR);
    setPlaceSelColor();
}
