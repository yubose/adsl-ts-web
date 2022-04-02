"use strict";
self["webpackHotUpdateaitmed_noodl_web"]("main",{

/***/ "./src/piBackgroundWorker.ts":
/*!***********************************!*\
  !*** ./src/piBackgroundWorker.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var sqlweb__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! sqlweb */ "./node_modules/sqlweb/dist/sqlweb.commonjs2.js");
/* harmony import */ var sqlweb__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(sqlweb__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var noodl_pi__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! noodl-pi */ "./packages/noodl-pi/dist/index.js");
/* harmony import */ var noodl_pi__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(noodl_pi__WEBPACK_IMPORTED_MODULE_1__);
importScripts("https://cdn.jsdelivr.net/npm/jsstore/dist/jsstore.worker.min.js");
importScripts("https://cdn.jsdelivr.net/npm/jsstore/dist/jsstore.min.js");
importScripts("https://cdn.jsdelivr.net/npm/jsbi@3.1.0/dist/jsbi-umd.js");


let _self = self;
let _color = "hotpink";
let _tag = "[piBackgroundWorker]";
const dataType = JsStore.DATA_TYPE;
const connection = new JsStore.Connection(new Worker("jsstoreWorker.min.js"));
connection.addPlugin((sqlweb__WEBPACK_IMPORTED_MODULE_0___default()));
connection.on(JsStore.EVENT.Create, function() {
  console.log(`%c${_tag} Create`, `color:${_color}`, arguments[0]);
});
connection.on(JsStore.EVENT.Open, function() {
  console.log(`%c${_tag} Open`, `color:${_color}`, arguments[0]);
});
connection.on(JsStore.EVENT.RequestQueueEmpty, function() {
  console.log(`%c${_tag} RequestQueueEmpty`, `color:${_color}`, arguments[0]);
});
connection.on(JsStore.EVENT.RequestQueueFilled, function() {
  console.log(`%c${_tag} RequestQueueFilled`, `color:${_color}`, arguments[0]);
});
connection.on(JsStore.EVENT.Upgrade, function() {
  console.log(`%c${_tag} Upgrade`, `color:${_color}`, arguments[0]);
});
connection.initDb({
  name: "noodl",
  version: 2,
  tables: [
    {
      name: "version",
      columns: {
        table: { dataType: dataType.String },
        value: { dataType: dataType.String }
      }
    },
    {
      name: "CPT",
      columns: {
        version: { dataType: dataType.String },
        content: { dataType: dataType.Object }
      }
    },
    {
      name: "CPTMod",
      columns: {
        version: { dataType: dataType.String },
        content: { dataType: dataType.Object }
      }
    },
    {
      name: "ecos_doc_table",
      columns: {
        ctime: { dataType: dataType.Number },
        mtime: { dataType: dataType.Number },
        atime: { dataType: dataType.Number },
        atimes: { dataType: dataType.Number },
        id: { dataType: dataType.String, notNull: true, primaryKey: true },
        name: { dataType: dataType.String },
        deat: { dataType: dataType.String },
        size: { dataType: dataType.Number },
        fid: { dataType: dataType.String },
        eid: { dataType: dataType.String },
        bsig: { dataType: dataType.String },
        esig: { dataType: dataType.String },
        subtype: { dataType: dataType.Number },
        type: { dataType: dataType.Number },
        tage: { dataType: dataType.Number }
      }
    },
    {
      name: "index_tables",
      columns: {
        fkey: { dataType: dataType.Number },
        kText: { dataType: dataType.String },
        docId: { dataType: dataType.String },
        docType: { dataType: dataType.Number },
        score: { dataType: dataType.Number }
      }
    },
    {
      name: "api_hash_table",
      columns: {
        api_input_hash: { dataType: dataType.String },
        resultId: { dataType: dataType.String }
      }
    }
  ]
}).then(async () => {
  const pi = new noodl_pi__WEBPACK_IMPORTED_MODULE_1__.Worker("noodl", connection.$sql.run);
  await connection.set("version", { table: "CPT", value: "1.0.3" });
  console.log(`%c${_tag} SELECT * from version`, `color:${_color}`, res);
  pi.use({
    all(evtName, ...args) {
      console.log(`%c${_tag} ${evtName}`, `color:${_color};`, args);
    },
    async message(evt) {
      var _a, _b;
      const data = evt.data;
      const type = data == null ? void 0 : data.type;
      console.log(`%c${_tag} Message "${type}"`, `color:${_color};`, data);
      switch (type) {
        case "storeData": {
          const { table, data: dataToStore } = data;
          return connection.insert({
            into: table,
            values: dataToStore
          });
        }
        case "search": {
          const { table, query } = data;
          switch (table) {
            case "CPT": {
              if (!query) {
                const resp = await _self.fetch(`http://127.0.0.1:3000/cpt`);
                const respData = await resp.json();
                const version = (_a = respData == null ? void 0 : respData.CPT) == null ? void 0 : _a.version;
                const content = (_b = respData == null ? void 0 : respData.CPT) == null ? void 0 : _b.content;
                return pi.sendMessage({
                  type: "searchResult",
                  query,
                  result: content,
                  table
                });
              }
            }
          }
        }
        case "get":
        case "delete":
        case "update": {
          return pi.emit(type, data);
        }
      }
    },
    messageError(evt) {
      console.log(`%c${_tag} messageError`, `color: ${_color}`, evt);
    },
    rejectionHandled(evt) {
      console.log(`%c${_tag} rejectionHandled`, `color: ${_color}`, evt);
    },
    rejectionUnhandled(evt) {
      console.log(`%c${_tag} rejectionUnhandled`, `color: ${_color}`, evt);
    }
  });
  return pi.sendMessage({ type: "workerInitiated" });
}).catch((error) => {
  console.error(error);
});


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("dfb271efcdd3a847feb2")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.ce7572b90c7d53e0dddf.hot-update.js.map