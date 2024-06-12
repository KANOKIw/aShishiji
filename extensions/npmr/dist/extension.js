(()=>{"use strict";var e={112:function(e,n,t){var o=this&&this.__createBinding||(Object.create?function(e,n,t,o){void 0===o&&(o=t);var s=Object.getOwnPropertyDescriptor(n,t);s&&!("get"in s?!n.__esModule:s.writable||s.configurable)||(s={enumerable:!0,get:function(){return n[t]}}),Object.defineProperty(e,o,s)}:function(e,n,t,o){void 0===o&&(o=t),e[o]=n[t]}),s=this&&this.__setModuleDefault||(Object.create?function(e,n){Object.defineProperty(e,"default",{enumerable:!0,value:n})}:function(e,n){e.default=n}),r=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var n={};if(null!=e)for(var t in e)"default"!==t&&Object.prototype.hasOwnProperty.call(e,t)&&o(n,e,t);return s(n,e),n},i=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(n,"__esModule",{value:!0}),n.activate=void 0;const c=r(t(496)),a=i(t(17)),d=i(t(81)),u=i(t(147)),l=t(364);async function p(e,n){const t=JSON.parse(u.default.readFileSync(e,{encoding:"utf-8"})),o=t.dependencies||{},s=t.devDependencies||{},r=t.devDependencies||{},i=a.default.dirname(e);if(Object.keys({...o,...s,...r}).length>0){const e=[],n=[],t=[];for(const n in o){const t=o[n];e.push(n.concat("@",t.slice(1)))}for(const e in s){const t=s[e];n.push(e.concat("@",t.slice(1)))}for(const e in s){const n=r[e];t.push(e.concat("@",n.slice(1)))}const a="npm install ".concat([...e,...n,...t].join(" ")),u=c.window.createStatusBarItem(c.StatusBarAlignment.Left);u.text="$(sync~spin) Installing dependencies",u.show(),process.chdir(i),d.default.exec(a,(o=>{u.dispose(),o?c.window.showErrorMessage(`Error while installing package: \nDirectory: ${i}, Error: ${o.message}`):c.window.showInformationMessage(`Directory: ${i}\ndependencies: ${e.length>0?e.join(", "):"none"}\n\t\t\t\ndevDependencies: ${n.length>0?n.join(", "):"none"}\n\t\t\t\nengines: ${t.length>0?t.join(", "):"none"}`)}))}else n&&c.window.showInformationMessage("No dependencies or devDependencies found in package.json.")}function f(){const e=c.window.createStatusBarItem(c.StatusBarAlignment.Left);return e.text="$(sync~spin) Installing dependencies",e.show(),e}n.activate=function(e){const n=c.commands.registerCommand("npmr.do_workspace_directory",(async function(){const e=c.workspace.workspaceFolders?.[0];if(e){const n=e.uri.fsPath,t=a.default.join(n,"package.json");if(u.default.existsSync(t)){const e=f();await p(t,!0),e.dispose()}else c.window.showErrorMessage("No package.json found in the workspace.")}else c.window.showErrorMessage("No workspace opened.")})),t=c.commands.registerCommand("npmr.do_all_directory",(async function(){const e=c.workspace.workspaceFolders?.[0];if(e){const n=e.uri.fsPath,t=(0,l.listFiles)(n).filter((e=>{if("package.json"===a.default.basename(e)&&!(0,l.toSlashPath)(e).includes("/node_modules/"))return!0})).map((e=>a.default.join(n,e)));if(0==t.length)c.window.showErrorMessage("No package.json found under the workspace.");else{const e=[],n=f();for(const n of t)e.push(p(n));Promise.all(e).then((e=>{n.dispose()}))}}else c.window.showErrorMessage("No workspace opened.")}));e.subscriptions.push(n,t)}},364:function(e,n,t){var o=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(n,"__esModule",{value:!0}),n.toSlashPath=n.listFiles=void 0;const s=o(t(147)),r=o(t(17));n.listFiles=function(e){const n=[];return function e(t){const o=s.default.readdirSync(t);for(const i of o){const o=r.default.join(t,i);s.default.statSync(o).isDirectory()?e(o):n.push(o)}}(e),n.map((n=>n.replace(e,"")))},n.toSlashPath=function(e){return e.replace(/\\/g,"/").replace(/\\\\/g,"/").replace(/\/\//g,"/")}},496:e=>{e.exports=require("vscode")},81:e=>{e.exports=require("child_process")},147:e=>{e.exports=require("fs")},17:e=>{e.exports=require("path")}},n={},t=function t(o){var s=n[o];if(void 0!==s)return s.exports;var r=n[o]={exports:{}};return e[o].call(r.exports,r,r.exports,t),r.exports}(112);module.exports=t})();