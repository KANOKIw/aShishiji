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
            objectdata = ajaxobjectdata[0];
        MAPDATA = mapdata;
        mapObjectComponent = objectdata;

        var initial_floor = mapdata.initial_floor;
        var initial_data = mapdata[mapdata.initial_floor];

        if (PARAMS.floor && Object.keys(mapdata).includes(PARAMS.floor)){
            initial_floor = PARAMS.floor;
            initial_data = mapdata[PARAMS.floor];
        }
        CURRENT_FLOOR = initial_floor;
        initial_data = setSpareImage(initial_data);

        backcanvas.width = initial_data.tile_width*(initial_data.xrange+1);
        backcanvas.height = initial_data.tile_height*(initial_data.yrange+1);

        drawMapWithProgressBar(initial_data, { over: "", under: CURRENT_FLOOR }, callback);
        
        function callback(){
            backcanvas.canvas.coords = {
                //@ts-ignore
                x: PARAMS.coords[0], y: PARAMS.coords[1]
            };
            if (PARAMS.zoomRatio > MOVEPROPERTY.caps.ratio.max) PARAMS.zoomRatio = MOVEPROPERTY.caps.ratio.max;
            if (PARAMS.zoomRatio < MOVEPROPERTY.caps.ratio.min) PARAMS.zoomRatio = MOVEPROPERTY.caps.ratio.min;

            zoomRatio = PARAMS.zoomRatio;
            
            moveMapAssistingNegative(canvas, ctx, { left: 0, top: 0 });
            showDigitsOnFloor(initial_floor, mapObjectComponent);
            setBehavParam();
        }

        setParam(ParamName.FLOOR, CURRENT_FLOOR);
        setPlaceSelColor();
    
        function _loaded(){
            // cut a rational figure of our UI
            endLoad(TEXT[LANGUAGE].MAP_LOADED, 500);
            $(cssName.app).show();
            if (PARAMS.article){
                const data = searchObject(PARAMS.article);
                var fromARTshare = false;
                var scr_position = 0;
                var article_tg = "description";
                
                if (PARAMS.from){
                    fromARTshare = true;
                }

                if (data == null || CURRENT_FLOOR != data.object.floor){
                    if (fromARTshare){
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

                if (fromARTshare){
                    const coords = data.object.coordinate;
                    setCoordsOnMiddle(coords, ZOOMRATIO_ON_SHARE);
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
        }

        _loaded();
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


/*window.addEventListener("DOMContentLoaded", function(e){
    window.scroll({ top: 0, behavior: "instant" });
});*/

document.oncontextmenu = () => { return false; }
