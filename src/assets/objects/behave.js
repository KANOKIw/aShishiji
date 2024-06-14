//@ts-check
"use strict";


function updatePositions(){
    for (const _mapObj of document.getElementsByClassName("mpob")){
        /**@ts-ignore @type {mapObjectElement} */
        const mapObj = _mapObj;
        const coords = getCoords(mapObj);
        var transforms = "";
        const objectCoords_fromCanvas = {
            x: (coords.x - backcanvas.canvas.coords.x) * zoomRatio,
            y: (coords.y - backcanvas.canvas.coords.y) * zoomRatio,
        };

        var behavior = getBehavior(mapObj);
        const dfsize = getDefaultSize(mapObj);

        var size = Object.create(dfsize);

        if (behavior == "dynamic"){
            if (zoomRatio > MOVEPROPERTY.object.dynamic_to_static.over) behavior = "dynatic";
            if (zoomRatio < MOVEPROPERTY.object.dynamic_to_static.under) behavior = "_dynatic";
        }

        switch (behavior){
            case "static":
                size.width = dfsize.width*zoomRatio;
                size.height = dfsize.height*zoomRatio;
                break;
            case "dynatic":
                size.width = dfsize.width*(zoomRatio / MOVEPROPERTY.object.dynamic_to_static.over);
                size.height = dfsize.height*(zoomRatio / MOVEPROPERTY.object.dynamic_to_static.over);
                break;
            case "_dynatic":
                size.width = dfsize.width*(zoomRatio / MOVEPROPERTY.object.dynamic_to_static.under);
                size.height = dfsize.height*(zoomRatio / MOVEPROPERTY.object.dynamic_to_static.under);
                break;
            case "dynamic":
            default:

                break;
        }

        transforms += `translate(${objectCoords_fromCanvas.x}px, ${objectCoords_fromCanvas.y}px)`;
        
        mapObj.style.transform = transforms;
        
        if (size.width != dfsize.width || size.height != dfsize.height)
            $($(mapObj).children()[0])
                .css("min-width", size.width+"px")
                .css("min-height", size.height+"px")
                .css("max-width", size.width+"px")
                .css("max-height", size.height+"px");
    }
}


/**
 * 
 * @param {string} disc 
 * @returns {HTMLElement}
 */
function getObject(disc){
    const k = document.getElementById(formatString(objectIdFormat, disc));

    if (k == null)
        throw new Error("No Object was found.");
    return k;
}


/**
 * 
 * @param {string} discriminator 
 * @param {string} message 
 */
function setObjectMessageAbove(discriminator, message){
    const obje = getObject(discriminator);
}


/**
 * 
 * @param {string} discriminator 
 */
function setObjectCleared(discriminator){
    const obje = getObject(discriminator);
    
    obje.children[0].classList.add("mpob-clerdd");
    $(obje.children[0]).prepend(`<div class="Hjasgia"><K></K><R></R></div>`);
}
