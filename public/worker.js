(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/constants.ts
  var command = {
    FETCH: "FETCH"
  };
  var responseType = {
    JSON: "application/json",
    TEXT: "text/plain"
  };

  // src/app/background/worker/commands.ts
  var Commands = class {
    constructor() {
      this.commands = {};
    }
    createCommand(command2, fn) {
      const commandFn = (options, opts) => __async(this, null, function* () {
        try {
          return fn(options, opts);
        } catch (error) {
          if (error instanceof Error)
            throw error;
          throw new Error(String(error));
        }
      });
      this.commands[command2] = commandFn;
    }
  };
  var commands = new Commands();
  commands.createCommand(command.FETCH, function(_0, _1) {
    return __async(this, arguments, function* (options, { postMessage }) {
      var _a;
      const {
        error,
        headers,
        method = "GET",
        params,
        type = responseType.TEXT,
        url = ""
      } = options || {};
      try {
        const response = yield fetch(url, {
          headers: __spreadValues({
            "Content-Type": type
          }, headers),
          method
        });
        const responseMethod = type.substring(type.indexOf("/"));
        const result = yield (_a = response == null ? void 0 : response[type]) == null ? void 0 : _a.call(response, responseMethod);
        postMessage({ command: command.FETCH, result });
      } catch (error2) {
        if (error2 instanceof Error)
          throw error2;
        throw new Error(String(error2));
      }
    });
  });
  var commands_default = commands;

  // src/app/background/worker/createDb.ts
  function createDb(name) {
    if (!name)
      throw new Error(`name is required`);
    const db2 = self.indexedDB.open(name);
    return db2;
  }
  var createDb_default = createDb;

  // src/app/background/worker/createStore.ts
  function createStore(db2) {
    let _transaction = db2.transaction;
    let _store = _transaction == null ? void 0 : _transaction.objectStore(db2.result.name);
    return _store;
  }
  var createStore_default = createStore;

  // src/app/background/worker/backgroundWorker.ts
  var id = `aitmed-noodl-web`;
  var db = registerIndexDbListeners(createDb_default(id));
  var store = createStore_default(db);
  var transaction = db.transaction;
  var style = "color:aquamarine;font-weight:400;";
  var tag = `%c[backgroundWorker]`;
  var log = console.log;
  self.onmessage = function onWorkerMessage(msg) {
    return __async(this, null, function* () {
      var _a, _b;
      let { command: command2, options } = msg.data || {};
      if (command2) {
        return this.postMessage({
          command: command2,
          result: yield (_b = (_a = commands_default.commands)[command2]) == null ? void 0 : _b.call(_a, options, {
            postMessage: this.postMessage.bind(this)
          })
        });
      }
    });
  };
  self.onfetch = (event) => {
    log(`${tag} onfetch`, style, event);
  };
  self.onpush = (event) => {
    log(`${tag} onpush`, style, event);
  };
  self.ononline = (event) => {
    log(`${tag} ononline`, style, event);
  };
  self.onoffline = (event) => {
    log(`${tag} onoffline`, style, event);
  };
  self.onunhandledrejection = (event) => {
    log(`${tag} onunhandledrejection`, style, event);
  };
  function registerIndexDbListeners(db2) {
    const transaction2 = db2.transaction;
    db2.onsuccess = (evt) => {
      transaction2 == null ? void 0 : transaction2.addEventListener("abort", (evt2) => {
        self.postMessage({
          name: `[transaction] abort`,
          timestamp: evt2.timeStamp
        });
      });
      transaction2 == null ? void 0 : transaction2.addEventListener("complete", (evt2) => {
        self.postMessage({
          name: `[transaction] complete`,
          timestamp: evt2.timeStamp
        });
      });
      transaction2 == null ? void 0 : transaction2.addEventListener("error", (evt2) => {
        self.postMessage({
          name: `[transaction] error`,
          timestamp: evt2.timeStamp
        });
      });
      transaction2 == null ? void 0 : transaction2.db.addEventListener("abort", (evt2) => {
        self.postMessage({
          name: `[transaction db] abort`,
          timestamp: evt2.timeStamp
        });
      });
      transaction2 == null ? void 0 : transaction2.db.addEventListener("error", (evt2) => {
        self.postMessage({
          name: `[transaction db] error`,
          timestamp: evt2.timeStamp
        });
      });
      transaction2 == null ? void 0 : transaction2.db.addEventListener("close", (evt2) => {
        self.postMessage({
          name: `[transaction db] close`,
          timestamp: evt2.timeStamp
        });
      });
      transaction2 == null ? void 0 : transaction2.db.addEventListener("versionchange", (evt2) => {
        self.postMessage({
          name: `[transaction db] versionchange`,
          oldVersion: evt2.oldVersion,
          newVersion: evt2.newVersion,
          timestamp: evt2.timeStamp
        });
      });
      self.postMessage({
        message: `Database opened successfully`,
        timestamp: evt.timeStamp,
        db: {
          error: db2.error,
          objectStoreNames: transaction2 == null ? void 0 : transaction2.objectStoreNames,
          objectStore: transaction2 == null ? void 0 : transaction2.objectStore("aitmed-noodl-web"),
          readyState: db2.readyState,
          source: db2.source,
          transaction: {
            error: transaction2 == null ? void 0 : transaction2.error,
            mode: transaction2 == null ? void 0 : transaction2.mode
          }
        }
      });
    };
    db2.onerror = (evt) => {
      self.postMessage({
        name: evt["name"],
        message: evt["message"] || `Error occurred when loading the IndexedDB db`,
        timestamp: evt.timeStamp
      });
    };
    db2.onupgradeneeded = (evt) => {
      self.postMessage({
        message: `Upgrade needed!`,
        oldVersion: evt.oldVersion,
        newVersion: evt.newVersion,
        timestamp: evt.timeStamp
      });
    };
    db2.onblocked = (evt) => {
      self.postMessage({
        message: `Database was blocked`,
        timestamp: evt.timeStamp
      });
    };
    return db2;
  }
})();
//# sourceMappingURL=worker.js.map
