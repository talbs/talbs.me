!function(e){function t(o){if(n[o])return n[o].exports;var r=n[o]={exports:{},id:o,loaded:!1};return e[o].call(r.exports,r,r.exports,t),r.loaded=!0,r.exports}var n={};return t.m=e,t.c=n,t.p="javascripts/",t(0)}([function(e,t,n){e.exports=n(1)},function(e,t,n){"use strict";n(2),console.log("app.js has loaded!")},function(e,t,n){"use strict";for(var o=document.querySelectorAll("[data-module]"),r=0;r<o.length;r++){var u=o[r],a=u.getAttribute("data-module"),s=n(3)("./"+a)["default"];new s(u)}},function(e,t,n){function o(e){return n(r(e))}function r(e){return u[e]||function(){throw new Error("Cannot find module '"+e+"'.")}()}var u={"./example":4,"./example.js":4,"./index":2,"./index.js":2};o.keys=function(){return Object.keys(u)},o.resolve=r,e.exports=o,o.id=3},function(e,t){"use strict";function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var o=function r(e){n(this,r),this.el=e,console.log(e.textContent,"- From the example module")};t["default"]=o}]);