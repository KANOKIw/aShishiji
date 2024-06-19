//@ts-check
"use strict";


+async function(){

    LOGIN_INFO.sid = getCookie("__shjSID");

    await $.ajax({
        url: "/login",
        type: "POST",
        success: function(data){
            LOGIN_INFO.logined = true;
            LOGIN_INFO.discriminator = data.discriminator;
            addLoadHandler(() => PictoNotifier.notifySuccess(`${data.discriminator} としてログインしています`));
            
            const completed_org = JSON.parse(data.completed_org);

            LOGIN_INFO.data.completed_org = completed_org;
        },
        error: function(err){
            addLoadHandler(() => PictoNotifier.notifyWarn("ログインしていません！"));
        }
    });
}();
