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

  // src/modules/NoodlWorker/commands.ts
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

  // src/worker.ts
  var style = "color:aquamarine;font-weight:400;";
  var tag = `%c[Worker]`;
  var log = console.log;
  self.oninstall = (event) => {
    log(`${tag} oninstall`, style, event);
  };
  self.onactivate = (event) => {
    log(`${tag} onactivate`, style, event);
  };
  self.addEventListener("message", function onWorkerMessage(msg) {
    return __async(this, null, function* () {
      var _a, _b;
      let data = msg.data || {};
      const { command: command2, options, type } = data;
      if (command2) {
        this.postMessage({
          command: command2,
          result: yield (_b = (_a = commands_default.commands)[command2]) == null ? void 0 : _b.call(_a, options, {
            postMessage: this.postMessage.bind(this)
          })
        });
      } else if (type) {
        const databases = yield this.indexedDB.databases();
        const database = this.indexedDB.open(`aitmed-noodl-web`);
        const transaction = database.transaction;
        const store = transaction == null ? void 0 : transaction.objectStore(`aitmed-noodl-web`);
        database.onsuccess = (evt) => {
          transaction == null ? void 0 : transaction.addEventListener("abort", (evt2) => {
            this.postMessage({
              name: `[transaction] abort`,
              timestamp: evt2.timeStamp
            });
          });
          transaction == null ? void 0 : transaction.addEventListener("complete", (evt2) => {
            this.postMessage({
              name: `[transaction] complete`,
              timestamp: evt2.timeStamp
            });
          });
          transaction == null ? void 0 : transaction.addEventListener("error", (evt2) => {
            this.postMessage({
              name: `[transaction] error`,
              timestamp: evt2.timeStamp
            });
          });
          transaction == null ? void 0 : transaction.db.addEventListener("abort", (evt2) => {
            this.postMessage({
              name: `[transaction db] abort`,
              timestamp: evt2.timeStamp
            });
          });
          transaction == null ? void 0 : transaction.db.addEventListener("error", (evt2) => {
            this.postMessage({
              name: `[transaction db] error`,
              timestamp: evt2.timeStamp
            });
          });
          transaction == null ? void 0 : transaction.db.addEventListener("close", (evt2) => {
            this.postMessage({
              name: `[transaction db] close`,
              timestamp: evt2.timeStamp
            });
          });
          transaction == null ? void 0 : transaction.db.addEventListener("versionchange", (evt2) => {
            this.postMessage({
              name: `[transaction db] versionchange`,
              oldVersion: evt2.oldVersion,
              newVersion: evt2.newVersion,
              timestamp: evt2.timeStamp
            });
          });
          this.postMessage({
            message: `Database opened successfully`,
            timestamp: evt.timeStamp,
            database: {
              error: database.error,
              objectStoreNames: transaction == null ? void 0 : transaction.objectStoreNames,
              objectStore: transaction == null ? void 0 : transaction.objectStore("aitmed-noodl-web"),
              readyState: database.readyState,
              source: database.source,
              transaction: {
                error: transaction == null ? void 0 : transaction.error,
                mode: transaction == null ? void 0 : transaction.mode
              }
            },
            allDatabases: databases
          });
        };
        database.onerror = (evt) => {
          this.postMessage({
            name: evt["name"],
            message: evt["message"] || `Error occurred when loading the IndexedDB database`,
            timestamp: evt.timeStamp
          });
        };
        database.onupgradeneeded = (evt) => {
          this.postMessage({
            message: `Upgrade needed!`,
            oldVersion: evt.oldVersion,
            newVersion: evt.newVersion,
            timestamp: evt.timeStamp
          });
        };
        database.onblocked = (evt) => {
          this.postMessage({
            message: `Database was blocked`,
            timestamp: evt.timeStamp
          });
        };
        this.postMessage({
          greeting: `Thank you for your message`,
          databases
        });
      }
    });
  });
  self.onfetch = (event) => {
    log(`${tag} onfetch`, style, event);
  };
  self.onpush = (event) => {
    log(`${tag} onpush`, style, event);
  };
})();
//# sourceMappingURL=worker.js.map
