//@ts-check
"use strict";


/**
 * when #oive_a is clicked
 */
function openNorm(){
    $("#gtnorm").addClass("openH");
    $("shishiji-normal-void").removeClass("Byeonig").addClass("Hellonig").show();
    $("#gtmap").removeClass("closeH");
}


function closeNorm(){
    $("#gtmap").addClass("closeH");
    $("shishiji-normal-void").removeClass("Hellonig").addClass("Byeonig");
    $("#gtnorm").removeClass("openH");
}


window.addEventListener("load", function(){
    this.document.getElementById("gtnorm")?.addEventListener("click", openNorm);
    this.document.getElementById("gtmap")?.addEventListener("click", closeNorm);
});
