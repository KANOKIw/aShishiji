//@ts-check
"use strict";


/**
 * @typedef {import("../shishiji-dts/motion").Position} _Position
 * @typedef {import("../shishiji-dts/motion").Radian} Radian
 * @typedef {import("../shishiji-dts/motion").MoveData} MoveData
 */


/**
 * 
 * @param {TouchList | MouseEvent} y 
 */
function setCursorpos(y){
    if (y instanceof MouseEvent)
        pointerPosition = [ y.clientX, y.clientY ];
    else
        pointerPosition = getMiddlePos(y);
}


/**
 * 
 * @param {TouchList} touches 
 */
function setTheta(touches){
    prevTheta = getThouchesTheta(touches);
}


/**
 * 
 * @param {HTMLCanvasElement} canvas 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {MoveData} moved
 */
function moveMapAssistingNegative(canvas, ctx, moved){
    var x = backcanvas.canvas.coords.x - moved.left/zoomRatio,
        y = backcanvas.canvas.coords.y - moved.top/zoomRatio;


    backcanvas.canvas.width = canvas.width/zoomRatio;
    backcanvas.canvas.height = canvas.height/zoomRatio;

    backcanvas.canvas.coords = { x: x, y: y };

    _redraw(canvas, ctx, backcanvas,
        ...[ backcanvas.canvas.coords.x, backcanvas.canvas.coords.y ],
        backcanvas.canvas.width, backcanvas.canvas.height, 0, 0, canvas.width, canvas.height,
    );
}


/**
 * @deprecated use {@linkcode moveMapAssistingNegative} instead for safari support
 * @param {HTMLCanvasElement} canvas 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {MoveData} moved
 */
function moveMap(canvas, ctx, moved){
    const x = backcanvas.canvas.coords.y-moved.left/zoomRatio;
    const y = backcanvas.canvas.coords.x-moved.top/zoomRatio;

    backcanvas.canvas.coords = { x: x, y: y }; 
    backcanvas.canvas.width = canvas.width/zoomRatio;
    backcanvas.canvas.height = canvas.height/zoomRatio;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backcanvas, backcanvas.canvas.coords.x, backcanvas.canvas.coords.y,
        backcanvas.canvas.width, backcanvas.canvas.height, 0, 0, canvas.width, canvas.height,
    );
}


/**
 * 
 * @param {HTMLCanvasElement} canvas 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} ratio 
 * @param {NonnullPosition} origin
 *   (cursorPosition)
 * @param {NonnullPosition} [pos]
 * @param {boolean} [forceRatio] 
 */
function zoomMapAssistingNegative(canvas, ctx, ratio, origin, pos, forceRatio){
    if (willOverflow(ratio, false)) return;

    if (pos === void 0)
        pos = [ backcanvas.canvas.coords.x, backcanvas.canvas.coords.y ];

    if (forceRatio)
        zoomRatio = ratio;
    else
        zoomRatio *= ratio;

    if (origin.length == 2 && ratio != 1){
        /**@type {number[]} */
        var transorigin = [];
        for (var i = 0; i < 2; i++){
            transorigin.push(
                (origin[i]*(ratio - 1))/(zoomRatio) + pos[i]
            );
        }
        backcanvas.canvas.coords = {
            x: transorigin[0],
            y: transorigin[1]
        };
    }
    backcanvas.canvas.width = canvas.width/zoomRatio; backcanvas.canvas.height = canvas.height/zoomRatio;

    _redraw(canvas, ctx, backcanvas,
        backcanvas.canvas.coords.x, backcanvas.canvas.coords.y,
        backcanvas.canvas.width, backcanvas.canvas.height,
        0, 0, canvas.width, canvas.height,
    );
}


/**
 * @deprecated use {@linkcode zoomMapAssistingNegative} instead for safari support
 * @param {HTMLCanvasElement} canvas 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} ratio 
 * @param {[number, number]} origin
 *   (cursorPosition)
 * @param {[number, number] | undefined} pos
 */
function zoomMap(canvas, ctx, ratio, origin, pos){
    if (MOVEPROPERTY.caps.ratio.max < zoomRatio && ratio > 1
        || MOVEPROPERTY.caps.ratio.min > zoomRatio && ratio < 1
        ) return;

    if (pos === void 0)
        pos = [ backcanvas.canvas.coords.x, backcanvas.canvas.coords.y ];

    zoomRatio *= ratio;

    if (origin.length == 2 && ratio != 1){
        var transorigin = [];
        for (var i = 0; i < 2; i++){
            transorigin.push(
                (origin[i]*(ratio - 1))/(zoomRatio) + pos[i]
            );
        }
        backcanvas.canvas.coords = {
            x: transorigin[0],
            y: transorigin[1]
        };
    }
    backcanvas.canvas.width = canvas.width/zoomRatio; backcanvas.canvas.height = canvas.height/zoomRatio;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backcanvas,
        backcanvas.canvas.coords.x, backcanvas.canvas.coords.y, backcanvas.canvas.width, backcanvas.canvas.height,
        0, 0, canvas.width, canvas.height,
    );
}


/**
 * safari doesn't get empty of canvas.
 * Thus fills empty in main canvas when caught negative coords.
 * 
 * USE:: `_redraw(canvas, ctx, backcanvas,
 *      backcanvas.canvas.coords.x, backcanvas.canvas.coords.y,
 *      backcanvas.canvas.width, backcanvas.canvas.height, 0, 0, canvas.width, canvas.height);`
 * @param {HTMLCanvasElement} canvas 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {CanvasImageSource} image 
 * @param {number} sx @param {number} sy 
 * @param {number} sw @param {number} sh 
 * @param {number} dx @param {number} dy 
 * @param {number} dw @param {number} dh 
 */
function _redraw(canvas, ctx, image, sx, sy, sw, sh, dx, dy, dw, dh){
    /**@type {NonnullPosition} */
    const canvasCoords = [sx, sy];
    /**@type {NonnullPosition} */
    var transCoords;
    /**@type {number[]} */
    var args = [ sx, sy, sw, sh, dx, dy, dw, dh ];

    const floor = Math.floor;
    const children = map_children();
    const ratio = dw/sw;
    const bctx = backcanvas.getContext("2d");
    const spare = MAPDATA[CURRENT_FLOOR].spareImage || new Image();

    bctx?.clearRect(0, 0, backcanvas.width, backcanvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (sx < 0 || sy < 0){
        transCoords = canvasCoords.map(
            n => { return -n; }
        );
        args = [
            0, 0,
            sw - transCoords[0],
            sh - transCoords[1],
            transCoords[0]*zoomRatio,
            transCoords[1]*zoomRatio,
            dw - transCoords[0]*zoomRatio,
            dh - transCoords[1]*zoomRatio,
        ];
    }
    
    /**
     * 
     * @param {HTMLCanvasElement} target 
     * @param {HTMLImageElement} spare 
     */
    function drawSpare(target, spare){
        /**@type {[number, number]} */
        const wd = [ 0, 0 ];
        const r = spareRatio();
        const tctx = target.getContext("2d");

        if (r < 1){
            tctx?.drawImage(spare, ...wd, spare.width*r, spare.height*r);
        } else {
            for (var h = 0; h < Math.ceil(target.height/spare.height); h++){
                for (var w = 0; w < Math.ceil(target.width/spare.width); w++){
                    tctx?.drawImage(spare, ...wd, spare.width, spare.height);
                    wd[0] += spare.width;
                }
                wd[0] = 0;
                wd[1] += spare.height;
            }
        }

        function spareRatio(){
            return Math.max(target.width/spare.width, target.height/spare.height);
        }
    }


    if (children && children.length == 1 && children[0].length == 1){
        backcanvas.width = canvas.width;
        backcanvas.height = canvas.height;

        drawSpare(backcanvas, spare);

        //@ts-ignore
        bctx?.drawImage(children[0][0], ...args);
        ctx.drawImage(backcanvas, dx, dy, dw, dh);
    } else {
        // Hmm... what a spare...
        backcanvas.width = dw - 2;
        backcanvas.height = dh - 2;

        drawSpare(backcanvas, spare);

        if (sx < 0){
            args[2] = sw;
            args[4] = floor(-sx*ratio);
        }
        if (sy < 0){
            args[3] = sh;
            args[5] = floor(-sy*ratio);
        }
        const SX = args[0],
            SY = args[1],
            SW = args[2],
            SH = args[3],
            DX = args[4],
            DY = args[5],
            DW = args[6],
            DH = args[7];


        /**@see {@link ./devm/illustration/renderMap.png} */
        const side = 2**12;
        const startCoords = [ SX, SY ];
        const endCoords = [ SX+SW, SY+SH ];
        const startChCoords = [ floor(startCoords[0] / side), floor(startCoords[1] / side) ];
        const endChCoords = [ floor(endCoords[0] / side), floor(endCoords[1] / side) ];
        const currentChCoords = [...startChCoords];
        var remaining_width = SW;
        var remaining_height = SH;


        var minDynamicSX = SX % side;
        var minDynamicSY = SY % side;

        const where_drawing = [ floor(DX), floor(DY) ];
        
        const remCache = [ remaining_width, remaining_height ];
        const wdCache = [...where_drawing];
        
        
        
        for (var vertical = startChCoords[1]; vertical <= endChCoords[1]; vertical++){
            var height = remaining_height;
            
            minDynamicSY = minDynamicSY % side;

            if (floor((minDynamicSY + remaining_height) / side) / floor(minDynamicSY / side) > 1){
                height = side - (minDynamicSY % side);
            }

            // initialize for every vertical draw
            remaining_width = remCache[0];
            minDynamicSX = SX % side;
            where_drawing[0] = wdCache[0];
            currentChCoords[0] = startChCoords[0];

            for (var horizontal = startChCoords[0]; horizontal <= endChCoords[0]; horizontal++){
                while (remaining_width > 0){
                    var width = remaining_width;

                    if (floor((minDynamicSX + remaining_width) / side) / floor(minDynamicSX / side) > 1){
                        width = side - (minDynamicSX % side);
                    }

                    if (minDynamicSX == side)
                        minDynamicSX = 0;
                    if (minDynamicSY == side)
                        minDynamicSY = 0;

                    const renderMap = map_children(currentChCoords[0], currentChCoords[1]);

                    const bc_width = floor(width*ratio),
                        bc_height = floor(height*ratio);

                    if (renderMap != null)
                        bctx?.drawImage(renderMap,
                            minDynamicSX, minDynamicSY, width, height,
                            where_drawing[0], where_drawing[1], bc_width, bc_height
                        );

                    currentChCoords[0]++;
                    minDynamicSX += width;
                    remaining_width -= width;
                    where_drawing[0] += bc_width;
                }
            }

            minDynamicSY += height;
            remaining_height -= height;
            where_drawing[1] += floor(height*ratio);
            currentChCoords[1]++;
        }

        //@ts-ignore
        ctx.drawImage(backcanvas, dx, dy, dw, dh);

        function* a(){
            for (var vertical = startChCoords[1]; vertical <= endChCoords[1]; vertical++){
                for (var horizontal = startChCoords[0]; horizontal <= endChCoords[0]; horizontal++){
                    const source_child_cvs = map_children(horizontal, vertical);
                    const _sx = startCoords[0] - side*horizontal,
                        _sy = startChCoords[1] - side*vertical,
                        _sw = endChCoords[0]*side > endCoords[0] ? side : endCoords[0] - side*horizontal,
                        _sh = endChCoords[1]*side > endCoords[1] ? side : endCoords[1] - side*vertical;
    
                    if (source_child_cvs != null)
                        backcanvas.getContext("2d")?.drawImage(source_child_cvs, _sx, _sy, _sw, _sh, 0, 0, backcanvas.width, backcanvas.height);
                }
            }
            _redraw(canvas, ctx, backcanvas,
                backcanvas.canvas.coords.x, backcanvas.canvas.coords.y,
                backcanvas.canvas.width, backcanvas.canvas.height,
                0, 0, canvas.width, canvas.height,
            );
        }
    }

    updatePositions();
}


/**
 * @ignore
 * @param {HTMLCanvasElement} canvas 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {NonnullPosition} origin 
 * @param {number} [rotation] 
 */
function rotateCanvas(canvas, ctx, origin, rotation){
    if (rotation === void 0){
        rotation = backcanvas.canvas.rotation;
    }
    
    /**
     * 
     * @param {number} rotation 
     */
    function never(rotation){
        const mainclone = document.createElement("canvas");
        mainclone.width = canvas.width; mainclone.height = canvas.height;
        mainclone.getContext("2d")?.drawImage(canvas, 0, 0, mainclone.width, mainclone.height)
        var d = backcanvas.toDataURL();
        var _img = new Image();

        _img.src = d;

        ctx.clearRect(0, 0, backcanvas.width, backcanvas.height);
        ctx.translate(origin[0], origin[1]);
        ctx.rotate(-rotation);
        ctx.translate(-origin[0], -origin[1]);
        
        _redraw(canvas, ctx, backcanvas, backcanvas.canvas.coords.x, backcanvas.canvas.coords.y,
            backcanvas.canvas.width, backcanvas.canvas.height,
            0, 0, canvas.width, canvas.height
        );

        backcanvas.canvas.rotation += rotation;
    }
    
    never(rotation);
}
