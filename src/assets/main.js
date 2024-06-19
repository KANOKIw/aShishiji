//@ts-check
"use strict";


function setCanvasSizes(){
    /**@ts-ignore @type {HTMLCanvasElement} */
    const canvas = document.getElementById(cssName.mcvs);
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    canvas.style.width = canvas.width+"px"; canvas.style.height = canvas.height+"px";
    backcanvas.canvas.width = canvas.width;
    backcanvas.canvas.height = canvas.height;
}


!function(){
    /**@ts-ignore @type {HTMLCanvasElement} */
    const canvas = document.getElementById(cssName.mcvs);
    /**@ts-ignore @type {CanvasRenderingContext2D} */
    const ctx = canvas.getContext("2d");
    /**@ts-ignore @type {string} */
    const loadType = window.performance?.getEntriesByType("navigation")[0].type;
    const PARAMS = {
        article: getParam(ParamName.ARTICLE_ID),
        zoomRatio: Number(getParam(ParamName.ZOOM_RATIO)) || 1,
        floor: getParam(ParamName.FLOOR),
        coords: getParam(ParamName.COORDS)?.split(",").map(a => { return (typeof a === "undefined" || isNaN(Number(a))) ? 0 : Number(a); }) || [ 0, 0 ],
        from: getParam(ParamName.URL_FROM),
        lang: digitLang(getParam(ParamName.LANGUAGE)),
        _poor_coords: getParam(ParamName.COORDS)?.split(",").map(a => { return (typeof a === "undefined" || isNaN(Number(a))) ? 0 : Number(a); }) || [ 0, 0 ],
    };


    LANGUAGE = PARAMS.lang || getUserLang() || "JA";
    
    if (PARAMS.coords.length != 2 
        || PARAMS.coords.some(u => {
        if (!u || isNaN(u))
            return true;
        }
    )) PARAMS.coords = [ 0, 0 ];

    if (loadType == "reload"){
        switch (reloadInitializeLevel){
            case reloadInitializeLevels.DO_EVERYTHING:
            case reloadInitializeLevels.INIT_FLOOR:
                PARAMS.floor = null;
                delParam(ParamName.FLOOR);
            case reloadInitializeLevels.INIT_COORDS:
                PARAMS.coords = [ 0, 0 ];
                delParam(ParamName.COORDS);
            case reloadInitializeLevels.INIT_ZOOMRADIO:
                PARAMS.zoomRatio = 1;
                delParam(ParamName.ZOOM_RATIO);
            case reloadInitializeLevels.CLOSE_ARTICLE:
                PARAMS.article = null;
                delParam(ParamName.ARTICLE_ID);
            case reloadInitializeLevels.DO_NOTHING:
            default:

        }
    }

    delParam(ParamName.URL_FROM);
    startLoad(TEXT[LANGUAGE].LOADING);
    setCanvasSizes();
    setPlaceSelColor();

    const mapConfigAjax = $.when($.post("/data/map-data/conf"), $.post("/data/map-data/objects"));

    function whenWithPureURL(ajaxmapdata, ajaxobjectdata){
        endLoad();
    }

    function whenWithComplicatedURL(ajaxmapdata, ajaxobjectdata){
        const mapdata = ajaxmapdata[0],
            objectdata = ajaxobjectdata[0],
            callbacks = [];
        MAPDATA = mapdata;
        mapObjectComponent = objectdata;

        var initial_floor = mapdata.initial_floor;
        var initial_data = mapdata[mapdata.initial_floor];

        var pure_zr = Boolean(PARAMS.zoomRatio === 1);

        if (PARAMS.floor && Object.keys(mapdata).includes(PARAMS.floor)){
            initial_floor = PARAMS.floor;
            initial_data = mapdata[PARAMS.floor];
        }
        if (PARAMS.from == ParamValues.FROM_NAVIGATE){
            const objdata = searchObject(PARAMS.article);
            initial_floor = objdata?.object.floor;
            initial_data = mapdata[initial_floor];
            callbacks.push(() => {
                setCoordsOnMiddle(objdata?.object.coordinate || { x: ((initial_data.xrange+1)*initial_data.tile_width)/2, y: ((initial_data.yrange+1)*initial_data.tile_height)/2 }, zoomRatio);
            });
        }
    
        CURRENT_FLOOR = initial_floor;
        initial_data = setSpareImage(initial_data);

        backcanvas.width = initial_data.tile_width*(initial_data.xrange+1);
        backcanvas.height = initial_data.tile_height*(initial_data.yrange+1);
    
        +function(){
            // cut a rational figure of our UI
            endLoad(TEXT[LANGUAGE].MAP_LOADED, 500);
            $(cssName.app).show();
            if (PARAMS.article){
                if (PARAMS.from == ParamValues.FROM_NAVIGATE)
                    return;
                const data = searchObject(PARAMS.article);
                var scr_position = 0;
                var article_tg = "description";


                if (data == null){
                    if (PARAMS.from == ParamValues.FROM_ARTICLE_SHARE){
                        setTimeout(() => {
                            PictoNotifier.notify(
                                "error",
                                TEXT[LANGUAGE].NOTIFICATION_SHARED_EVENT_NOT_FOUND,
                                { duration: 7500, discriminator: "share not found" }
                            );
                        }, 500);
                    }
                    delParam(ParamName.ARTICLE_ID);
                    return;
                }

                if (PARAMS.from == ParamValues.FROM_ARTICLE_SHARE){
                    const coords = data.object.coordinate;
                    
                    callbacks.push(() => setCoordsOnMiddle(coords, ZOOMRATIO_ON_SHARE));
                    setTimeout(() => {
                        PictoNotifier.notify(
                            "info",
                            TEXT[LANGUAGE].NOTIFICATION_SHARED_EVENT_FOUND,
                            { duration: 5000, discriminator: "share found" }
                        );
                    }, 1000);

                    const g = getParam(ParamName.SCROLL_POS),
                        y = getParam(ParamName.ART_TARGET);
                    delParam(ParamName.SCROLL_POS);
                    delParam(ParamName.ART_TARGET);
                    if (g != null || y){
                        setTimeout(() => {
                            return;
                            Notifier.appendPending({
                                html: `<div id="shr-f" class="flxxt" style="font-size: 12px;">${GPATH.SUCCESS}${TEXT[LANGUAGE].NOTIFICATION_SHARED_EVENT_TRANSITIONED}</div>`,
                                options: {
                                    duration: 5000,
                                    discriminator: "transitioned to shared position"
                                }
                            });
                        }, 1050);
                        scr_position = Number(g);
                        if (y)
                            article_tg = y;
                    }
                }

                setTimeout(() => {
                    raiseOverview();
                    writeArticleOverview(data, true, scr_position, article_tg);
                }, 1000);
            }
        }();

        drawMapWithProgressBar(initial_data, { over: "", under: CURRENT_FLOOR }, callback);
        
        function callback(){
            const mapd = {
                width: (initial_data.xrange+1)*initial_data.tile_width,
                height: (initial_data.yrange+1)*initial_data.tile_height
            };
            const zr_cands = [document.body.clientWidth/mapd.width, document.body.clientHeight/mapd.height];
            
            backcanvas.canvas.coords = {
                //@ts-ignore
                x: PARAMS.coords[0], y: PARAMS.coords[1]
            };
            
            if (PARAMS.zoomRatio > MOVEPROPERTY.caps.ratio.max) PARAMS.zoomRatio = MOVEPROPERTY.caps.ratio.max;
            if (PARAMS.zoomRatio < MOVEPROPERTY.caps.ratio.min) PARAMS.zoomRatio = MOVEPROPERTY.caps.ratio.min;

            zoomRatio = PARAMS.zoomRatio || Math.min(...zr_cands);
            
            moveMapAssistingNegative(canvas, ctx, { left: 0, top: 0 });
            showDigitsOnFloor(initial_floor, mapObjectComponent);
            showClearedOrgs();
            setBehavParam();
            if (pure_zr || PARAMS._poor_coords.some(u => u === 0))
                setCoordsOnMiddle({x: ((initial_data.xrange+1)*initial_data.tile_width)/2, y: ((initial_data.yrange+1)*initial_data.tile_height)/2 });
            callbacks.forEach(f => f());
        }

        setParam(ParamName.FLOOR, CURRENT_FLOOR);
        setPlaceSelColor();
    }


    mapConfigAjax.done(PARAMS.floor ? whenWithComplicatedURL : whenWithComplicatedURL/*whenWithPureURL*/);

    return 0;
}();


window.addEventListener("resize", function(e){
    e.preventDefault();
    /**@ts-ignore @type {HTMLCanvasElement} */
    const canvas = document.getElementById(cssName.mcvs);
    setCanvasSizes();
    //@ts-ignore
    moveMapAssistingNegative(canvas, canvas.getContext("2d"), { top: 0, left: 0 });
    window.scroll({ top: 0, behavior: "instant" });
}, { passive: false });

window.addEventListener("touchstart", function(e){
    //@ts-ignore
    if (e.target.classList.contains("canvas_interactive")){ e.target.classList.add("interactive_trans"); }
});

window.addEventListener("touchend", function(e){
    Array.from(document.getElementsByClassName("interactive_trans")).forEach(e => e.classList.remove("interactive_trans"));
});

document.oncontextmenu = () => { return false; }
