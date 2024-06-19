/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!**************************************!*\
  !*** ./src/firebase-messaging-sw.ts ***!
  \**************************************/
[{'revision':'d07deb63b3c2927312ee30a83d505824','url':'chatDefaultImage.svg'},{'revision':'1074aae6c95a343b28cbc3a331ed60e3','url':'index.html'},{'revision':'8550fd991599f216807d23f0f0a1b2e9','url':'jsstoreWorker.min.js'},{'revision':null,'url':'main.79a0eeff16504c2c303d.hot-update.js'},{'revision':null,'url':'main.79a0eeff16504c2c303d.hot-update.json'},{'revision':'f3658c4a0fa9ca1ceaf2b392cda2eb3d','url':'main.js'},{'revision':'442619bc185244b7677841358cb771a6','url':'piBackgroundWorker.js'},{'revision':'85541ab24eaf9c46891b8f04d5e0d454','url':'ring.mp3'},{'revision':'e96391fc594b5869546a3cdac4e76b10','url':'sql-wasm.wasm'},{'revision':null,'url':'src_app_noodl_ts.79a0eeff16504c2c303d.hot-update.js'},{'revision':'ab88560219823392701b69a0c52015f1','url':'src_app_noodl_ts.js'},{'revision':'091407e34d2879b8e4792c9f6f732b3e','url':'src_app_trackers_ts.js'},{'revision':'b25e5d007d799fa2805af9c79c139169','url':'src_handlers_history_ts.js'},{'revision':'6862230402d1e360246b0d132d13a795','url':'vendors-cadl_node_modules_aitmed_protorepo_js_ecos_v1beta1_types_pb_js-cadl_node_modules_jsma-1c5bd8.js'},{'revision':'addb4e85d863c9babc86996791e40fce','url':'vendors-cadl_node_modules_canvg_lib_index_es_js.js'},{'revision':'07188cc3a193acc19de63ab83241d953','url':'vendors-cadl_node_modules_dompurify_dist_purify_js.js'},{'revision':'554607c4e480ff6cd97e5424de7006e2','url':'vendors-node_modules_canvg_lib_index_es_js-_1b8e.js'},{'revision':'fffbf04b1b72c47f12b68c7d85ed597d','url':'vendors-node_modules_canvg_lib_index_es_js-_d37b.js'},{'revision':'aff6bfcbf85e38a027661307159d8ae5','url':'vendors-node_modules_dompurify_dist_purify_js-_3e09.js'},{'revision':'64788ab84ac1fb15ece5d07a9ac46dd7','url':'vendors-node_modules_dompurify_dist_purify_js-_c0c4.js'},{'revision':'f5c62ec0214a98474528632531f97503','url':'vendors-node_modules_html2canvas_dist_html2canvas_js.js'},{'revision':'9cf6816eac9158d52f7819df64929482','url':'vendors-node_modules_noodl-yaml_dist_index_js.js'}];
importScripts("https://www.gstatic.com/firebasejs/8.2.5/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.2.5/firebase-messaging.js");
firebase.initializeApp({
  apiKey: "AIzaSyCjNVKmHuDKra5Ct1MKAJ5fI0iQ3UnK7Ho",
  authDomain: "aitmessage.firebaseapp.com",
  databaseURL: "https://aitmessage.firebaseio.com",
  projectId: "aitmessage",
  storageBucket: "aitmessage.appspot.com",
  messagingSenderId: "121837683309",
  appId: "1:121837683309:web:c74076cea3ba35c35f3564"
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage(function(payload) {
  console.log("[serviceWorker.js] Received background message ", payload);
  const { collapseKey, data, from, notification = {} } = payload;
  const notificationTitle = data.title || "";
  const notificationOptions = {
    body: data.body || "",
    icon: "favicon.ico"
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
const style = `color:#C04000;font-weight:500;`;
const tag = `%c[serviceWorker]`;
const log = console.log;
self.addEventListener("install", function(evt) {
  console.log(`${tag} install`, evt);
});
self.addEventListener("activate", function(evt) {
  log(`${tag} activate`, evt);
});
self.addEventListener("message", function(messageEvent) {
  log(`${tag} message`, messageEvent);
  if (messageEvent.data === "skipWaiting")
    return this.skipWaiting();
});
self.addEventListener("fetch", function onFetch(event) {
});
self.addEventListener("notificationclick", function(evt) {
  var _a;
  const { data } = evt.notification;
  log(`${tag} Notification clicked`, style, {
    action: evt.action,
    notification: {
      title: evt.notification.title,
      body: evt.notification.body,
      data: evt.notification.data,
      dir: evt.notification.dir,
      icon: evt.notification.icon,
      lang: evt.notification.lang,
      tag: evt.notification.tag
    },
    timestamp: evt.timeStamp,
    type: evt.type,
    evt
  });
  if ((data == null ? void 0 : data.type) === "update-click") {
    evt.notification.close();
    (_a = this.registration.waiting) == null ? void 0 : _a.postMessage({ type: "send-skip-waiting" });
  }
});
self.addEventListener("push", function(pushEvt) {
  var _a;
  log(`${tag} Push`, style, {
    data: pushEvt.data,
    timestamp: pushEvt.timeStamp,
    type: pushEvt.type,
    pushEvt
  });
  const data = pushEvt.data;
  const currentTarget = pushEvt.currentTarget;
  const location = (_a = pushEvt == null ? void 0 : pushEvt.target) == null ? void 0 : _a.location;
  const navigator = currentTarget == null ? void 0 : currentTarget.navigator;
  const connection = navigator.connection;
  const storage = navigator.storage;
  const { onLine, userAgent } = navigator;
  const platform = navigator.platform;
  const userAgentData = navigator.userAgentData;
  const isMobile = userAgentData.mobile;
  const caches = self.caches;
});
self.addEventListener("online", function(evt) {
  log(`${tag} online`, evt);
});
self.addEventListener("offline", function(evt) {
  log(`${tag} offline`, evt);
});
self.addEventListener("error", function(errEvt) {
  log(`${tag} error`, errEvt);
});
self.addEventListener("messageerror", function(evt) {
  log(`${tag} messageerror`, evt);
});
self.addEventListener("rejectionhandled", function(evt) {
  log(`${tag} rejectionhandled`, evt);
});
self.addEventListener("unrejectionhandled", function(evt) {
  log(`${tag} unrejectionhandled`, evt);
});

/******/ })()
;