/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!**************************************!*\
  !*** ./src/firebase-messaging-sw.ts ***!
  \**************************************/
[{'revision':'dee107431beb917d0542db961a461956','url':'index.html'},{'revision':'0a819bdcc8dcf0e910b3b640f1fdfb74','url':'jsstoreWorker.min.js'},{'revision':'c6d3de6db3a99fd2609521ace35e2fc0','url':'main.js'},{'revision':'78c679a626cc1e8d58eab65b240d0288','url':'piBackgroundWorker.js'},{'revision':'85541ab24eaf9c46891b8f04d5e0d454','url':'ring.mp3'},{'revision':'e96391fc594b5869546a3cdac4e76b10','url':'sql-wasm.wasm'},{'revision':'e466ade97aef828315fe9f884ed5381b','url':'src_app_noodl_ts.js'},{'revision':'2dcf3d09e7e7d5fce72d752e0d70e1ef','url':'src_app_trackers_ts.js'},{'revision':'915c2cdd602fd9f4cd2570389ee80387','url':'src_handlers_history_ts.js'},{'revision':'153a023e623862a77c62475680a02987','url':'vendors-node_modules_canvg_lib_index_es_js.js'},{'revision':'7cb6d10a0b71f21e483ccda4411e7c57','url':'vendors-node_modules_dompurify_dist_purify_js.js'},{'revision':'f5c62ec0214a98474528632531f97503','url':'vendors-node_modules_html2canvas_dist_html2canvas_js.js'},{'revision':'9cf6816eac9158d52f7819df64929482','url':'vendors-node_modules_noodl-yaml_dist_index_js.js'}];
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