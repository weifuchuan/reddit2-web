"use strict";var precacheConfig=[["https://cdn.jsdelivr.net/gh/weifuchuan/reddit2-web@0.1.1/build/index.html","98d54bde7d54b13e19d831d5433b3be2"],["https://cdn.jsdelivr.net/gh/weifuchuan/reddit2-web@0.1.1/build/static/css/main.4bc935f9.css","ed2dc344828fdaca0328525e7623a0d2"],["https://cdn.jsdelivr.net/gh/weifuchuan/reddit2-web@0.1.1/build/static/js/1.f8dfc1d0.chunk.js","69df84ce11d528da01e89d7417ae14ae"],["https://cdn.jsdelivr.net/gh/weifuchuan/reddit2-web@0.1.1/build/static/js/2.7e752ecc.chunk.js","df61267e2a151649e3f751e594ffc7cb"],["https://cdn.jsdelivr.net/gh/weifuchuan/reddit2-web@0.1.1/build/static/js/3.ad0dc5bc.chunk.js","2af4650d82355b3eb07b2e801223d71a"],["https://cdn.jsdelivr.net/gh/weifuchuan/reddit2-web@0.1.1/build/static/js/4.737486fc.chunk.js","70a29f1caa8bf4df18e527faf810234b"],["https://cdn.jsdelivr.net/gh/weifuchuan/reddit2-web@0.1.1/build/static/js/5.107dc8ee.chunk.js","0c3880ca3d9cc4b69e885828870ebff4"],["https://cdn.jsdelivr.net/gh/weifuchuan/reddit2-web@0.1.1/build/static/js/6.024a8e6c.chunk.js","ae6089f98c025baa09c465256537b5f1"],["https://cdn.jsdelivr.net/gh/weifuchuan/reddit2-web@0.1.1/build/static/js/7.6f46f6e7.chunk.js","5552b7e83528b2d1683f7e319915d6e3"],["https://cdn.jsdelivr.net/gh/weifuchuan/reddit2-web@0.1.1/build/static/js/8.0bc42440.chunk.js","75ecd228c01ad7a437cb2249d6f95844"],["https://cdn.jsdelivr.net/gh/weifuchuan/reddit2-web@0.1.1/build/static/js/9.0cd1300d.chunk.js","676a80fe43e06e776628cb9d4d242c6b"],["https://cdn.jsdelivr.net/gh/weifuchuan/reddit2-web@0.1.1/build/static/js/main.56dd07a0.js","e88aaa8b4da70acbec4336b789588597"],["https://cdn.jsdelivr.net/gh/weifuchuan/reddit2-web@0.1.1/build/static/media/home-banner@2x.03f8cb76.png","03f8cb76e1e04b4ae0929a41b42d276d"],["https://cdn.jsdelivr.net/gh/weifuchuan/reddit2-web@0.1.1/build/static/media/snoo-home@2x.374ec6c8.png","374ec6c84e168d10bf785aa2e74395e5"],["https://cdn.jsdelivr.net/gh/weifuchuan/reddit2-web@0.1.1/build/static/media/youlin.13aa068e.png","13aa068e4e3f2c420ac9419edb1ad8fa"]],cacheName="sw-precache-v3-sw-precache-webpack-plugin-"+(self.registration?self.registration.scope:""),ignoreUrlParametersMatching=[/^utm_/],addDirectoryIndex=function(e,t){var n=new URL(e);return"/"===n.pathname.slice(-1)&&(n.pathname+=t),n.toString()},cleanResponse=function(t){return t.redirected?("body"in t?Promise.resolve(t.body):t.blob()).then(function(e){return new Response(e,{headers:t.headers,status:t.status,statusText:t.statusText})}):Promise.resolve(t)},createCacheKey=function(e,t,n,r){var a=new URL(e);return r&&a.pathname.match(r)||(a.search+=(a.search?"&":"")+encodeURIComponent(t)+"="+encodeURIComponent(n)),a.toString()},isPathWhitelisted=function(e,t){if(0===e.length)return!0;var n=new URL(t).pathname;return e.some(function(e){return n.match(e)})},stripIgnoredUrlParameters=function(e,n){var t=new URL(e);return t.hash="",t.search=t.search.slice(1).split("&").map(function(e){return e.split("=")}).filter(function(t){return n.every(function(e){return!e.test(t[0])})}).map(function(e){return e.join("=")}).join("&"),t.toString()},hashParamName="_sw-precache",urlsToCacheKeys=new Map(precacheConfig.map(function(e){var t=e[0],n=e[1],r=new URL(t,self.location),a=createCacheKey(r,hashParamName,n,/\.\w{8}\./);return[r.toString(),a]}));function setOfCachedUrls(e){return e.keys().then(function(e){return e.map(function(e){return e.url})}).then(function(e){return new Set(e)})}self.addEventListener("install",function(e){e.waitUntil(caches.open(cacheName).then(function(r){return setOfCachedUrls(r).then(function(n){return Promise.all(Array.from(urlsToCacheKeys.values()).map(function(t){if(!n.has(t)){var e=new Request(t,{credentials:"same-origin"});return fetch(e).then(function(e){if(!e.ok)throw new Error("Request for "+t+" returned a response with status "+e.status);return cleanResponse(e).then(function(e){return r.put(t,e)})})}}))})}).then(function(){return self.skipWaiting()}))}),self.addEventListener("activate",function(e){var n=new Set(urlsToCacheKeys.values());e.waitUntil(caches.open(cacheName).then(function(t){return t.keys().then(function(e){return Promise.all(e.map(function(e){if(!n.has(e.url))return t.delete(e)}))})}).then(function(){return self.clients.claim()}))}),self.addEventListener("fetch",function(t){if("GET"===t.request.method){var e,n=stripIgnoredUrlParameters(t.request.url,ignoreUrlParametersMatching),r="index.html";(e=urlsToCacheKeys.has(n))||(n=addDirectoryIndex(n,r),e=urlsToCacheKeys.has(n));var a="/index.html";!e&&"navigate"===t.request.mode&&isPathWhitelisted(["^(?!\\/__).*"],t.request.url)&&(n=new URL(a,self.location).toString(),e=urlsToCacheKeys.has(n)),e&&t.respondWith(caches.open(cacheName).then(function(e){return e.match(urlsToCacheKeys.get(n)).then(function(e){if(e)return e;throw Error("The cached response that was expected is missing.")})}).catch(function(e){return console.warn('Couldn\'t serve response for "%s" from cache: %O',t.request.url,e),fetch(t.request)}))}});