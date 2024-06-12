//@ts-check
"use strict";


+async function(){

    LOGIN_INFO.sid = getCookie("__shjSID");

    await $.ajax({
        url: "/login",
        type: "POST",
        success: function(data){
            addLoadHandler(() => PictoNotifier.notifySuccess(`${data.discriminator} としてログインしています`));
        },
        error: function(err){
            addLoadHandler(() => PictoNotifier.notifyWarn("ログインしていません！"));
        }
    });
}();
