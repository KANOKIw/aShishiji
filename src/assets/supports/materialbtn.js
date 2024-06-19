//@ts-check
"use strict";


function _materialbtnFades(event){
    const button = event.currentTarget;
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    const circle = document.createElement('span');
    
    circle.style.width = `${diameter}px`;
    circle.style.height = `${diameter}px`;

    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;

    circle.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) ripple.remove();
    button.appendChild(circle);
}


//@ts-ignore
const MaterialButton = window.MaterialButton = class MaterialButton{
    /**
     * 
     * @param {HTMLElement} button 
     */
    constructor(button){
        button.addEventListener("click", _materialbtnFades);
    }
}
