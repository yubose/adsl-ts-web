/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!**************************************!*\
  !*** ./src/firebase-messaging-sw.ts ***!
  \**************************************/
[{'revision':'67b962817f114316b208d37108a2ef22','url':'index.html'},{'revision':'8550fd991599f216807d23f0f0a1b2e9','url':'jsstoreWorker.min.js'},{'revision':null,'url':'main.d315b33d3da4b8ade82a.hot-update.js'},{'revision':null,'url':'main.d315b33d3da4b8ade82a.hot-update.json'},{'revision':'7cd6ebd58111a67f45b55146eacf64a4','url':'main.js'},{'revision':'442619bc185244b7677841358cb771a6','url':'piBackgroundWorker.js'},{'revision':'e96391fc594b5869546a3cdac4e76b10','url':'sql-wasm.wasm'},{'revision':'eac6ab23ef3789ed28b5bcfc88b254aa','url':'src_app_noodl_ts.js'},{'revision':'091407e34d2879b8e4792c9f6f732b3e','url':'src_app_trackers_ts.js'},{'revision':'b25e5d007d799fa2805af9c79c139169','url':'src_handlers_history_ts.js'},{'revision':'ee953cbf27920500a585c5cfe2fc19e6','url':'vendors-node_modules_canvg_lib_index_es_js.js'},{'revision':'63d86412ee1b58f5ea95bed50653d4d3','url':'vendors-node_modules_dompurify_dist_purify_js.js'},{'revision':'f5c62ec0214a98474528632531f97503','url':'vendors-node_modules_html2canvas_dist_html2canvas_js.js'},{'revision':'9cf6816eac9158d52f7819df64929482','url':'vendors-node_modules_noodl-yaml_dist_index_js.js'}];
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
  const notificationTitle = notification.title || "";
  const notificationOptions = {
    body: notification.body || "",
    icon: "favicon.ico"
  };
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