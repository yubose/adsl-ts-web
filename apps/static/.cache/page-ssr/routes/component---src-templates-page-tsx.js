exports.id = "component---src-templates-page-tsx";
exports.ids = ["component---src-templates-page-tsx"];
exports.modules = {

/***/ "./src/components/PageContext.tsx":
/*!****************************************!*\
  !*** ./src/components/PageContext.tsx ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "usePageCtx": () => (/* binding */ usePageCtx)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils_createCtx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/utils/createCtx */ "./src/utils/createCtx.tsx");
/* harmony import */ var _hooks_useContextLists__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/hooks/useContextLists */ "./src/hooks/useContextLists.tsx");
/* harmony import */ var _emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @emotion/react/jsx-runtime */ "./node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.esm.js");




const [usePageCtx, Provider] = (0,_utils_createCtx__WEBPACK_IMPORTED_MODULE_1__["default"])();

function PageContext({
  assetsUrl,
  baseUrl,
  children,
  lists: listsMap,
  name,
  components,
  refs,
  slug
}) {
  const {
    getCtxObject,
    getDataObject,
    getId,
    getIteratorVar,
    getListObject,
    isCtxObj,
    isListConsumer,
    lists
  } = (0,_hooks_useContextLists__WEBPACK_IMPORTED_MODULE_2__["default"])(listsMap);
  const ctx = {
    assetsUrl,
    baseUrl,
    getId,
    getCtxObject,
    getIteratorVar,
    getListObject,
    getDataObject,
    isCtxObj,
    isListConsumer,
    lists,
    name,
    components,
    refs,
    slug
  };
  return (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(Provider, {
    value: ctx,
    children: children
  });
}


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (PageContext);

/***/ }),

/***/ "./src/components/Seo.tsx":
/*!********************************!*\
  !*** ./src/components/Seo.tsx ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _public_page_data_sq_d_2582528629_json__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../public/page-data/sq/d/2582528629.json */ "./public/page-data/sq/d/2582528629.json");
/* harmony import */ var _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jsmanifest/utils */ "../../node_modules/@jsmanifest/utils/dist/index.js");
/* harmony import */ var _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react-helmet */ "./node_modules/react-helmet/es/Helmet.js");
/* harmony import */ var _emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @emotion/react/jsx-runtime */ "./node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.esm.js");


/**
 * https://www.gatsbyjs.com/docs/use-static-query/
 */






const socialMedia = {
  facebook: 'https://www.facebook.com/AITMEDinc',
  pinterest: 'https://www.pinterest.com/aitmedinc/_created/',
  linkedin: 'https://www.linkedin.com/company/aitmed',
  twitter: 'https://www.twitter.com/AITmedInc',
  tiktok: 'https://www.tiktok.com/@aitmedinc?lang=en',
  youtube: 'https://www.youtube.com/channel/UC1su9VCcj8-Ml02W9g35kpw'
};

function renderMediaMetaTag(type = 'og', assetType, value) {
  const prefix = type === 'twitter' ? 'twitter' : 'og';
  const property = `${prefix}:${assetType}`;

  if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_1__.isStr(value)) {
    return (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
      property: property,
      content: value
    });
  }

  if (value && _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_1__.isObj(value)) {
    return (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
      children: [assetType === 'image' && value.alt && (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
        property: "og:image:alt",
        content: String(value.alt)
      }) || null, (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
        property: `${property}:width`,
        content: String(value.width)
      }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
        property: `${property}:height`,
        content: String(value.height)
      })]
    });
  }

  return null;
}

function Seo({
  title = '',
  description = '',
  canonical = '',
  lang = 'en',
  og = {},
  twitter = {},
  url = '',
  allowIndex = true,
  allowFollow = true
}) {
  const {
    site: {
      siteMetadata: {
        siteName,
        siteTitle,
        siteDescription,
        siteLogo,
        siteUrl,
        siteVideo
      }
    }
  } = _public_page_data_sq_d_2582528629_json__WEBPACK_IMPORTED_MODULE_0__.data;
  return (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_helmet__WEBPACK_IMPORTED_MODULE_3__.Helmet, {
    htmlAttributes: {
      lang
    },
    children: [(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("title", {
      children: title || siteTitle
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
      name: "description",
      content: description || siteDescription
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
      name: "keywords",
      content: [].join(',')
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
      name: "image",
      content: siteLogo
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
      name: "robots",
      content: `${allowIndex ? 'index' : 'noindex'}, ${allowFollow ? 'follow' : 'nofollow'}`
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
      property: "og:title",
      content: og.title || title || siteTitle
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
      property: "og:description",
      content: og.description || description || siteDescription
    }), renderMediaMetaTag('og', 'image', og.image), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
      property: "og:locale",
      content: og.locale || 'en_US'
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
      property: "og:site_name",
      content: og.siteName || siteName
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
      property: "og:type",
      content: og.type || 'website'
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
      property: "og:url",
      content: og.url || url || siteUrl
    }), renderMediaMetaTag('og', 'video', og.video || siteVideo), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
      name: "twitter:card",
      content: twitter.card || 'app'
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
      name: "twitter:creator",
      content: twitter.creator || 'AITmedInc'
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
      name: "twitter:site",
      content: twitter.site || siteName
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
      name: "twitter:title",
      content: twitter.title || title
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("meta", {
      name: "twitter:description",
      content: twitter.description || description
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("link", {
      rel: "canonical",
      href: canonical || siteUrl
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("script", {
      type: "application/ld+json",
      children: `
          {
            "@context": "http://www.schema.org",
            "@type": "Corporation",
            "name": "${siteName}",
            "url": "${siteUrl}",
            "sameAs": [
              "https://www.aitmed.com"
            ],
            "logo": "${siteLogo}",
            "description": "${siteDescription}",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "1000 S ANAHEIM BLVD",
              "addressLocality": "ANAHEIM",
              "addressRegion": "CA",
              "postalCode": "92802",
              "addressCountry": "United States"
            },
           "geo": {
              "@type": "GeoCoordinates",
              "latitude": "33.8207313",
              "longitude": "-117.9108458"
            },
            "hasMap": "https://www.google.com/maps/place/1000+S+Anaheim+Blvd,+Anaheim,+CA+92805/@33.8207313,-117.9108458,17z/data=!3m1!4b1!4m5!3m4!1s0x80dcd7cc94f51025:0x29eea80f7e954c82!8m2!3d33.8207269!4d-117.9086518"
          }
        `
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("script", {
      type: "application/ld+json",
      children: `{
            "@context" : "https://schema.org",
            "@type" : "Organization",
            "name" : "${siteName}",
            "url" : "${siteUrl}",
            "sameAs" : [${_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_1__.values(socialMedia).map(s => `${s}`)}]
          }
        `
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("script", {
      type: "application/ld+json",
      children: `{
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": "What is ${siteName}? Welcome to the only organic Telehealth platform",
            "description": "${siteName} is the most secure, private, and fast Blockchain-based telehealth platform. ${siteName} Telehealth platform is for everyone’s illness and wellness. If you are a provider. Whether solo practice/clinics/nursing home/lab/image center or hospitals. You can immediately enjoy the highest secure, fast virtual medical office for ONE MONTH FREE",
            "thumbnailUrl": "https://public.aitmed.com/cadl/www3.83/assets/backgroundBlack.png",
            "uploadDate": "2020-11-19T00:00:00+00:00",
            "duration": "PT2M27S",
            "contentUrl": "${siteVideo}",
            "embedUrl": "https://www.youtube.com/embed/75IblRuw3ow",
            "interactionCount": "9231"
        }`
    })]
  });
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Seo);

/***/ }),

/***/ "./src/hooks/useActionChain.tsx":
/*!**************************************!*\
  !*** ./src/hooks/useActionChain.tsx ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jsmanifest/utils */ "../../node_modules/@jsmanifest/utils/dist/index.js");
/* harmony import */ var _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var lodash_get__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! lodash/get */ "./node_modules/lodash/get.js");
/* harmony import */ var lodash_get__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(lodash_get__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var lodash_set__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! lodash/set */ "./node_modules/lodash/set.js");
/* harmony import */ var lodash_set__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(lodash_set__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var lodash_partial__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! lodash/partial */ "./node_modules/lodash/partial.js");
/* harmony import */ var lodash_partial__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(lodash_partial__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var gatsby__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! gatsby */ "./.cache/gatsby-browser-entry.js");
/* harmony import */ var noodl_utils__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! noodl-utils */ "./node_modules/noodl-utils/dist/index.js");
/* harmony import */ var noodl_utils__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(noodl_utils__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var noodl_ui__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! noodl-ui */ "./node_modules/noodl-ui/dist/index.js");
/* harmony import */ var noodl_ui__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(noodl_ui__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _utils_is__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @/utils/is */ "./src/utils/is.ts");
/* harmony import */ var _utils_isBuiltInEvalFn__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @/utils/isBuiltInEvalFn */ "./src/utils/isBuiltInEvalFn.ts");
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @/utils/log */ "./src/utils/log.ts");
/* harmony import */ var _hooks_useBuiltInFns__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @/hooks/useBuiltInFns */ "./src/hooks/useBuiltInFns.tsx");
/* harmony import */ var _useCtx__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @/useCtx */ "./src/useCtx.tsx");
/* harmony import */ var _utils_immer__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @/utils/immer */ "./src/utils/immer.ts");
/* harmony import */ var _components_PageContext__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @/components/PageContext */ "./src/components/PageContext.tsx");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../constants */ "./src/constants.ts");

















function useActionChain() {
  const {
    root,
    getR,
    setR
  } = (0,_useCtx__WEBPACK_IMPORTED_MODULE_12__["default"])();
  const pageCtx = (0,_components_PageContext__WEBPACK_IMPORTED_MODULE_14__.usePageCtx)();
  const {
    handleBuiltInFn
  } = (0,_hooks_useBuiltInFns__WEBPACK_IMPORTED_MODULE_11__["default"])();
  const getRootDraftOrRoot = react__WEBPACK_IMPORTED_MODULE_1___default().useCallback(actionChain => {
    var _actionChain$data, _actionChain$data$get;

    return (actionChain === null || actionChain === void 0 ? void 0 : (_actionChain$data = actionChain.data) === null || _actionChain$data === void 0 ? void 0 : (_actionChain$data$get = _actionChain$data.get) === null || _actionChain$data$get === void 0 ? void 0 : _actionChain$data$get.call(_actionChain$data, _constants__WEBPACK_IMPORTED_MODULE_15__.ROOT_DRAFT)) || root;
  }, [root]);

  const executeStr = async (value, args) => {
    try {
      var _value, _value$startsWith;

      let scrollingTo = '';

      if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].reference(value)) {
        value = value === '.WebsitePathSearch' ? // Temp hard code for now
        'https://search.aitmed.com' : (0,noodl_ui__WEBPACK_IMPORTED_MODULE_7__.deref)({
          root: getRootDraftOrRoot(args.actionChain),
          ref: value,
          rootKey: pageCtx.name
        });
      } // These are values coming from an if object evaluation since we are also using this function for if object strings


      if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].isBoolean(value)) return _utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].isBooleanTrue(value);

      if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isObj(value)) {// debugger
      } else if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isStr(value)) {
        if (value.startsWith('^')) {
          // TODO - Handle goto scrolls when navigating to a different page
          scrollingTo = value.substring(1);
          value = value.replace('^', '');
        } else if (pageCtx.isListConsumer(args.component)) {
          const iteratorVar = pageCtx.getIteratorVar(args.component);
          const dataObject = pageCtx.getDataObject(args.component, getRootDraftOrRoot(args.actionChain), pageCtx.name);

          if (iteratorVar && value.startsWith(iteratorVar)) {
            value = lodash_get__WEBPACK_IMPORTED_MODULE_2___default()(dataObject, (0,noodl_utils__WEBPACK_IMPORTED_MODULE_6__.excludeIteratorVar)(value, iteratorVar));
          }
        }
      }

      if (!((_value = value) !== null && _value !== void 0 && (_value$startsWith = _value.startsWith) !== null && _value$startsWith !== void 0 && _value$startsWith.call(_value, 'http')) && (value || scrollingTo)) {
        let scrollingToElem;
        let prevId = '';

        if (scrollingTo) {
          scrollingToElem = document.querySelector(`[data-viewtag=${scrollingTo}]`);

          if (scrollingToElem) {
            prevId = scrollingToElem.id;
            scrollingToElem.id = scrollingTo;
          } else {
            _utils_log__WEBPACK_IMPORTED_MODULE_10__["default"].error(`Tried to find an element of viewTag "${scrollingTo}" but it did not exist`);
          }
        }

        if (scrollingToElem && prevId) {
          scrollingToElem.scrollIntoView({
            behavior: 'smooth',
            inline: 'center'
          });
        } else {
          await (0,gatsby__WEBPACK_IMPORTED_MODULE_5__.navigate)(`/${value}/index.html`);
        }
      } else {
        window.location.href = value;
      } // This can get picked up if evalObject is returning a goto


      return 'abort';
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw err;
    }
  };

  const executeEvalBuiltIn = async (builtInKey, {
    builtInArgs,
    ...args
  }) => {
    try {
      return handleBuiltInFn(builtInKey, { ...args,
        ...builtInArgs
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw err;
    }
  };

  const executeEvalObject = async (value, args) => {
    try {
      const results = [];
      const objs = _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.array(value.object);
      const numObjs = objs.length;

      for (let index = 0; index < numObjs; index++) {
        const object = objs[index];

        if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isObj(object)) {
          const objKeys = _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.keys(object);
          const isSingleProperty = objKeys.length === 1;

          if (isSingleProperty) {
            const property = objKeys[0];
            const propValue = object[property];

            if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].awaitReference(property)) {
              let datapath = (0,noodl_utils__WEBPACK_IMPORTED_MODULE_6__.toDataPath)((0,noodl_utils__WEBPACK_IMPORTED_MODULE_6__.trimReference)(property));
              let datavalue;

              if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].localReference(property)) {
                datapath.unshift(pageCtx.name);
              }

              if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isStr(propValue)) {
                datavalue = _utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].reference(propValue) ? (0,noodl_ui__WEBPACK_IMPORTED_MODULE_7__.deref)({
                  root: getRootDraftOrRoot(args.actionChain),
                  rootKey: pageCtx.name,
                  ref: propValue
                }) : propValue;
              } else {
                datavalue = propValue;
              }

              if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].action.evalObject(datavalue)) {
                const result = await execute({ ...args,
                  action: datavalue
                });

                if (result !== undefined) {
                  lodash_set__WEBPACK_IMPORTED_MODULE_3___default()(getRootDraftOrRoot(args.actionChain), datapath, result);
                }
              } else {
                lodash_set__WEBPACK_IMPORTED_MODULE_3___default()(getRootDraftOrRoot(args.actionChain), datapath, datavalue);
              }

              continue;
            } else {// debugger
            }
          }
        }

        const result = await wrapWithHelpers(args.onExecuteAction)({ ...args,
          action: object
        });
        results.push(result);
      }

      return results;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw err;
    }
  };

  const executeIf = react__WEBPACK_IMPORTED_MODULE_1___default().useCallback(async (ifObject, args) => {
    try {
      let [cond, truthy, falsy] = ifObject.if || [];
      let value;

      if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isStr(cond)) {
        value = await (executeStr === null || executeStr === void 0 ? void 0 : executeStr(cond, { ...args,
          action: cond
        }));
      }

      if ((0,_utils_isBuiltInEvalFn__WEBPACK_IMPORTED_MODULE_9__["default"])(cond)) {
        const key = _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.keys(cond)[0];
        const result = await executeEvalBuiltIn(key, { ...args,
          ...cond[key]
        });
        value = result ? truthy : falsy;
      }

      if (value === 'continue') {
        return value;
      } else if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isStr(value)) {
        if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].reference(value)) {
          value = await (executeStr === null || executeStr === void 0 ? void 0 : executeStr(value, { ...args,
            action: value
          }));
        }
      } else if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isBool(value)) {
        value = value ? truthy : falsy;
      }

      if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isObj(value)) {
        if (args.requiresDynamicHandling(value)) {
          for (const [k, v] of _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.entries(value)) {
            if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].reference(k)) {
              if (k.endsWith('@')) {
                const keyDataPath = (0,noodl_utils__WEBPACK_IMPORTED_MODULE_6__.trimReference)(k);
                const rootDraft = getRootDraftOrRoot(args.actionChain);

                if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].localReference(k)) {
                  lodash_set__WEBPACK_IMPORTED_MODULE_3___default()(rootDraft[pageCtx.name], keyDataPath, v);
                } else {
                  lodash_set__WEBPACK_IMPORTED_MODULE_3___default()(rootDraft, keyDataPath, v);
                }
              }
            }
          }
        } else {
          value = await wrapWithHelpers(args.onExecuteAction)({ ...args,
            action: value
          });
        }
      }

      return value;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw err;
    }
  }, []);
  const createEmit = react__WEBPACK_IMPORTED_MODULE_1___default().useCallback((actionChain, component, trigger, emitObject) => {
    {
      const action = (0,noodl_ui__WEBPACK_IMPORTED_MODULE_7__.createAction)({
        action: emitObject,
        trigger
      });
      const dataObject = pageCtx.getDataObject(component, getRootDraftOrRoot(actionChain), pageCtx.name) || {};

      if (dataObject) {
        if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isStr(action.dataKey)) {
          action.dataKey = dataObject;
        } else if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isObj(action.dataKey)) {
          const iteratorVar = pageCtx.getIteratorVar(component);
          action.dataKey = _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.entries(action.dataKey).reduce((acc, [key, value]) => _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.assign(acc, {
            [key]: iteratorVar ? value === iteratorVar ? dataObject : lodash_get__WEBPACK_IMPORTED_MODULE_2___default()(iteratorVar, `${(0,noodl_utils__WEBPACK_IMPORTED_MODULE_6__.excludeIteratorVar)(value, iteratorVar)}`) : lodash_get__WEBPACK_IMPORTED_MODULE_2___default()(dataObject, value)
          }), {});
        }
        /**
         * Beginning of actionChain.execute()
         */


        action.executor = function (actions = [], dataObject) {
          return async function onExecuteEmitAction(event) {
            let draftedActionObject;
            let results = [];

            try {
              for (const actionObject of actions) {
                draftedActionObject = (0,_utils_immer__WEBPACK_IMPORTED_MODULE_13__.createDraft)(actionObject);
                const result = await execute({
                  action: (0,noodl_ui__WEBPACK_IMPORTED_MODULE_7__.deref)({
                    dataObject,
                    iteratorVar: component === null || component === void 0 ? void 0 : component.iteratorVar,
                    ref: draftedActionObject,
                    root: getRootDraftOrRoot(actionChain),
                    rootKey: pageCtx.name
                  }),
                  actionChain,
                  component,
                  dataObject,
                  trigger
                });
                (0,_utils_immer__WEBPACK_IMPORTED_MODULE_13__.finishDraft)(draftedActionObject);
                draftedActionObject = undefined;

                if (result === 'abort') {
                  results.push('abort');
                  action.abort('Received abort');
                  await actionChain.abort();
                  return 'abort';
                } else results.push(result);
              }

              return results;
            } catch (error) {
              _utils_log__WEBPACK_IMPORTED_MODULE_10__["default"].error(error instanceof Error ? error : new Error(String(error)));
            } finally {
              if (draftedActionObject) (0,_utils_immer__WEBPACK_IMPORTED_MODULE_13__.finishDraft)(draftedActionObject);
            }
          };
        }(emitObject.emit.actions, dataObject);

        return action;
      } else {// TODO
      }
    }
  }, [pageCtx, root]);
  /**
   * Wraps and provides helpers to the execute function as the 2nd argument
   */

  const wrapWithHelpers = react__WEBPACK_IMPORTED_MODULE_1___default().useMemo(() => fn => {
    return async function (args) {
      return fn(args, {
        requiresDynamicHandling: obj => {
          return _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isObj(obj) && [_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].folds.emit, _utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].folds.goto, _utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].folds["if"], _utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].action.any].every(pred => !pred(obj));
        }
      });
    };
  }, []);
  const execute = react__WEBPACK_IMPORTED_MODULE_1___default().useMemo(() => wrapWithHelpers(async function onExecuteAction(options, utils) {
    const {
      action: obj,
      actionChain,
      dataObject
    } = options;
    const args = { ...options,
      ...utils,
      onExecuteAction
    };

    try {
      // TEMP sharing goto destinations and some strings as args
      if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isStr(obj)) {
        return executeStr(obj, args);
      } else if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isObj(obj)) {
        // { goto: "SignIn" }
        if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].goto(obj)) {
          let destination = obj.goto;
          if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isObj(destination)) destination = destination.goto;

          if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isStr(destination)) {
            return executeStr(destination, { ...args,
              action: destination
            });
          } else {
            throw new Error(`Goto destination was not a string`);
          }
        } // { actionType: 'builtIn', funcName: 'redraw' }
        else if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].action.builtIn(obj)) {
          const funcName = obj.funcName;
          _utils_log__WEBPACK_IMPORTED_MODULE_10__["default"].debug(`%c[builtIn] ${funcName}`, 'color:hotpink', obj);
        } // { emit: { dataKey: {...}, actions: [...] } }
        else if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].folds.emit(obj)) {// debugger
        } // { actionType: 'evalObject', object: [...] }
        else if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].action.evalObject(obj)) {
          return executeEvalObject(obj, args);
        } // { if: [...] }
        else if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].folds["if"](obj)) {
          // @ts-expect-error
          return executeIf(obj, args);
        } // { actionType: 'popUp', popUpView: 'myPopUp', wait: true }
        else if ([_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].action.popUp, _utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].action.popUpDismiss].some(fn => fn(obj))) {
          const el = document.querySelector(`[data-viewtag=${obj.popUpView}]`);

          if (el) {
            el.style.visibility = obj.actionType === 'popUpDismiss' ? 'hidden' : 'visible';
          } else {
            _utils_log__WEBPACK_IMPORTED_MODULE_10__["default"].error(`The popUp component with popUpView "${obj.popUpView}" is not in the DOM`, obj);
          } // TODO - See if we need to move this logic elsewhere
          // 'abort' is returned so evalObject can abort if it returns popups


          return 'wait' in obj ? 'abort' : undefined;
        } else {
          let keys = _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.keys(obj);
          let isAwaiting = false;
          let result;
          let args = {
            actionChain,
            dataObject
          };

          if (keys.length === 1) {
            const key = keys[0]; // { "=.builtIn.string.equal": { ...} }

            if ((0,_utils_isBuiltInEvalFn__WEBPACK_IMPORTED_MODULE_9__["default"])(obj)) {
              result = await handleBuiltInFn(key, { ...args,
                ...obj[key]
              });
            } else {
              let awaitKey;
              let isLocal = true;
              let value = obj[key];
              let rootDraft = getRootDraftOrRoot(actionChain);

              if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].reference(key)) {
                isLocal = _utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].localReference(key);
                isAwaiting = _utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].awaitReference(key);
                if (isAwaiting) awaitKey = key;
              }

              if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isStr(value) && _utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].reference(value)) {
                const dataPath = (0,noodl_utils__WEBPACK_IMPORTED_MODULE_6__.toDataPath)((0,noodl_utils__WEBPACK_IMPORTED_MODULE_6__.trimReference)(value));
                if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].localReference(value)) dataPath.unshift(pageCtx.name);
                value = lodash_get__WEBPACK_IMPORTED_MODULE_2___default()(rootDraft, dataPath);
              }

              if (isAwaiting) {
                const path = (0,noodl_utils__WEBPACK_IMPORTED_MODULE_6__.toDataPath)((0,noodl_utils__WEBPACK_IMPORTED_MODULE_6__.trimReference)(key)).filter(Boolean);

                if (isLocal) {
                  if (pageCtx.name && path[0] !== pageCtx.name) {
                    path.unshift(pageCtx.name);
                  }

                  const valueAwaiting = _utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].reference(obj[key]) ? lodash_get__WEBPACK_IMPORTED_MODULE_2___default()(rootDraft, path.join('.')) : obj[key];
                  lodash_set__WEBPACK_IMPORTED_MODULE_3___default()(rootDraft, path, valueAwaiting);
                }
              } else {
                result = value;
              }
            }
          } else {
            _utils_log__WEBPACK_IMPORTED_MODULE_10__["default"].error(`%cAn action in an action chain is not being handled`, `color:#ec0000;`, obj);
          }

          return result;
        }
      }
    } catch (error) {
      _utils_log__WEBPACK_IMPORTED_MODULE_10__["default"].error(error instanceof Error ? error : new Error(String(error)));
    }
  }), [handleBuiltInFn, _utils_isBuiltInEvalFn__WEBPACK_IMPORTED_MODULE_9__["default"], getR, setR, pageCtx, root]);
  const createActionChain = react__WEBPACK_IMPORTED_MODULE_1___default().useCallback((component, trigger, actions) => {
    {
      if (!_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isArr(actions)) actions = [actions];

      const loadActions = (component, actionObjects) => actionObjects.map(obj => {
        if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].folds.emit(obj)) {
          return createEmit(actionChain, component, trigger, obj);
        }

        const nuiAction = (0,noodl_ui__WEBPACK_IMPORTED_MODULE_7__.createAction)({
          action: obj,
          trigger
        });
        nuiAction.executor = execute.bind(null, {
          action: obj,
          actionChain,
          component,
          trigger
        });
        return nuiAction;
      });

      const actionChain = (0,noodl_ui__WEBPACK_IMPORTED_MODULE_7__.createActionChain)(trigger, actions, lodash_partial__WEBPACK_IMPORTED_MODULE_4___default()(loadActions, component));
      actionChain.loadQueue();
      return actionChain;
    }
  }, [pageCtx, root]);
  return {
    createActionChain,
    createEmit,
    execute,
    executeEvalBuiltIn,
    executeEvalObject,
    executeIf,
    executeStr,
    getRootDraftOrRoot
  };
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (useActionChain);

/***/ }),

/***/ "./src/hooks/useBuiltInFns.tsx":
/*!*************************************!*\
  !*** ./src/hooks/useBuiltInFns.tsx ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jsmanifest/utils */ "../../node_modules/@jsmanifest/utils/dist/index.js");
/* harmony import */ var _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var noodl_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! noodl-utils */ "./node_modules/noodl-utils/dist/index.js");
/* harmony import */ var noodl_utils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(noodl_utils__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var noodl_ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! noodl-ui */ "./node_modules/noodl-ui/dist/index.js");
/* harmony import */ var noodl_ui__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(noodl_ui__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var lodash_get__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! lodash/get */ "./node_modules/lodash/get.js");
/* harmony import */ var lodash_get__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(lodash_get__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _useCtx__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @/useCtx */ "./src/useCtx.tsx");
/* harmony import */ var _components_PageContext__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @/components/PageContext */ "./src/components/PageContext.tsx");
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @/utils/log */ "./src/utils/log.ts");
/* harmony import */ var _utils_is__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @/utils/is */ "./src/utils/is.ts");










// Using for TypeScript to pick up the args
const createFn = (options, fn) => opts => fn({ ...opts,
  dataIn: purgeDataIn({ ...options,
    ...opts
  })
});

function purgeDataIn({
  actionChain,
  getR,
  name: pageName,
  dataObject,
  dataIn
}) {
  for (const [key, value] of _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.entries(dataIn)) {
    if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isStr(value)) {
      if (value.startsWith('$')) {
        const paths = value.split('.').slice(1);
        dataIn[key] = lodash_get__WEBPACK_IMPORTED_MODULE_4___default()(dataObject, paths);
      } else if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].reference(value)) {
        var _actionChain$data;

        let paths = [];
        if (_utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].localReference(value)) pageName && paths.push(pageName);
        paths = paths.concat((0,noodl_utils__WEBPACK_IMPORTED_MODULE_1__.trimReference)(value).split('.'));
        dataIn[key] = getR(actionChain === null || actionChain === void 0 ? void 0 : (_actionChain$data = actionChain.data) === null || _actionChain$data === void 0 ? void 0 : _actionChain$data.get('rootDraft'), paths.join('.'), pageName);
      } else {// dataIn[key] = value
      }
    }
  }

  return dataIn;
}

function getBuiltInFns(options) {
  const builtInFns = {
    [`=.builtIn.string.equal`]: ({
      dataIn
    }) => {
      const str1 = String(dataIn === null || dataIn === void 0 ? void 0 : dataIn.string1);
      const str2 = String(dataIn === null || dataIn === void 0 ? void 0 : dataIn.string2);
      const isEqual = str1 === str2;
      _utils_log__WEBPACK_IMPORTED_MODULE_7__["default"].debug(`%c[=.builtIn] Comparing: ${str1 === '' ? "''" : `'${str1}'`} === ${str2 === '' ? "''" : `'${str2}'`}: ${isEqual}`, 'color:rgb(98, 143, 42)');
      return isEqual;
    },
    // Branched from lvl3
    [`=.builtIn.object.setProperty`]: ({
      dataIn
    }) => {
      const arr = _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.array(dataIn.obj).filter(Boolean);
      const numItems = arr.length;

      for (let index = 0; index < numItems; index++) {
        if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isArr(dataIn.arr)) {
          dataIn.arr.forEach((item, i) => {
            var _arr$index;

            if ((arr === null || arr === void 0 ? void 0 : (_arr$index = arr[index]) === null || _arr$index === void 0 ? void 0 : _arr$index[dataIn.label]) === dataIn.text) {
              arr[index][item] = dataIn.valueArr[i];
            } else {
              arr[index][item] = dataIn.errorArr[i];
            }
          });
        } else {
          _utils_log__WEBPACK_IMPORTED_MODULE_7__["default"].error(`Expected 'arr' in dataIn to be an array but it was ${typeof dataIn.arr}`);
        }
      }

      return dataIn;
    },
    ['=.builtIn.object.resolveEmit']: ({
      dataIn: {
        emit: {
          dataKey,
          actions
        },
        trigger
      },
      dataObject,
      iteratorVar = '',
      root = {},
      rootKey = ''
    }) => {
      var _actions$, _actions$$if, _actions$2, _actions$2$if, _actions$3, _actions$3$if, _actions$4, _actions$4$if, _actions$5, _actions$5$if;

      dataKey = (0,noodl_utils__WEBPACK_IMPORTED_MODULE_1__.createEmitDataKey)(dataKey, dataObject, {
        iteratorVar
      });
      const cond = _utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].reference((_actions$ = actions[0]) === null || _actions$ === void 0 ? void 0 : (_actions$$if = _actions$.if) === null || _actions$$if === void 0 ? void 0 : _actions$$if[0]) ? (0,noodl_ui__WEBPACK_IMPORTED_MODULE_2__.deref)({
        dataObject,
        iteratorVar,
        ref: (_actions$2 = actions[0]) === null || _actions$2 === void 0 ? void 0 : (_actions$2$if = _actions$2.if) === null || _actions$2$if === void 0 ? void 0 : _actions$2$if[0],
        root,
        rootKey
      }) : (_actions$3 = actions[0]) === null || _actions$3 === void 0 ? void 0 : (_actions$3$if = _actions$3.if) === null || _actions$3$if === void 0 ? void 0 : _actions$3$if[0];
      const result = cond ? (_actions$4 = actions[0]) === null || _actions$4 === void 0 ? void 0 : (_actions$4$if = _actions$4.if) === null || _actions$4$if === void 0 ? void 0 : _actions$4$if[1] : (_actions$5 = actions[0]) === null || _actions$5 === void 0 ? void 0 : (_actions$5$if = _actions$5.if) === null || _actions$5$if === void 0 ? void 0 : _actions$5$if[2];
      return _utils_is__WEBPACK_IMPORTED_MODULE_8__["default"].reference(result) ? (0,noodl_ui__WEBPACK_IMPORTED_MODULE_2__.deref)({
        dataObject,
        iteratorVar,
        ref: result,
        root,
        rootKey
      }) : result;
    }
  };
  return _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.entries(builtInFns).reduce((acc, [builtInFnName, builtInFn]) => {
    acc[builtInFnName] = createFn(options, builtInFn);
    return acc;
  }, {});
}

function useBuiltInFns() {
  const ctx = (0,_useCtx__WEBPACK_IMPORTED_MODULE_5__["default"])();
  const pageCtx = (0,_components_PageContext__WEBPACK_IMPORTED_MODULE_6__.usePageCtx)();
  const builtIns = getBuiltInFns({ ...ctx,
    ...pageCtx
  });
  const handleBuiltInFn = react__WEBPACK_IMPORTED_MODULE_3___default().useCallback((key = '', args) => {
    const fn = builtIns[key];

    if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isFnc(fn)) {
      return fn(args);
    } else {
      _utils_log__WEBPACK_IMPORTED_MODULE_7__["default"].error(`%cYou are missing the builtIn implementation for "${key}"`, `color:#ec0000;`);
    }
  }, [ctx, pageCtx]);
  return {
    builtIns,
    handleBuiltInFn
  };
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (useBuiltInFns);

/***/ }),

/***/ "./src/hooks/useContextLists.tsx":
/*!***************************************!*\
  !*** ./src/hooks/useContextLists.tsx ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jsmanifest/utils */ "../../node_modules/@jsmanifest/utils/dist/index.js");
/* harmony import */ var _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils_is__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/utils/is */ "./src/utils/is.ts");
/* harmony import */ var noodl_ui__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! noodl-ui */ "./node_modules/noodl-ui/dist/index.js");
/* harmony import */ var noodl_ui__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(noodl_ui__WEBPACK_IMPORTED_MODULE_3__);





function useContextLists(listsMap) {
  const lists = react__WEBPACK_IMPORTED_MODULE_0___default().useMemo(() => Object.values(listsMap || {}), [listsMap]);
  const getId = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(id => {
    return _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_1__.isStr(id) ? id : (id === null || id === void 0 ? void 0 : id.id) || '';
  }, []);
  const getIteratorVar = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(id => {
    var _lists$find;

    if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_1__.isObj(id) && _utils_is__WEBPACK_IMPORTED_MODULE_2__["default"].component.list(id)) return id.iteratorVar;
    id = getId(id);
    return ((_lists$find = lists.find(obj => isCtxObj(obj, id))) === null || _lists$find === void 0 ? void 0 : _lists$find.iteratorVar) || '';
  }, [getId, lists]);
  const getCtxObject = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(id => {
    id = getId(id);
    return id ? lists.find(obj => isCtxObj(obj, id)) : null;
  }, [getId, lists]);
  const getListObject = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback((id, root, pageName) => {
    let ctxObj = getCtxObject(id);
    let listObject = (ctxObj === null || ctxObj === void 0 ? void 0 : ctxObj.listObject) || null;

    if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_1__.isStr(listObject)) {
      if (_utils_is__WEBPACK_IMPORTED_MODULE_2__["default"].reference(listObject)) {
        listObject = (0,noodl_ui__WEBPACK_IMPORTED_MODULE_3__.deref)({
          root,
          ref: listObject,
          rootKey: _utils_is__WEBPACK_IMPORTED_MODULE_2__["default"].localReference(listObject) ? pageName : ''
        });
      }
    }

    return listObject;
  }, [getCtxObject, lists]);
  const getDataObject = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback((id, root, pageName) => {
    var _listObj$children;

    id = getId(id);
    const listObj = getCtxObject(id);
    const listObject = getListObject(id, root, pageName);
    const index = listObj === null || listObj === void 0 ? void 0 : (_listObj$children = listObj.children) === null || _listObj$children === void 0 ? void 0 : _listObj$children.findIndex(ids => ids.includes(id));
    if (listObject) return listObject[index];
    return null;
  }, [getId, getCtxObject, getListObject]);
  const isCtxObj = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback((obj, id) => {
    id = getId(id);
    return !!id && (obj.id === id || _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_1__.array(obj.children).some(ids => ids.includes(id)));
  }, [getId]);
  const isListConsumer = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(id => lists.some(obj => isCtxObj(obj, getId(id))), [getId, lists, isCtxObj]);
  return {
    lists,
    getId,
    getCtxObject,
    getListObject,
    getDataObject,
    getIteratorVar,
    isCtxObj,
    isListConsumer
  };
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (useContextLists);

/***/ }),

/***/ "./src/hooks/usePage.tsx":
/*!*******************************!*\
  !*** ./src/hooks/usePage.tsx ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jsmanifest/utils */ "../../node_modules/@jsmanifest/utils/dist/index.js");
/* harmony import */ var _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _useRenderer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./useRenderer */ "./src/hooks/useRenderer.tsx");
/* harmony import */ var _emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @emotion/react/jsx-runtime */ "./node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.esm.js");





function usePage({
  pageContext
}) {
  const renderer = (0,_useRenderer__WEBPACK_IMPORTED_MODULE_2__["default"])();

  const render = (c, index) => {
    return (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)((react__WEBPACK_IMPORTED_MODULE_1___default().Fragment), {
      children: renderer(c, [(pageContext === null || pageContext === void 0 ? void 0 : pageContext.name) || 'HomePage', 'components', index])
    }, _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isStr(c) ? c : (c === null || c === void 0 ? void 0 : c.id) || (c === null || c === void 0 ? void 0 : c.dataKey) || index);
  };

  return {
    components: (pageContext === null || pageContext === void 0 ? void 0 : pageContext.components) || [],
    render
  };
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (usePage);

/***/ }),

/***/ "./src/hooks/useRenderer.tsx":
/*!***********************************!*\
  !*** ./src/hooks/useRenderer.tsx ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "noodlKeysToStrip": () => (/* binding */ noodlKeysToStrip)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var immer__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! immer */ "./node_modules/immer/dist/immer.esm.js");
/* harmony import */ var noodl_types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! noodl-types */ "./node_modules/noodl-types/dist/index.js");
/* harmony import */ var noodl_types__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(noodl_types__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var noodl_ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! noodl-ui */ "./node_modules/noodl-ui/dist/index.js");
/* harmony import */ var noodl_ui__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(noodl_ui__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var noodl_utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! noodl-utils */ "./node_modules/noodl-utils/dist/index.js");
/* harmony import */ var noodl_utils__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(noodl_utils__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var lodash_get__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! lodash/get */ "./node_modules/lodash/get.js");
/* harmony import */ var lodash_get__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(lodash_get__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @jsmanifest/utils */ "../../node_modules/@jsmanifest/utils/dist/index.js");
/* harmony import */ var _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _hooks_useActionChain__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @/hooks/useActionChain */ "./src/hooks/useActionChain.tsx");
/* harmony import */ var _hooks_useBuiltInFns__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @/hooks/useBuiltInFns */ "./src/hooks/useBuiltInFns.tsx");
/* harmony import */ var _utils_getTagName__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @/utils/getTagName */ "./src/utils/getTagName.ts");
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @/utils/log */ "./src/utils/log.ts");
/* harmony import */ var _utils_is__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @/utils/is */ "./src/utils/is.ts");
/* harmony import */ var _useCtx__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @/useCtx */ "./src/useCtx.tsx");
/* harmony import */ var _utils_immer__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @/utils/immer */ "./src/utils/immer.ts");
/* harmony import */ var _components_PageContext__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @/components/PageContext */ "./src/components/PageContext.tsx");
/* harmony import */ var _emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @emotion/react/jsx-runtime */ "./node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.esm.js");












 // import deref from '@/utils/deref'




// TODO - Find out a better way to do this
const noodlKeysToStrip = ['contentType', 'image', 'iteratorVar', 'itemObject', 'listObject', 'parentId', 'popUpView', 'textBoard', 'type', 'viewTag', 'videoFormat'];
const keysToStrip = noodlKeysToStrip.concat('index');
const keysToStripRegex = new RegExp(`(${keysToStrip.join('|')})`, 'i');

function useRenderer() {
  // Used to prevent infinite loops when dereferencing references
  const refsRef = react__WEBPACK_IMPORTED_MODULE_0___default().useRef({});
  const {
    getR,
    root,
    setR
  } = (0,_useCtx__WEBPACK_IMPORTED_MODULE_11__["default"])();
  const {
    createActionChain
  } = (0,_hooks_useActionChain__WEBPACK_IMPORTED_MODULE_6__["default"])();
  const builtInFns = (0,_hooks_useBuiltInFns__WEBPACK_IMPORTED_MODULE_7__["default"])();
  const {
    assetsUrl,
    getDataObject,
    getIteratorVar,
    isListConsumer,
    name
  } = (0,_components_PageContext__WEBPACK_IMPORTED_MODULE_13__.usePageCtx)();
  const render = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback((component, componentPath) => {
    if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.isStr(component)) {
      if (_utils_is__WEBPACK_IMPORTED_MODULE_10__["default"].reference(component)) {
        if (refsRef.current !== component) {
          refsRef.current = component;
          return render((0,noodl_ui__WEBPACK_IMPORTED_MODULE_2__.deref)({
            ref: component,
            rootKey: name,
            root
          }), componentPath);
        }
      }

      return {
        type: 'div',
        children: component
      };
    }

    if (_utils_is__WEBPACK_IMPORTED_MODULE_10__["default"].componentByReference(component)) {
      return render(_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.keys(component)[0], componentPath);
    }

    if (!_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.isObj(component)) return null;
    let {
      dataKey,
      id,
      type
    } = component;
    let children = [];
    let iteratorVar = getIteratorVar === null || getIteratorVar === void 0 ? void 0 : getIteratorVar(component);
    let elementType = (0,_utils_getTagName__WEBPACK_IMPORTED_MODULE_8__["default"])(type) || 'div';
    id = id || dataKey;
    let props = {
      type: elementType,
      key: id
    };

    for (let [key, value] of _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.entries(component)) {
      if (key.startsWith('data-')) props[key] = value;

      if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.isStr(value)) {
        if (_utils_is__WEBPACK_IMPORTED_MODULE_10__["default"].reference(value)) {
          if (key === 'dataKey') {
            value = (0,noodl_utils__WEBPACK_IMPORTED_MODULE_3__.trimReference)(value);
          } else {
            props[key] = (0,noodl_ui__WEBPACK_IMPORTED_MODULE_2__.deref)({
              ref: value,
              root,
              rootKey: name
            });
            value = props[key];
          }
        }
      }

      if (key === 'children') {
        _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.array(value).forEach((child, index) => children.push(render(child, componentPath.concat('children', index))));
      } else if (/popUpView\/viewTag/.test(key)) {
        props['data-viewtag'] = value;
      } else if (key === 'data-value') {
        if (component['data-value']) {
          children.push(render(String(component['data-value']), componentPath));
        } else {
          value && children.push(render(value, componentPath));
        }
      } else if (key === 'data-src' || key === 'path' && /(image|video)/i.test(type)) {
        if (isListConsumer(component)) {
          const dataObject = (0,noodl_ui__WEBPACK_IMPORTED_MODULE_2__.deref)({
            ref: getDataObject(component.id, root, name),
            root,
            rootKey: name,
            iteratorVar
          });
          props.src = _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.isStr(component.path) && component.path.startsWith(iteratorVar) ? lodash_get__WEBPACK_IMPORTED_MODULE_4___default()(dataObject, (0,noodl_utils__WEBPACK_IMPORTED_MODULE_3__.excludeIteratorVar)(component.path, iteratorVar)) : _utils_is__WEBPACK_IMPORTED_MODULE_10__["default"].folds.emit(component.path) ? builtInFns.builtIns['=.builtIn.object.resolveEmit']({
            dataIn: {
              emit: component.path.emit,
              trigger: 'path'
            },
            dataObject,
            iteratorVar,
            root,
            rootKey: name
          }) : value;
          props['data-src'] = props.src;

          if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.isObj(component.path)) {
            console.log({
              dataObject,
              component,
              props,
              src: props.src
            }); // debugger
          }
        } else {
          props.src = value;
        }
      } else if (key === 'style') {
        if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.isObj(value)) {
          if (!props.style) props.style = {};

          for (let [styleKey, styleValue] of _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.entries(value)) {
            if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.isStr(styleKey) && styleKey.includes('-')) {
              props.style[_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.camelCase(styleKey)] = styleValue;
            } else {
              props.style[styleKey] = styleValue;
            }
          }
        } else {
          _utils_log__WEBPACK_IMPORTED_MODULE_9__["default"].error(`%cA value for style was received but it was not an object`, `color:#ec0000;`, component);
          props.style = {};
        }
      } else if (key === 'text' && !component['data-value']) {
        value && children.push(_utils_is__WEBPACK_IMPORTED_MODULE_10__["default"].reference(value) ? getR(value, name) : value);
      } else if (noodl_ui__WEBPACK_IMPORTED_MODULE_2__.triggers.includes(key)) {
        if (noodl_types__WEBPACK_IMPORTED_MODULE_1__.userEvent.includes(key)) {
          const obj = value;
          const actions = (obj === null || obj === void 0 ? void 0 : obj.actions) || [];
          const trigger = key;
          const actionChain = createActionChain === null || createActionChain === void 0 ? void 0 : createActionChain(component, trigger, actions);

          props[trigger] = async function onExecuteActionChain(evt) {
            let results;
            let nextRoot = await (0,immer__WEBPACK_IMPORTED_MODULE_14__["default"])(root, async draft => {
              try {
                actionChain === null || actionChain === void 0 ? void 0 : actionChain.data.set('rootDraft', draft);
                results = await (actionChain === null || actionChain === void 0 ? void 0 : actionChain.execute(evt));
              } catch (error) {
                _utils_log__WEBPACK_IMPORTED_MODULE_9__["default"].error(error instanceof Error ? error : new Error(String(error)));
              }
            });
            actionChain === null || actionChain === void 0 ? void 0 : actionChain.data.delete('rootDraft');
            setR((0,_utils_immer__WEBPACK_IMPORTED_MODULE_12__.getCurrent)(nextRoot));
            return results;
          };
        }
      } else {
        if (!keysToStripRegex.test(key)) props[key] = value;
      }

      if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.isStr(value)) {
        if (_utils_is__WEBPACK_IMPORTED_MODULE_10__["default"].reference(value)) {
          props[key] = (0,noodl_ui__WEBPACK_IMPORTED_MODULE_2__.deref)({
            ref: value,
            root,
            rootKey: name
          });
        } else if (key !== 'data-key' && iteratorVar && value.startsWith(iteratorVar) && key !== '_path_' && key !== 'iteratorVar') {
          props[key] = value;
        }
      }
    }

    if (children.length) props.children = children;

    if (props._path_) {
      if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.isStr(props._path_) && iteratorVar) {
        if (props.type === 'img') {
          const dataObject = getDataObject(props.id, root, name);

          if (!dataObject) {// debugger
          } else {
            const datapath = (0,noodl_utils__WEBPACK_IMPORTED_MODULE_3__.excludeIteratorVar)(props._path_, iteratorVar);
            const src = lodash_get__WEBPACK_IMPORTED_MODULE_4___default()(dataObject, datapath);
            if (src) props.src = (0,noodl_ui__WEBPACK_IMPORTED_MODULE_2__.resolveAssetUrl)(src, assetsUrl);
          }
        }
      } else if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.isObj(props._path_)) {
        if (_utils_is__WEBPACK_IMPORTED_MODULE_10__["default"].folds.emit(props._path_)) {
          const dataObject = getDataObject(component.id, root, name);
          const emitObject = (0,noodl_ui__WEBPACK_IMPORTED_MODULE_2__.deref)({
            dataObject,
            iteratorVar,
            ref: props._path_,
            root,
            rootKey: name
          });
          let result = builtInFns.builtIns['=.builtIn.object.resolveEmit']({
            dataIn: { ...emitObject,
              trigger: 'path'
            },
            dataObject,
            root,
            rootKey: name
          });

          if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.isStr(result) && result.startsWith('$')) {
            result = result.replace('$var.', '');
            result = lodash_get__WEBPACK_IMPORTED_MODULE_4___default()(dataObject, result, '');
          }

          if (result != undefined) {
            props.src = (0,noodl_ui__WEBPACK_IMPORTED_MODULE_2__.resolveAssetUrl)(result, assetsUrl);
          }
        }
      }
    }

    return renderElement({
      children,
      componentPath,
      ...props
    });
  }, [assetsUrl, getDataObject, root]);
  const renderElement = react__WEBPACK_IMPORTED_MODULE_0___default().useCallback(({
    componentPath,
    type,
    key,
    children = [],
    ...rest
  }) => {
    let _children = [];
    let _index = 0;
    _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.array(children).forEach(cprops => {
      const _path = (componentPath || []).concat('children', _index);

      const renderKey = _path.join('.');

      if (_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_5__.isObj(cprops)) {
        const props = { ...cprops,
          componentPath: _path
        };

        _children.push((0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), {
          children: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().isValidElement(props) ? props : renderElement(props)
        }, renderKey));
      } else {
        _children.push((0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_15__.jsx)((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), {
          children: cprops
        }, renderKey));
      }

      _index++;
    });
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(type, rest, /img|input|textarea/.test(type) ? undefined : _children.length ? _children : undefined);
  }, [render, root]);
  return render;
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (useRenderer);

/***/ }),

/***/ "./src/templates/page.tsx":
/*!********************************!*\
  !*** ./src/templates/page.tsx ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _components_Seo__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/components/Seo */ "./src/components/Seo.tsx");
/* harmony import */ var _components_PageContext__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/components/PageContext */ "./src/components/PageContext.tsx");
/* harmony import */ var _hooks_usePage__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/hooks/usePage */ "./src/hooks/usePage.tsx");
/* harmony import */ var _emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @emotion/react/jsx-runtime */ "./node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.esm.js");








function NoodlPageTemplate(props) {
  const page = (0,_hooks_usePage__WEBPACK_IMPORTED_MODULE_3__["default"])(props);
  react__WEBPACK_IMPORTED_MODULE_0___default().useEffect(() => {
    console.log(props);
  }, []);
  return (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
    children: page.components.map(page.render)
  });
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (props => (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
  children: [(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_components_Seo__WEBPACK_IMPORTED_MODULE_1__["default"], {}), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_components_PageContext__WEBPACK_IMPORTED_MODULE_2__["default"], { ...props.pageContext,
    children: (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(NoodlPageTemplate, { ...props
    })
  })]
}));

/***/ }),

/***/ "./src/utils/getTagName.ts":
/*!*********************************!*\
  !*** ./src/utils/getTagName.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function getTagName(type) {
  return {
    span: 'span',
    br: 'br',
    button: 'button',
    canvas: 'canvas',
    chart: 'div',
    date: 'input',
    dateSelect: 'input',
    divider: 'hr',
    ecosDoc: 'div',
    footer: 'div',
    header: 'div',
    searchBar: 'input',
    textField: 'input',
    image: 'img',
    label: 'div',
    list: 'ul',
    listItem: 'li',
    map: 'div',
    page: 'iframe',
    popUp: 'div',
    plugin: 'div',
    pluginHead: 'script',
    pluginBodyTail: 'script',
    register: 'div',
    scrollView: 'div',
    select: 'select',
    textView: 'textarea',
    video: 'video',
    view: 'div'
  }[type];
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getTagName);

/***/ }),

/***/ "./src/utils/isBuiltInEvalFn.ts":
/*!**************************************!*\
  !*** ./src/utils/isBuiltInEvalFn.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ isBuiltInEvalFn)
/* harmony export */ });
function isBuiltInEvalFn(value) {
  for (const key of Object.keys(value)) {
    if (key.startsWith('=.builtIn')) return true;
  }

  return false;
}

/***/ }),

/***/ "./node_modules/lodash/_LazyWrapper.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_LazyWrapper.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseCreate = __webpack_require__(/*! ./_baseCreate */ "./node_modules/lodash/_baseCreate.js"),
    baseLodash = __webpack_require__(/*! ./_baseLodash */ "./node_modules/lodash/_baseLodash.js");

/** Used as references for the maximum length and index of an array. */
var MAX_ARRAY_LENGTH = 4294967295;

/**
 * Creates a lazy wrapper object which wraps `value` to enable lazy evaluation.
 *
 * @private
 * @constructor
 * @param {*} value The value to wrap.
 */
function LazyWrapper(value) {
  this.__wrapped__ = value;
  this.__actions__ = [];
  this.__dir__ = 1;
  this.__filtered__ = false;
  this.__iteratees__ = [];
  this.__takeCount__ = MAX_ARRAY_LENGTH;
  this.__views__ = [];
}

// Ensure `LazyWrapper` is an instance of `baseLodash`.
LazyWrapper.prototype = baseCreate(baseLodash.prototype);
LazyWrapper.prototype.constructor = LazyWrapper;

module.exports = LazyWrapper;


/***/ }),

/***/ "./node_modules/lodash/_LodashWrapper.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash/_LodashWrapper.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseCreate = __webpack_require__(/*! ./_baseCreate */ "./node_modules/lodash/_baseCreate.js"),
    baseLodash = __webpack_require__(/*! ./_baseLodash */ "./node_modules/lodash/_baseLodash.js");

/**
 * The base constructor for creating `lodash` wrapper objects.
 *
 * @private
 * @param {*} value The value to wrap.
 * @param {boolean} [chainAll] Enable explicit method chain sequences.
 */
function LodashWrapper(value, chainAll) {
  this.__wrapped__ = value;
  this.__actions__ = [];
  this.__chain__ = !!chainAll;
  this.__index__ = 0;
  this.__values__ = undefined;
}

LodashWrapper.prototype = baseCreate(baseLodash.prototype);
LodashWrapper.prototype.constructor = LodashWrapper;

module.exports = LodashWrapper;


/***/ }),

/***/ "./node_modules/lodash/_WeakMap.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_WeakMap.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getNative = __webpack_require__(/*! ./_getNative */ "./node_modules/lodash/_getNative.js"),
    root = __webpack_require__(/*! ./_root */ "./node_modules/lodash/_root.js");

/* Built-in method references that are verified to be native. */
var WeakMap = getNative(root, 'WeakMap');

module.exports = WeakMap;


/***/ }),

/***/ "./node_modules/lodash/_arrayEach.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_arrayEach.js ***!
  \*******************************************/
/***/ ((module) => {

/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;


/***/ }),

/***/ "./node_modules/lodash/_arrayIncludes.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash/_arrayIncludes.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseIndexOf = __webpack_require__(/*! ./_baseIndexOf */ "./node_modules/lodash/_baseIndexOf.js");

/**
 * A specialized version of `_.includes` for arrays without support for
 * specifying an index to search from.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludes(array, value) {
  var length = array == null ? 0 : array.length;
  return !!length && baseIndexOf(array, value, 0) > -1;
}

module.exports = arrayIncludes;


/***/ }),

/***/ "./node_modules/lodash/_baseFindIndex.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash/_baseFindIndex.js ***!
  \***********************************************/
/***/ ((module) => {

/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

module.exports = baseFindIndex;


/***/ }),

/***/ "./node_modules/lodash/_baseIndexOf.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_baseIndexOf.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseFindIndex = __webpack_require__(/*! ./_baseFindIndex */ "./node_modules/lodash/_baseFindIndex.js"),
    baseIsNaN = __webpack_require__(/*! ./_baseIsNaN */ "./node_modules/lodash/_baseIsNaN.js"),
    strictIndexOf = __webpack_require__(/*! ./_strictIndexOf */ "./node_modules/lodash/_strictIndexOf.js");

/**
 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  return value === value
    ? strictIndexOf(array, value, fromIndex)
    : baseFindIndex(array, baseIsNaN, fromIndex);
}

module.exports = baseIndexOf;


/***/ }),

/***/ "./node_modules/lodash/_baseIsNaN.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_baseIsNaN.js ***!
  \*******************************************/
/***/ ((module) => {

/**
 * The base implementation of `_.isNaN` without support for number objects.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 */
function baseIsNaN(value) {
  return value !== value;
}

module.exports = baseIsNaN;


/***/ }),

/***/ "./node_modules/lodash/_baseLodash.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_baseLodash.js ***!
  \********************************************/
/***/ ((module) => {

/**
 * The function whose prototype chain sequence wrappers inherit from.
 *
 * @private
 */
function baseLodash() {
  // No operation performed.
}

module.exports = baseLodash;


/***/ }),

/***/ "./node_modules/lodash/_baseSet.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_baseSet.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var assignValue = __webpack_require__(/*! ./_assignValue */ "./node_modules/lodash/_assignValue.js"),
    castPath = __webpack_require__(/*! ./_castPath */ "./node_modules/lodash/_castPath.js"),
    isIndex = __webpack_require__(/*! ./_isIndex */ "./node_modules/lodash/_isIndex.js"),
    isObject = __webpack_require__(/*! ./isObject */ "./node_modules/lodash/isObject.js"),
    toKey = __webpack_require__(/*! ./_toKey */ "./node_modules/lodash/_toKey.js");

/**
 * The base implementation of `_.set`.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {*} value The value to set.
 * @param {Function} [customizer] The function to customize path creation.
 * @returns {Object} Returns `object`.
 */
function baseSet(object, path, value, customizer) {
  if (!isObject(object)) {
    return object;
  }
  path = castPath(path, object);

  var index = -1,
      length = path.length,
      lastIndex = length - 1,
      nested = object;

  while (nested != null && ++index < length) {
    var key = toKey(path[index]),
        newValue = value;

    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return object;
    }

    if (index != lastIndex) {
      var objValue = nested[key];
      newValue = customizer ? customizer(objValue, key, nested) : undefined;
      if (newValue === undefined) {
        newValue = isObject(objValue)
          ? objValue
          : (isIndex(path[index + 1]) ? [] : {});
      }
    }
    assignValue(nested, key, newValue);
    nested = nested[key];
  }
  return object;
}

module.exports = baseSet;


/***/ }),

/***/ "./node_modules/lodash/_baseSetData.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_baseSetData.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var identity = __webpack_require__(/*! ./identity */ "./node_modules/lodash/identity.js"),
    metaMap = __webpack_require__(/*! ./_metaMap */ "./node_modules/lodash/_metaMap.js");

/**
 * The base implementation of `setData` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to associate metadata with.
 * @param {*} data The metadata.
 * @returns {Function} Returns `func`.
 */
var baseSetData = !metaMap ? identity : function(func, data) {
  metaMap.set(func, data);
  return func;
};

module.exports = baseSetData;


/***/ }),

/***/ "./node_modules/lodash/_baseTrim.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/_baseTrim.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var trimmedEndIndex = __webpack_require__(/*! ./_trimmedEndIndex */ "./node_modules/lodash/_trimmedEndIndex.js");

/** Used to match leading whitespace. */
var reTrimStart = /^\s+/;

/**
 * The base implementation of `_.trim`.
 *
 * @private
 * @param {string} string The string to trim.
 * @returns {string} Returns the trimmed string.
 */
function baseTrim(string) {
  return string
    ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, '')
    : string;
}

module.exports = baseTrim;


/***/ }),

/***/ "./node_modules/lodash/_composeArgs.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_composeArgs.js ***!
  \*********************************************/
/***/ ((module) => {

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates an array that is the composition of partially applied arguments,
 * placeholders, and provided arguments into a single array of arguments.
 *
 * @private
 * @param {Array} args The provided arguments.
 * @param {Array} partials The arguments to prepend to those provided.
 * @param {Array} holders The `partials` placeholder indexes.
 * @params {boolean} [isCurried] Specify composing for a curried function.
 * @returns {Array} Returns the new array of composed arguments.
 */
function composeArgs(args, partials, holders, isCurried) {
  var argsIndex = -1,
      argsLength = args.length,
      holdersLength = holders.length,
      leftIndex = -1,
      leftLength = partials.length,
      rangeLength = nativeMax(argsLength - holdersLength, 0),
      result = Array(leftLength + rangeLength),
      isUncurried = !isCurried;

  while (++leftIndex < leftLength) {
    result[leftIndex] = partials[leftIndex];
  }
  while (++argsIndex < holdersLength) {
    if (isUncurried || argsIndex < argsLength) {
      result[holders[argsIndex]] = args[argsIndex];
    }
  }
  while (rangeLength--) {
    result[leftIndex++] = args[argsIndex++];
  }
  return result;
}

module.exports = composeArgs;


/***/ }),

/***/ "./node_modules/lodash/_composeArgsRight.js":
/*!**************************************************!*\
  !*** ./node_modules/lodash/_composeArgsRight.js ***!
  \**************************************************/
/***/ ((module) => {

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * This function is like `composeArgs` except that the arguments composition
 * is tailored for `_.partialRight`.
 *
 * @private
 * @param {Array} args The provided arguments.
 * @param {Array} partials The arguments to append to those provided.
 * @param {Array} holders The `partials` placeholder indexes.
 * @params {boolean} [isCurried] Specify composing for a curried function.
 * @returns {Array} Returns the new array of composed arguments.
 */
function composeArgsRight(args, partials, holders, isCurried) {
  var argsIndex = -1,
      argsLength = args.length,
      holdersIndex = -1,
      holdersLength = holders.length,
      rightIndex = -1,
      rightLength = partials.length,
      rangeLength = nativeMax(argsLength - holdersLength, 0),
      result = Array(rangeLength + rightLength),
      isUncurried = !isCurried;

  while (++argsIndex < rangeLength) {
    result[argsIndex] = args[argsIndex];
  }
  var offset = argsIndex;
  while (++rightIndex < rightLength) {
    result[offset + rightIndex] = partials[rightIndex];
  }
  while (++holdersIndex < holdersLength) {
    if (isUncurried || argsIndex < argsLength) {
      result[offset + holders[holdersIndex]] = args[argsIndex++];
    }
  }
  return result;
}

module.exports = composeArgsRight;


/***/ }),

/***/ "./node_modules/lodash/_countHolders.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_countHolders.js ***!
  \**********************************************/
/***/ ((module) => {

/**
 * Gets the number of `placeholder` occurrences in `array`.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} placeholder The placeholder to search for.
 * @returns {number} Returns the placeholder count.
 */
function countHolders(array, placeholder) {
  var length = array.length,
      result = 0;

  while (length--) {
    if (array[length] === placeholder) {
      ++result;
    }
  }
  return result;
}

module.exports = countHolders;


/***/ }),

/***/ "./node_modules/lodash/_createBind.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_createBind.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var createCtor = __webpack_require__(/*! ./_createCtor */ "./node_modules/lodash/_createCtor.js"),
    root = __webpack_require__(/*! ./_root */ "./node_modules/lodash/_root.js");

/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1;

/**
 * Creates a function that wraps `func` to invoke it with the optional `this`
 * binding of `thisArg`.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createBind(func, bitmask, thisArg) {
  var isBind = bitmask & WRAP_BIND_FLAG,
      Ctor = createCtor(func);

  function wrapper() {
    var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
    return fn.apply(isBind ? thisArg : this, arguments);
  }
  return wrapper;
}

module.exports = createBind;


/***/ }),

/***/ "./node_modules/lodash/_createCtor.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_createCtor.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseCreate = __webpack_require__(/*! ./_baseCreate */ "./node_modules/lodash/_baseCreate.js"),
    isObject = __webpack_require__(/*! ./isObject */ "./node_modules/lodash/isObject.js");

/**
 * Creates a function that produces an instance of `Ctor` regardless of
 * whether it was invoked as part of a `new` expression or by `call` or `apply`.
 *
 * @private
 * @param {Function} Ctor The constructor to wrap.
 * @returns {Function} Returns the new wrapped function.
 */
function createCtor(Ctor) {
  return function() {
    // Use a `switch` statement to work with class constructors. See
    // http://ecma-international.org/ecma-262/7.0/#sec-ecmascript-function-objects-call-thisargument-argumentslist
    // for more details.
    var args = arguments;
    switch (args.length) {
      case 0: return new Ctor;
      case 1: return new Ctor(args[0]);
      case 2: return new Ctor(args[0], args[1]);
      case 3: return new Ctor(args[0], args[1], args[2]);
      case 4: return new Ctor(args[0], args[1], args[2], args[3]);
      case 5: return new Ctor(args[0], args[1], args[2], args[3], args[4]);
      case 6: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
      case 7: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
    }
    var thisBinding = baseCreate(Ctor.prototype),
        result = Ctor.apply(thisBinding, args);

    // Mimic the constructor's `return` behavior.
    // See https://es5.github.io/#x13.2.2 for more details.
    return isObject(result) ? result : thisBinding;
  };
}

module.exports = createCtor;


/***/ }),

/***/ "./node_modules/lodash/_createCurry.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_createCurry.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var apply = __webpack_require__(/*! ./_apply */ "./node_modules/lodash/_apply.js"),
    createCtor = __webpack_require__(/*! ./_createCtor */ "./node_modules/lodash/_createCtor.js"),
    createHybrid = __webpack_require__(/*! ./_createHybrid */ "./node_modules/lodash/_createHybrid.js"),
    createRecurry = __webpack_require__(/*! ./_createRecurry */ "./node_modules/lodash/_createRecurry.js"),
    getHolder = __webpack_require__(/*! ./_getHolder */ "./node_modules/lodash/_getHolder.js"),
    replaceHolders = __webpack_require__(/*! ./_replaceHolders */ "./node_modules/lodash/_replaceHolders.js"),
    root = __webpack_require__(/*! ./_root */ "./node_modules/lodash/_root.js");

/**
 * Creates a function that wraps `func` to enable currying.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {number} arity The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createCurry(func, bitmask, arity) {
  var Ctor = createCtor(func);

  function wrapper() {
    var length = arguments.length,
        args = Array(length),
        index = length,
        placeholder = getHolder(wrapper);

    while (index--) {
      args[index] = arguments[index];
    }
    var holders = (length < 3 && args[0] !== placeholder && args[length - 1] !== placeholder)
      ? []
      : replaceHolders(args, placeholder);

    length -= holders.length;
    if (length < arity) {
      return createRecurry(
        func, bitmask, createHybrid, wrapper.placeholder, undefined,
        args, holders, undefined, undefined, arity - length);
    }
    var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
    return apply(fn, this, args);
  }
  return wrapper;
}

module.exports = createCurry;


/***/ }),

/***/ "./node_modules/lodash/_createHybrid.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_createHybrid.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var composeArgs = __webpack_require__(/*! ./_composeArgs */ "./node_modules/lodash/_composeArgs.js"),
    composeArgsRight = __webpack_require__(/*! ./_composeArgsRight */ "./node_modules/lodash/_composeArgsRight.js"),
    countHolders = __webpack_require__(/*! ./_countHolders */ "./node_modules/lodash/_countHolders.js"),
    createCtor = __webpack_require__(/*! ./_createCtor */ "./node_modules/lodash/_createCtor.js"),
    createRecurry = __webpack_require__(/*! ./_createRecurry */ "./node_modules/lodash/_createRecurry.js"),
    getHolder = __webpack_require__(/*! ./_getHolder */ "./node_modules/lodash/_getHolder.js"),
    reorder = __webpack_require__(/*! ./_reorder */ "./node_modules/lodash/_reorder.js"),
    replaceHolders = __webpack_require__(/*! ./_replaceHolders */ "./node_modules/lodash/_replaceHolders.js"),
    root = __webpack_require__(/*! ./_root */ "./node_modules/lodash/_root.js");

/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1,
    WRAP_BIND_KEY_FLAG = 2,
    WRAP_CURRY_FLAG = 8,
    WRAP_CURRY_RIGHT_FLAG = 16,
    WRAP_ARY_FLAG = 128,
    WRAP_FLIP_FLAG = 512;

/**
 * Creates a function that wraps `func` to invoke it with optional `this`
 * binding of `thisArg`, partial application, and currying.
 *
 * @private
 * @param {Function|string} func The function or method name to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {Array} [partials] The arguments to prepend to those provided to
 *  the new function.
 * @param {Array} [holders] The `partials` placeholder indexes.
 * @param {Array} [partialsRight] The arguments to append to those provided
 *  to the new function.
 * @param {Array} [holdersRight] The `partialsRight` placeholder indexes.
 * @param {Array} [argPos] The argument positions of the new function.
 * @param {number} [ary] The arity cap of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createHybrid(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity) {
  var isAry = bitmask & WRAP_ARY_FLAG,
      isBind = bitmask & WRAP_BIND_FLAG,
      isBindKey = bitmask & WRAP_BIND_KEY_FLAG,
      isCurried = bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG),
      isFlip = bitmask & WRAP_FLIP_FLAG,
      Ctor = isBindKey ? undefined : createCtor(func);

  function wrapper() {
    var length = arguments.length,
        args = Array(length),
        index = length;

    while (index--) {
      args[index] = arguments[index];
    }
    if (isCurried) {
      var placeholder = getHolder(wrapper),
          holdersCount = countHolders(args, placeholder);
    }
    if (partials) {
      args = composeArgs(args, partials, holders, isCurried);
    }
    if (partialsRight) {
      args = composeArgsRight(args, partialsRight, holdersRight, isCurried);
    }
    length -= holdersCount;
    if (isCurried && length < arity) {
      var newHolders = replaceHolders(args, placeholder);
      return createRecurry(
        func, bitmask, createHybrid, wrapper.placeholder, thisArg,
        args, newHolders, argPos, ary, arity - length
      );
    }
    var thisBinding = isBind ? thisArg : this,
        fn = isBindKey ? thisBinding[func] : func;

    length = args.length;
    if (argPos) {
      args = reorder(args, argPos);
    } else if (isFlip && length > 1) {
      args.reverse();
    }
    if (isAry && ary < length) {
      args.length = ary;
    }
    if (this && this !== root && this instanceof wrapper) {
      fn = Ctor || createCtor(fn);
    }
    return fn.apply(thisBinding, args);
  }
  return wrapper;
}

module.exports = createHybrid;


/***/ }),

/***/ "./node_modules/lodash/_createPartial.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash/_createPartial.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var apply = __webpack_require__(/*! ./_apply */ "./node_modules/lodash/_apply.js"),
    createCtor = __webpack_require__(/*! ./_createCtor */ "./node_modules/lodash/_createCtor.js"),
    root = __webpack_require__(/*! ./_root */ "./node_modules/lodash/_root.js");

/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1;

/**
 * Creates a function that wraps `func` to invoke it with the `this` binding
 * of `thisArg` and `partials` prepended to the arguments it receives.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} partials The arguments to prepend to those provided to
 *  the new function.
 * @returns {Function} Returns the new wrapped function.
 */
function createPartial(func, bitmask, thisArg, partials) {
  var isBind = bitmask & WRAP_BIND_FLAG,
      Ctor = createCtor(func);

  function wrapper() {
    var argsIndex = -1,
        argsLength = arguments.length,
        leftIndex = -1,
        leftLength = partials.length,
        args = Array(leftLength + argsLength),
        fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;

    while (++leftIndex < leftLength) {
      args[leftIndex] = partials[leftIndex];
    }
    while (argsLength--) {
      args[leftIndex++] = arguments[++argsIndex];
    }
    return apply(fn, isBind ? thisArg : this, args);
  }
  return wrapper;
}

module.exports = createPartial;


/***/ }),

/***/ "./node_modules/lodash/_createRecurry.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash/_createRecurry.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isLaziable = __webpack_require__(/*! ./_isLaziable */ "./node_modules/lodash/_isLaziable.js"),
    setData = __webpack_require__(/*! ./_setData */ "./node_modules/lodash/_setData.js"),
    setWrapToString = __webpack_require__(/*! ./_setWrapToString */ "./node_modules/lodash/_setWrapToString.js");

/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1,
    WRAP_BIND_KEY_FLAG = 2,
    WRAP_CURRY_BOUND_FLAG = 4,
    WRAP_CURRY_FLAG = 8,
    WRAP_PARTIAL_FLAG = 32,
    WRAP_PARTIAL_RIGHT_FLAG = 64;

/**
 * Creates a function that wraps `func` to continue currying.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {Function} wrapFunc The function to create the `func` wrapper.
 * @param {*} placeholder The placeholder value.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {Array} [partials] The arguments to prepend to those provided to
 *  the new function.
 * @param {Array} [holders] The `partials` placeholder indexes.
 * @param {Array} [argPos] The argument positions of the new function.
 * @param {number} [ary] The arity cap of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createRecurry(func, bitmask, wrapFunc, placeholder, thisArg, partials, holders, argPos, ary, arity) {
  var isCurry = bitmask & WRAP_CURRY_FLAG,
      newHolders = isCurry ? holders : undefined,
      newHoldersRight = isCurry ? undefined : holders,
      newPartials = isCurry ? partials : undefined,
      newPartialsRight = isCurry ? undefined : partials;

  bitmask |= (isCurry ? WRAP_PARTIAL_FLAG : WRAP_PARTIAL_RIGHT_FLAG);
  bitmask &= ~(isCurry ? WRAP_PARTIAL_RIGHT_FLAG : WRAP_PARTIAL_FLAG);

  if (!(bitmask & WRAP_CURRY_BOUND_FLAG)) {
    bitmask &= ~(WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG);
  }
  var newData = [
    func, bitmask, thisArg, newPartials, newHolders, newPartialsRight,
    newHoldersRight, argPos, ary, arity
  ];

  var result = wrapFunc.apply(undefined, newData);
  if (isLaziable(func)) {
    setData(result, newData);
  }
  result.placeholder = placeholder;
  return setWrapToString(result, func, bitmask);
}

module.exports = createRecurry;


/***/ }),

/***/ "./node_modules/lodash/_createWrap.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_createWrap.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseSetData = __webpack_require__(/*! ./_baseSetData */ "./node_modules/lodash/_baseSetData.js"),
    createBind = __webpack_require__(/*! ./_createBind */ "./node_modules/lodash/_createBind.js"),
    createCurry = __webpack_require__(/*! ./_createCurry */ "./node_modules/lodash/_createCurry.js"),
    createHybrid = __webpack_require__(/*! ./_createHybrid */ "./node_modules/lodash/_createHybrid.js"),
    createPartial = __webpack_require__(/*! ./_createPartial */ "./node_modules/lodash/_createPartial.js"),
    getData = __webpack_require__(/*! ./_getData */ "./node_modules/lodash/_getData.js"),
    mergeData = __webpack_require__(/*! ./_mergeData */ "./node_modules/lodash/_mergeData.js"),
    setData = __webpack_require__(/*! ./_setData */ "./node_modules/lodash/_setData.js"),
    setWrapToString = __webpack_require__(/*! ./_setWrapToString */ "./node_modules/lodash/_setWrapToString.js"),
    toInteger = __webpack_require__(/*! ./toInteger */ "./node_modules/lodash/toInteger.js");

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1,
    WRAP_BIND_KEY_FLAG = 2,
    WRAP_CURRY_FLAG = 8,
    WRAP_CURRY_RIGHT_FLAG = 16,
    WRAP_PARTIAL_FLAG = 32,
    WRAP_PARTIAL_RIGHT_FLAG = 64;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that either curries or invokes `func` with optional
 * `this` binding and partially applied arguments.
 *
 * @private
 * @param {Function|string} func The function or method name to wrap.
 * @param {number} bitmask The bitmask flags.
 *    1 - `_.bind`
 *    2 - `_.bindKey`
 *    4 - `_.curry` or `_.curryRight` of a bound function
 *    8 - `_.curry`
 *   16 - `_.curryRight`
 *   32 - `_.partial`
 *   64 - `_.partialRight`
 *  128 - `_.rearg`
 *  256 - `_.ary`
 *  512 - `_.flip`
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {Array} [partials] The arguments to be partially applied.
 * @param {Array} [holders] The `partials` placeholder indexes.
 * @param {Array} [argPos] The argument positions of the new function.
 * @param {number} [ary] The arity cap of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createWrap(func, bitmask, thisArg, partials, holders, argPos, ary, arity) {
  var isBindKey = bitmask & WRAP_BIND_KEY_FLAG;
  if (!isBindKey && typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var length = partials ? partials.length : 0;
  if (!length) {
    bitmask &= ~(WRAP_PARTIAL_FLAG | WRAP_PARTIAL_RIGHT_FLAG);
    partials = holders = undefined;
  }
  ary = ary === undefined ? ary : nativeMax(toInteger(ary), 0);
  arity = arity === undefined ? arity : toInteger(arity);
  length -= holders ? holders.length : 0;

  if (bitmask & WRAP_PARTIAL_RIGHT_FLAG) {
    var partialsRight = partials,
        holdersRight = holders;

    partials = holders = undefined;
  }
  var data = isBindKey ? undefined : getData(func);

  var newData = [
    func, bitmask, thisArg, partials, holders, partialsRight, holdersRight,
    argPos, ary, arity
  ];

  if (data) {
    mergeData(newData, data);
  }
  func = newData[0];
  bitmask = newData[1];
  thisArg = newData[2];
  partials = newData[3];
  holders = newData[4];
  arity = newData[9] = newData[9] === undefined
    ? (isBindKey ? 0 : func.length)
    : nativeMax(newData[9] - length, 0);

  if (!arity && bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG)) {
    bitmask &= ~(WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG);
  }
  if (!bitmask || bitmask == WRAP_BIND_FLAG) {
    var result = createBind(func, bitmask, thisArg);
  } else if (bitmask == WRAP_CURRY_FLAG || bitmask == WRAP_CURRY_RIGHT_FLAG) {
    result = createCurry(func, bitmask, arity);
  } else if ((bitmask == WRAP_PARTIAL_FLAG || bitmask == (WRAP_BIND_FLAG | WRAP_PARTIAL_FLAG)) && !holders.length) {
    result = createPartial(func, bitmask, thisArg, partials);
  } else {
    result = createHybrid.apply(undefined, newData);
  }
  var setter = data ? baseSetData : setData;
  return setWrapToString(setter(result, newData), func, bitmask);
}

module.exports = createWrap;


/***/ }),

/***/ "./node_modules/lodash/_getData.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_getData.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var metaMap = __webpack_require__(/*! ./_metaMap */ "./node_modules/lodash/_metaMap.js"),
    noop = __webpack_require__(/*! ./noop */ "./node_modules/lodash/noop.js");

/**
 * Gets metadata for `func`.
 *
 * @private
 * @param {Function} func The function to query.
 * @returns {*} Returns the metadata for `func`.
 */
var getData = !metaMap ? noop : function(func) {
  return metaMap.get(func);
};

module.exports = getData;


/***/ }),

/***/ "./node_modules/lodash/_getFuncName.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/_getFuncName.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var realNames = __webpack_require__(/*! ./_realNames */ "./node_modules/lodash/_realNames.js");

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Gets the name of `func`.
 *
 * @private
 * @param {Function} func The function to query.
 * @returns {string} Returns the function name.
 */
function getFuncName(func) {
  var result = (func.name + ''),
      array = realNames[result],
      length = hasOwnProperty.call(realNames, result) ? array.length : 0;

  while (length--) {
    var data = array[length],
        otherFunc = data.func;
    if (otherFunc == null || otherFunc == func) {
      return data.name;
    }
  }
  return result;
}

module.exports = getFuncName;


/***/ }),

/***/ "./node_modules/lodash/_getHolder.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_getHolder.js ***!
  \*******************************************/
/***/ ((module) => {

/**
 * Gets the argument placeholder value for `func`.
 *
 * @private
 * @param {Function} func The function to inspect.
 * @returns {*} Returns the placeholder value.
 */
function getHolder(func) {
  var object = func;
  return object.placeholder;
}

module.exports = getHolder;


/***/ }),

/***/ "./node_modules/lodash/_getWrapDetails.js":
/*!************************************************!*\
  !*** ./node_modules/lodash/_getWrapDetails.js ***!
  \************************************************/
/***/ ((module) => {

/** Used to match wrap detail comments. */
var reWrapDetails = /\{\n\/\* \[wrapped with (.+)\] \*/,
    reSplitDetails = /,? & /;

/**
 * Extracts wrapper details from the `source` body comment.
 *
 * @private
 * @param {string} source The source to inspect.
 * @returns {Array} Returns the wrapper details.
 */
function getWrapDetails(source) {
  var match = source.match(reWrapDetails);
  return match ? match[1].split(reSplitDetails) : [];
}

module.exports = getWrapDetails;


/***/ }),

/***/ "./node_modules/lodash/_insertWrapDetails.js":
/*!***************************************************!*\
  !*** ./node_modules/lodash/_insertWrapDetails.js ***!
  \***************************************************/
/***/ ((module) => {

/** Used to match wrap detail comments. */
var reWrapComment = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/;

/**
 * Inserts wrapper `details` in a comment at the top of the `source` body.
 *
 * @private
 * @param {string} source The source to modify.
 * @returns {Array} details The details to insert.
 * @returns {string} Returns the modified source.
 */
function insertWrapDetails(source, details) {
  var length = details.length;
  if (!length) {
    return source;
  }
  var lastIndex = length - 1;
  details[lastIndex] = (length > 1 ? '& ' : '') + details[lastIndex];
  details = details.join(length > 2 ? ', ' : ' ');
  return source.replace(reWrapComment, '{\n/* [wrapped with ' + details + '] */\n');
}

module.exports = insertWrapDetails;


/***/ }),

/***/ "./node_modules/lodash/_isLaziable.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_isLaziable.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var LazyWrapper = __webpack_require__(/*! ./_LazyWrapper */ "./node_modules/lodash/_LazyWrapper.js"),
    getData = __webpack_require__(/*! ./_getData */ "./node_modules/lodash/_getData.js"),
    getFuncName = __webpack_require__(/*! ./_getFuncName */ "./node_modules/lodash/_getFuncName.js"),
    lodash = __webpack_require__(/*! ./wrapperLodash */ "./node_modules/lodash/wrapperLodash.js");

/**
 * Checks if `func` has a lazy counterpart.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` has a lazy counterpart,
 *  else `false`.
 */
function isLaziable(func) {
  var funcName = getFuncName(func),
      other = lodash[funcName];

  if (typeof other != 'function' || !(funcName in LazyWrapper.prototype)) {
    return false;
  }
  if (func === other) {
    return true;
  }
  var data = getData(other);
  return !!data && func === data[0];
}

module.exports = isLaziable;


/***/ }),

/***/ "./node_modules/lodash/_mergeData.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_mergeData.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var composeArgs = __webpack_require__(/*! ./_composeArgs */ "./node_modules/lodash/_composeArgs.js"),
    composeArgsRight = __webpack_require__(/*! ./_composeArgsRight */ "./node_modules/lodash/_composeArgsRight.js"),
    replaceHolders = __webpack_require__(/*! ./_replaceHolders */ "./node_modules/lodash/_replaceHolders.js");

/** Used as the internal argument placeholder. */
var PLACEHOLDER = '__lodash_placeholder__';

/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1,
    WRAP_BIND_KEY_FLAG = 2,
    WRAP_CURRY_BOUND_FLAG = 4,
    WRAP_CURRY_FLAG = 8,
    WRAP_ARY_FLAG = 128,
    WRAP_REARG_FLAG = 256;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMin = Math.min;

/**
 * Merges the function metadata of `source` into `data`.
 *
 * Merging metadata reduces the number of wrappers used to invoke a function.
 * This is possible because methods like `_.bind`, `_.curry`, and `_.partial`
 * may be applied regardless of execution order. Methods like `_.ary` and
 * `_.rearg` modify function arguments, making the order in which they are
 * executed important, preventing the merging of metadata. However, we make
 * an exception for a safe combined case where curried functions have `_.ary`
 * and or `_.rearg` applied.
 *
 * @private
 * @param {Array} data The destination metadata.
 * @param {Array} source The source metadata.
 * @returns {Array} Returns `data`.
 */
function mergeData(data, source) {
  var bitmask = data[1],
      srcBitmask = source[1],
      newBitmask = bitmask | srcBitmask,
      isCommon = newBitmask < (WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG | WRAP_ARY_FLAG);

  var isCombo =
    ((srcBitmask == WRAP_ARY_FLAG) && (bitmask == WRAP_CURRY_FLAG)) ||
    ((srcBitmask == WRAP_ARY_FLAG) && (bitmask == WRAP_REARG_FLAG) && (data[7].length <= source[8])) ||
    ((srcBitmask == (WRAP_ARY_FLAG | WRAP_REARG_FLAG)) && (source[7].length <= source[8]) && (bitmask == WRAP_CURRY_FLAG));

  // Exit early if metadata can't be merged.
  if (!(isCommon || isCombo)) {
    return data;
  }
  // Use source `thisArg` if available.
  if (srcBitmask & WRAP_BIND_FLAG) {
    data[2] = source[2];
    // Set when currying a bound function.
    newBitmask |= bitmask & WRAP_BIND_FLAG ? 0 : WRAP_CURRY_BOUND_FLAG;
  }
  // Compose partial arguments.
  var value = source[3];
  if (value) {
    var partials = data[3];
    data[3] = partials ? composeArgs(partials, value, source[4]) : value;
    data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : source[4];
  }
  // Compose partial right arguments.
  value = source[5];
  if (value) {
    partials = data[5];
    data[5] = partials ? composeArgsRight(partials, value, source[6]) : value;
    data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : source[6];
  }
  // Use source `argPos` if available.
  value = source[7];
  if (value) {
    data[7] = value;
  }
  // Use source `ary` if it's smaller.
  if (srcBitmask & WRAP_ARY_FLAG) {
    data[8] = data[8] == null ? source[8] : nativeMin(data[8], source[8]);
  }
  // Use source `arity` if one is not provided.
  if (data[9] == null) {
    data[9] = source[9];
  }
  // Use source `func` and merge bitmasks.
  data[0] = source[0];
  data[1] = newBitmask;

  return data;
}

module.exports = mergeData;


/***/ }),

/***/ "./node_modules/lodash/_metaMap.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_metaMap.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var WeakMap = __webpack_require__(/*! ./_WeakMap */ "./node_modules/lodash/_WeakMap.js");

/** Used to store function metadata. */
var metaMap = WeakMap && new WeakMap;

module.exports = metaMap;


/***/ }),

/***/ "./node_modules/lodash/_realNames.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_realNames.js ***!
  \*******************************************/
/***/ ((module) => {

/** Used to lookup unminified function names. */
var realNames = {};

module.exports = realNames;


/***/ }),

/***/ "./node_modules/lodash/_reorder.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_reorder.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var copyArray = __webpack_require__(/*! ./_copyArray */ "./node_modules/lodash/_copyArray.js"),
    isIndex = __webpack_require__(/*! ./_isIndex */ "./node_modules/lodash/_isIndex.js");

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMin = Math.min;

/**
 * Reorder `array` according to the specified indexes where the element at
 * the first index is assigned as the first element, the element at
 * the second index is assigned as the second element, and so on.
 *
 * @private
 * @param {Array} array The array to reorder.
 * @param {Array} indexes The arranged array indexes.
 * @returns {Array} Returns `array`.
 */
function reorder(array, indexes) {
  var arrLength = array.length,
      length = nativeMin(indexes.length, arrLength),
      oldArray = copyArray(array);

  while (length--) {
    var index = indexes[length];
    array[length] = isIndex(index, arrLength) ? oldArray[index] : undefined;
  }
  return array;
}

module.exports = reorder;


/***/ }),

/***/ "./node_modules/lodash/_replaceHolders.js":
/*!************************************************!*\
  !*** ./node_modules/lodash/_replaceHolders.js ***!
  \************************************************/
/***/ ((module) => {

/** Used as the internal argument placeholder. */
var PLACEHOLDER = '__lodash_placeholder__';

/**
 * Replaces all `placeholder` elements in `array` with an internal placeholder
 * and returns an array of their indexes.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {*} placeholder The placeholder to replace.
 * @returns {Array} Returns the new array of placeholder indexes.
 */
function replaceHolders(array, placeholder) {
  var index = -1,
      length = array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (value === placeholder || value === PLACEHOLDER) {
      array[index] = PLACEHOLDER;
      result[resIndex++] = index;
    }
  }
  return result;
}

module.exports = replaceHolders;


/***/ }),

/***/ "./node_modules/lodash/_setData.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/_setData.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseSetData = __webpack_require__(/*! ./_baseSetData */ "./node_modules/lodash/_baseSetData.js"),
    shortOut = __webpack_require__(/*! ./_shortOut */ "./node_modules/lodash/_shortOut.js");

/**
 * Sets metadata for `func`.
 *
 * **Note:** If this function becomes hot, i.e. is invoked a lot in a short
 * period of time, it will trip its breaker and transition to an identity
 * function to avoid garbage collection pauses in V8. See
 * [V8 issue 2070](https://bugs.chromium.org/p/v8/issues/detail?id=2070)
 * for more details.
 *
 * @private
 * @param {Function} func The function to associate metadata with.
 * @param {*} data The metadata.
 * @returns {Function} Returns `func`.
 */
var setData = shortOut(baseSetData);

module.exports = setData;


/***/ }),

/***/ "./node_modules/lodash/_setWrapToString.js":
/*!*************************************************!*\
  !*** ./node_modules/lodash/_setWrapToString.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getWrapDetails = __webpack_require__(/*! ./_getWrapDetails */ "./node_modules/lodash/_getWrapDetails.js"),
    insertWrapDetails = __webpack_require__(/*! ./_insertWrapDetails */ "./node_modules/lodash/_insertWrapDetails.js"),
    setToString = __webpack_require__(/*! ./_setToString */ "./node_modules/lodash/_setToString.js"),
    updateWrapDetails = __webpack_require__(/*! ./_updateWrapDetails */ "./node_modules/lodash/_updateWrapDetails.js");

/**
 * Sets the `toString` method of `wrapper` to mimic the source of `reference`
 * with wrapper details in a comment at the top of the source body.
 *
 * @private
 * @param {Function} wrapper The function to modify.
 * @param {Function} reference The reference function.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @returns {Function} Returns `wrapper`.
 */
function setWrapToString(wrapper, reference, bitmask) {
  var source = (reference + '');
  return setToString(wrapper, insertWrapDetails(source, updateWrapDetails(getWrapDetails(source), bitmask)));
}

module.exports = setWrapToString;


/***/ }),

/***/ "./node_modules/lodash/_strictIndexOf.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash/_strictIndexOf.js ***!
  \***********************************************/
/***/ ((module) => {

/**
 * A specialized version of `_.indexOf` which performs strict equality
 * comparisons of values, i.e. `===`.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function strictIndexOf(array, value, fromIndex) {
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

module.exports = strictIndexOf;


/***/ }),

/***/ "./node_modules/lodash/_trimmedEndIndex.js":
/*!*************************************************!*\
  !*** ./node_modules/lodash/_trimmedEndIndex.js ***!
  \*************************************************/
/***/ ((module) => {

/** Used to match a single whitespace character. */
var reWhitespace = /\s/;

/**
 * Used by `_.trim` and `_.trimEnd` to get the index of the last non-whitespace
 * character of `string`.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {number} Returns the index of the last non-whitespace character.
 */
function trimmedEndIndex(string) {
  var index = string.length;

  while (index-- && reWhitespace.test(string.charAt(index))) {}
  return index;
}

module.exports = trimmedEndIndex;


/***/ }),

/***/ "./node_modules/lodash/_updateWrapDetails.js":
/*!***************************************************!*\
  !*** ./node_modules/lodash/_updateWrapDetails.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var arrayEach = __webpack_require__(/*! ./_arrayEach */ "./node_modules/lodash/_arrayEach.js"),
    arrayIncludes = __webpack_require__(/*! ./_arrayIncludes */ "./node_modules/lodash/_arrayIncludes.js");

/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1,
    WRAP_BIND_KEY_FLAG = 2,
    WRAP_CURRY_FLAG = 8,
    WRAP_CURRY_RIGHT_FLAG = 16,
    WRAP_PARTIAL_FLAG = 32,
    WRAP_PARTIAL_RIGHT_FLAG = 64,
    WRAP_ARY_FLAG = 128,
    WRAP_REARG_FLAG = 256,
    WRAP_FLIP_FLAG = 512;

/** Used to associate wrap methods with their bit flags. */
var wrapFlags = [
  ['ary', WRAP_ARY_FLAG],
  ['bind', WRAP_BIND_FLAG],
  ['bindKey', WRAP_BIND_KEY_FLAG],
  ['curry', WRAP_CURRY_FLAG],
  ['curryRight', WRAP_CURRY_RIGHT_FLAG],
  ['flip', WRAP_FLIP_FLAG],
  ['partial', WRAP_PARTIAL_FLAG],
  ['partialRight', WRAP_PARTIAL_RIGHT_FLAG],
  ['rearg', WRAP_REARG_FLAG]
];

/**
 * Updates wrapper `details` based on `bitmask` flags.
 *
 * @private
 * @returns {Array} details The details to modify.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @returns {Array} Returns `details`.
 */
function updateWrapDetails(details, bitmask) {
  arrayEach(wrapFlags, function(pair) {
    var value = '_.' + pair[0];
    if ((bitmask & pair[1]) && !arrayIncludes(details, value)) {
      details.push(value);
    }
  });
  return details.sort();
}

module.exports = updateWrapDetails;


/***/ }),

/***/ "./node_modules/lodash/_wrapperClone.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/_wrapperClone.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var LazyWrapper = __webpack_require__(/*! ./_LazyWrapper */ "./node_modules/lodash/_LazyWrapper.js"),
    LodashWrapper = __webpack_require__(/*! ./_LodashWrapper */ "./node_modules/lodash/_LodashWrapper.js"),
    copyArray = __webpack_require__(/*! ./_copyArray */ "./node_modules/lodash/_copyArray.js");

/**
 * Creates a clone of `wrapper`.
 *
 * @private
 * @param {Object} wrapper The wrapper to clone.
 * @returns {Object} Returns the cloned wrapper.
 */
function wrapperClone(wrapper) {
  if (wrapper instanceof LazyWrapper) {
    return wrapper.clone();
  }
  var result = new LodashWrapper(wrapper.__wrapped__, wrapper.__chain__);
  result.__actions__ = copyArray(wrapper.__actions__);
  result.__index__  = wrapper.__index__;
  result.__values__ = wrapper.__values__;
  return result;
}

module.exports = wrapperClone;


/***/ }),

/***/ "./node_modules/lodash/noop.js":
/*!*************************************!*\
  !*** ./node_modules/lodash/noop.js ***!
  \*************************************/
/***/ ((module) => {

/**
 * This method returns `undefined`.
 *
 * @static
 * @memberOf _
 * @since 2.3.0
 * @category Util
 * @example
 *
 * _.times(2, _.noop);
 * // => [undefined, undefined]
 */
function noop() {
  // No operation performed.
}

module.exports = noop;


/***/ }),

/***/ "./node_modules/lodash/partial.js":
/*!****************************************!*\
  !*** ./node_modules/lodash/partial.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseRest = __webpack_require__(/*! ./_baseRest */ "./node_modules/lodash/_baseRest.js"),
    createWrap = __webpack_require__(/*! ./_createWrap */ "./node_modules/lodash/_createWrap.js"),
    getHolder = __webpack_require__(/*! ./_getHolder */ "./node_modules/lodash/_getHolder.js"),
    replaceHolders = __webpack_require__(/*! ./_replaceHolders */ "./node_modules/lodash/_replaceHolders.js");

/** Used to compose bitmasks for function metadata. */
var WRAP_PARTIAL_FLAG = 32;

/**
 * Creates a function that invokes `func` with `partials` prepended to the
 * arguments it receives. This method is like `_.bind` except it does **not**
 * alter the `this` binding.
 *
 * The `_.partial.placeholder` value, which defaults to `_` in monolithic
 * builds, may be used as a placeholder for partially applied arguments.
 *
 * **Note:** This method doesn't set the "length" property of partially
 * applied functions.
 *
 * @static
 * @memberOf _
 * @since 0.2.0
 * @category Function
 * @param {Function} func The function to partially apply arguments to.
 * @param {...*} [partials] The arguments to be partially applied.
 * @returns {Function} Returns the new partially applied function.
 * @example
 *
 * function greet(greeting, name) {
 *   return greeting + ' ' + name;
 * }
 *
 * var sayHelloTo = _.partial(greet, 'hello');
 * sayHelloTo('fred');
 * // => 'hello fred'
 *
 * // Partially applied with placeholders.
 * var greetFred = _.partial(greet, _, 'fred');
 * greetFred('hi');
 * // => 'hi fred'
 */
var partial = baseRest(function(func, partials) {
  var holders = replaceHolders(partials, getHolder(partial));
  return createWrap(func, WRAP_PARTIAL_FLAG, undefined, partials, holders);
});

// Assign default placeholders.
partial.placeholder = {};

module.exports = partial;


/***/ }),

/***/ "./node_modules/lodash/set.js":
/*!************************************!*\
  !*** ./node_modules/lodash/set.js ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseSet = __webpack_require__(/*! ./_baseSet */ "./node_modules/lodash/_baseSet.js");

/**
 * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
 * it's created. Arrays are created for missing index properties while objects
 * are created for all other missing properties. Use `_.setWith` to customize
 * `path` creation.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.set(object, 'a[0].b.c', 4);
 * console.log(object.a[0].b.c);
 * // => 4
 *
 * _.set(object, ['x', '0', 'y', 'z'], 5);
 * console.log(object.x[0].y.z);
 * // => 5
 */
function set(object, path, value) {
  return object == null ? object : baseSet(object, path, value);
}

module.exports = set;


/***/ }),

/***/ "./node_modules/lodash/toFinite.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/toFinite.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toNumber = __webpack_require__(/*! ./toNumber */ "./node_modules/lodash/toNumber.js");

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0,
    MAX_INTEGER = 1.7976931348623157e+308;

/**
 * Converts `value` to a finite number.
 *
 * @static
 * @memberOf _
 * @since 4.12.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted number.
 * @example
 *
 * _.toFinite(3.2);
 * // => 3.2
 *
 * _.toFinite(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toFinite(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toFinite('3.2');
 * // => 3.2
 */
function toFinite(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber(value);
  if (value === INFINITY || value === -INFINITY) {
    var sign = (value < 0 ? -1 : 1);
    return sign * MAX_INTEGER;
  }
  return value === value ? value : 0;
}

module.exports = toFinite;


/***/ }),

/***/ "./node_modules/lodash/toInteger.js":
/*!******************************************!*\
  !*** ./node_modules/lodash/toInteger.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toFinite = __webpack_require__(/*! ./toFinite */ "./node_modules/lodash/toFinite.js");

/**
 * Converts `value` to an integer.
 *
 * **Note:** This method is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3.2);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3.2');
 * // => 3
 */
function toInteger(value) {
  var result = toFinite(value),
      remainder = result % 1;

  return result === result ? (remainder ? result - remainder : result) : 0;
}

module.exports = toInteger;


/***/ }),

/***/ "./node_modules/lodash/toNumber.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/toNumber.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseTrim = __webpack_require__(/*! ./_baseTrim */ "./node_modules/lodash/_baseTrim.js"),
    isObject = __webpack_require__(/*! ./isObject */ "./node_modules/lodash/isObject.js"),
    isSymbol = __webpack_require__(/*! ./isSymbol */ "./node_modules/lodash/isSymbol.js");

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = baseTrim(value);
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = toNumber;


/***/ }),

/***/ "./node_modules/lodash/wrapperLodash.js":
/*!**********************************************!*\
  !*** ./node_modules/lodash/wrapperLodash.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var LazyWrapper = __webpack_require__(/*! ./_LazyWrapper */ "./node_modules/lodash/_LazyWrapper.js"),
    LodashWrapper = __webpack_require__(/*! ./_LodashWrapper */ "./node_modules/lodash/_LodashWrapper.js"),
    baseLodash = __webpack_require__(/*! ./_baseLodash */ "./node_modules/lodash/_baseLodash.js"),
    isArray = __webpack_require__(/*! ./isArray */ "./node_modules/lodash/isArray.js"),
    isObjectLike = __webpack_require__(/*! ./isObjectLike */ "./node_modules/lodash/isObjectLike.js"),
    wrapperClone = __webpack_require__(/*! ./_wrapperClone */ "./node_modules/lodash/_wrapperClone.js");

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates a `lodash` object which wraps `value` to enable implicit method
 * chain sequences. Methods that operate on and return arrays, collections,
 * and functions can be chained together. Methods that retrieve a single value
 * or may return a primitive value will automatically end the chain sequence
 * and return the unwrapped value. Otherwise, the value must be unwrapped
 * with `_#value`.
 *
 * Explicit chain sequences, which must be unwrapped with `_#value`, may be
 * enabled using `_.chain`.
 *
 * The execution of chained methods is lazy, that is, it's deferred until
 * `_#value` is implicitly or explicitly called.
 *
 * Lazy evaluation allows several methods to support shortcut fusion.
 * Shortcut fusion is an optimization to merge iteratee calls; this avoids
 * the creation of intermediate arrays and can greatly reduce the number of
 * iteratee executions. Sections of a chain sequence qualify for shortcut
 * fusion if the section is applied to an array and iteratees accept only
 * one argument. The heuristic for whether a section qualifies for shortcut
 * fusion is subject to change.
 *
 * Chaining is supported in custom builds as long as the `_#value` method is
 * directly or indirectly included in the build.
 *
 * In addition to lodash methods, wrappers have `Array` and `String` methods.
 *
 * The wrapper `Array` methods are:
 * `concat`, `join`, `pop`, `push`, `shift`, `sort`, `splice`, and `unshift`
 *
 * The wrapper `String` methods are:
 * `replace` and `split`
 *
 * The wrapper methods that support shortcut fusion are:
 * `at`, `compact`, `drop`, `dropRight`, `dropWhile`, `filter`, `find`,
 * `findLast`, `head`, `initial`, `last`, `map`, `reject`, `reverse`, `slice`,
 * `tail`, `take`, `takeRight`, `takeRightWhile`, `takeWhile`, and `toArray`
 *
 * The chainable wrapper methods are:
 * `after`, `ary`, `assign`, `assignIn`, `assignInWith`, `assignWith`, `at`,
 * `before`, `bind`, `bindAll`, `bindKey`, `castArray`, `chain`, `chunk`,
 * `commit`, `compact`, `concat`, `conforms`, `constant`, `countBy`, `create`,
 * `curry`, `debounce`, `defaults`, `defaultsDeep`, `defer`, `delay`,
 * `difference`, `differenceBy`, `differenceWith`, `drop`, `dropRight`,
 * `dropRightWhile`, `dropWhile`, `extend`, `extendWith`, `fill`, `filter`,
 * `flatMap`, `flatMapDeep`, `flatMapDepth`, `flatten`, `flattenDeep`,
 * `flattenDepth`, `flip`, `flow`, `flowRight`, `fromPairs`, `functions`,
 * `functionsIn`, `groupBy`, `initial`, `intersection`, `intersectionBy`,
 * `intersectionWith`, `invert`, `invertBy`, `invokeMap`, `iteratee`, `keyBy`,
 * `keys`, `keysIn`, `map`, `mapKeys`, `mapValues`, `matches`, `matchesProperty`,
 * `memoize`, `merge`, `mergeWith`, `method`, `methodOf`, `mixin`, `negate`,
 * `nthArg`, `omit`, `omitBy`, `once`, `orderBy`, `over`, `overArgs`,
 * `overEvery`, `overSome`, `partial`, `partialRight`, `partition`, `pick`,
 * `pickBy`, `plant`, `property`, `propertyOf`, `pull`, `pullAll`, `pullAllBy`,
 * `pullAllWith`, `pullAt`, `push`, `range`, `rangeRight`, `rearg`, `reject`,
 * `remove`, `rest`, `reverse`, `sampleSize`, `set`, `setWith`, `shuffle`,
 * `slice`, `sort`, `sortBy`, `splice`, `spread`, `tail`, `take`, `takeRight`,
 * `takeRightWhile`, `takeWhile`, `tap`, `throttle`, `thru`, `toArray`,
 * `toPairs`, `toPairsIn`, `toPath`, `toPlainObject`, `transform`, `unary`,
 * `union`, `unionBy`, `unionWith`, `uniq`, `uniqBy`, `uniqWith`, `unset`,
 * `unshift`, `unzip`, `unzipWith`, `update`, `updateWith`, `values`,
 * `valuesIn`, `without`, `wrap`, `xor`, `xorBy`, `xorWith`, `zip`,
 * `zipObject`, `zipObjectDeep`, and `zipWith`
 *
 * The wrapper methods that are **not** chainable by default are:
 * `add`, `attempt`, `camelCase`, `capitalize`, `ceil`, `clamp`, `clone`,
 * `cloneDeep`, `cloneDeepWith`, `cloneWith`, `conformsTo`, `deburr`,
 * `defaultTo`, `divide`, `each`, `eachRight`, `endsWith`, `eq`, `escape`,
 * `escapeRegExp`, `every`, `find`, `findIndex`, `findKey`, `findLast`,
 * `findLastIndex`, `findLastKey`, `first`, `floor`, `forEach`, `forEachRight`,
 * `forIn`, `forInRight`, `forOwn`, `forOwnRight`, `get`, `gt`, `gte`, `has`,
 * `hasIn`, `head`, `identity`, `includes`, `indexOf`, `inRange`, `invoke`,
 * `isArguments`, `isArray`, `isArrayBuffer`, `isArrayLike`, `isArrayLikeObject`,
 * `isBoolean`, `isBuffer`, `isDate`, `isElement`, `isEmpty`, `isEqual`,
 * `isEqualWith`, `isError`, `isFinite`, `isFunction`, `isInteger`, `isLength`,
 * `isMap`, `isMatch`, `isMatchWith`, `isNaN`, `isNative`, `isNil`, `isNull`,
 * `isNumber`, `isObject`, `isObjectLike`, `isPlainObject`, `isRegExp`,
 * `isSafeInteger`, `isSet`, `isString`, `isUndefined`, `isTypedArray`,
 * `isWeakMap`, `isWeakSet`, `join`, `kebabCase`, `last`, `lastIndexOf`,
 * `lowerCase`, `lowerFirst`, `lt`, `lte`, `max`, `maxBy`, `mean`, `meanBy`,
 * `min`, `minBy`, `multiply`, `noConflict`, `noop`, `now`, `nth`, `pad`,
 * `padEnd`, `padStart`, `parseInt`, `pop`, `random`, `reduce`, `reduceRight`,
 * `repeat`, `result`, `round`, `runInContext`, `sample`, `shift`, `size`,
 * `snakeCase`, `some`, `sortedIndex`, `sortedIndexBy`, `sortedLastIndex`,
 * `sortedLastIndexBy`, `startCase`, `startsWith`, `stubArray`, `stubFalse`,
 * `stubObject`, `stubString`, `stubTrue`, `subtract`, `sum`, `sumBy`,
 * `template`, `times`, `toFinite`, `toInteger`, `toJSON`, `toLength`,
 * `toLower`, `toNumber`, `toSafeInteger`, `toString`, `toUpper`, `trim`,
 * `trimEnd`, `trimStart`, `truncate`, `unescape`, `uniqueId`, `upperCase`,
 * `upperFirst`, `value`, and `words`
 *
 * @name _
 * @constructor
 * @category Seq
 * @param {*} value The value to wrap in a `lodash` instance.
 * @returns {Object} Returns the new `lodash` wrapper instance.
 * @example
 *
 * function square(n) {
 *   return n * n;
 * }
 *
 * var wrapped = _([1, 2, 3]);
 *
 * // Returns an unwrapped value.
 * wrapped.reduce(_.add);
 * // => 6
 *
 * // Returns a wrapped value.
 * var squares = wrapped.map(square);
 *
 * _.isArray(squares);
 * // => false
 *
 * _.isArray(squares.value());
 * // => true
 */
function lodash(value) {
  if (isObjectLike(value) && !isArray(value) && !(value instanceof LazyWrapper)) {
    if (value instanceof LodashWrapper) {
      return value;
    }
    if (hasOwnProperty.call(value, '__wrapped__')) {
      return wrapperClone(value);
    }
  }
  return new LodashWrapper(value);
}

// Ensure wrappers are instances of `baseLodash`.
lodash.prototype = baseLodash.prototype;
lodash.prototype.constructor = lodash;

module.exports = lodash;


/***/ }),

/***/ "./public/page-data/sq/d/2582528629.json":
/*!***********************************************!*\
  !*** ./public/page-data/sq/d/2582528629.json ***!
  \***********************************************/
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"data":{"site":{"siteMetadata":{"siteName":"AiTmed","siteTitle":"AiTmed | Start your E-health Journey Anywhere, Anytime","siteDescription":"Anyone, Anywhere, Anytime Start Your E-health Journey With Us","siteLogo":"https://public.aitmed.com/cadl/www3.83/assets/aitmedLogo.png","siteUrl":"https://aitmed.com","siteVideo":"https://public.aitmed.com/commonRes/video/aitmed228FromBlair11192020.mp4"}}}}');

/***/ })

};
;
//# sourceMappingURL=component---src-templates-page-tsx.js.map