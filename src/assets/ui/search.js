//@ts-check
"use strict";


/**
 * when #oive_a is clicked
 */
function searchButtonOnClick(){
    $(cssName.oive_z).show();
    $(cssName.oive_y).removeClass("closeL").addClass("openH");
    $(cssName.searchboxH).removeClass("closeL").addClass("openH");
    $(this).hide();
    displaySearchResult(mapObjectComponent);
}


function closeSearchArea(){
    $(cssName.oive_y).removeClass("openH").addClass("closeL");
    $(cssName.searchboxH).removeClass("openH").addClass("closeL");
    $("#search_result").empty();
    $("#oive_a").show();
}


/**
 * 
 * @param {mapObjComponent} data 
 */
function displaySearchResult(data){
    /**@ts-ignore @type {HTMLElement} */
    const result_box = document.getElementById("search_result");
    $("#search_result").empty();
    for (const evname in data){
        const dat = data[evname];
        if (dat.article){
            const nTypeC = document.createElement("div");
            nTypeC.innerHTML = createSearchHTMLText(dat);
            const meTc = nTypeC.children[0];
            meTc.addEventListener("click", function(){
                setParam(ParamName.ARTICLE_ID, dat.discriminator);
                raiseOverview();
                writeArticleOverview(dat, true);
            });
            result_box.appendChild(meTc);
        }
    }
}


/**
 * 
 * @param {mapObject} data 
 */
function createSearchHTMLText(data){
    const pcvt = getPathConverter(data);
    
    return `<div class="ABId">
                <div class="BIfff">
                    <div class="IcoNium">
                        <img src="${pcvt(data.discriminator, data.object.images.icon)}">
                    </div>
                    <h2>${data.article.title}</h2>
                    <h4>${data.object.floor}</h4>
                </div>
                <div class="AINBU">
                    <h3 class="smlTtl">${data.article.subtitle || ""}</h3>
                    <div class="EZdes">
                        <span class="janS">
                            ${getHTMLtextContent(
                                mcFormat(data.article.content.substring(0, 256), f=>"")
                            ) || "詳細を確認できませんでした。"}
                        </span>
                    </div>
                </div>
            </div>`;
}


window.addEventListener("load", function(e){
    this.document.getElementById("oive_a")?.addEventListener("click", searchButtonOnClick);
    this.document.getElementById("gt_mps")?.addEventListener("click", closeSearchArea);
});
