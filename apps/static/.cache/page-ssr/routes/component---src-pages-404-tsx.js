"use strict";
exports.id = 218;
exports.ids = [218];
exports.modules = {

/***/ 3904:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(636);
/* harmony import */ var _jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4593);
/* harmony import */ var gatsby__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9572);
/* harmony import */ var _emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(8847);
/**
 * https://www.gatsbyjs.com/docs/use-static-query/
 */const socialMedia={facebook:'https://www.facebook.com/AITMEDinc',pinterest:'https://www.pinterest.com/aitmedinc/_created/',linkedin:'https://www.linkedin.com/company/aitmed',twitter:'https://www.twitter.com/AITmedInc',tiktok:'https://www.tiktok.com/@aitmedinc?lang=en',youtube:'https://www.youtube.com/channel/UC1su9VCcj8-Ml02W9g35kpw'};function renderMediaMetaTag(type='og',assetType,value){const prefix=type==='twitter'?'twitter':'og';const property=`${prefix}:${assetType}`;if(_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isStr(value)){return (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{property:property,content:value});}if(value&&_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.isObj(value)){return (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsxs */ .BX)(_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .Fragment */ .HY,{children:[assetType==='image'&&value.alt&&(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{property:"og:image:alt",content:String(value.alt)})||null,(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{property:`${property}:width`,content:String(value.width)}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{property:`${property}:height`,content:String(value.height)})]});}return null;}function Seo({title='',description='',canonical='',lang='en',og={},twitter={},url='',allowIndex=true,allowFollow=true}){const{site:{siteMetadata:{siteName,siteTitle,siteDescription,siteLogo,siteUrl,siteVideo}}}=(0,gatsby__WEBPACK_IMPORTED_MODULE_2__.useStaticQuery)("2582528629");return (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsxs */ .BX)(react_helmet__WEBPACK_IMPORTED_MODULE_1__.Helmet,{htmlAttributes:{lang},children:[(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("title",{children:title||siteTitle}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{name:"description",content:description||siteDescription}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{name:"keywords",content:[].join(',')}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{name:"image",content:siteLogo}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{name:"robots",content:`${allowIndex?'index':'noindex'}, ${allowFollow?'follow':'nofollow'}`}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{property:"og:title",content:og.title||title||siteTitle}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{property:"og:description",content:og.description||description||siteDescription}),renderMediaMetaTag('og','image',og.image),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{property:"og:locale",content:og.locale||'en_US'}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{property:"og:site_name",content:og.siteName||siteName}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{property:"og:type",content:og.type||'website'}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{property:"og:url",content:og.url||url||siteUrl}),renderMediaMetaTag('og','video',og.video||siteVideo),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{name:"twitter:card",content:twitter.card||'app'}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{name:"twitter:creator",content:twitter.creator||'AITmedInc'}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{name:"twitter:site",content:twitter.site||siteName}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{name:"twitter:title",content:twitter.title||title}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("meta",{name:"twitter:description",content:twitter.description||description}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("link",{rel:"canonical",href:canonical||siteUrl}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("script",{type:"application/ld+json",children:`
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
        `}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("script",{type:"application/ld+json",children:`{
            "@context" : "https://schema.org",
            "@type" : "Organization",
            "name" : "${siteName}",
            "url" : "${siteUrl}",
            "sameAs" : [${_jsmanifest_utils__WEBPACK_IMPORTED_MODULE_0__.values(socialMedia).map(s=>`${s}`)}]
          }
        `}),(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__/* .jsx */ .tZ)("script",{type:"application/ld+json",children:`{
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
        }`})]});}/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Seo);

/***/ }),

/***/ 2513:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var theme_ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(795);
/* harmony import */ var _components_Seo__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3904);
/* harmony import */ var _emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8847);






function NotFoundPage() {
  return (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__/* .jsxs */ .BX)(_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__/* .Fragment */ .HY, {
    children: [(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__/* .jsx */ .tZ)(_components_Seo__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Z, {
      title: "404: Not found"
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__/* .jsxs */ .BX)(theme_ui__WEBPACK_IMPORTED_MODULE_2__/* .Box */ .xu, {
      as: "main",
      children: [(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__/* .jsx */ .tZ)(theme_ui__WEBPACK_IMPORTED_MODULE_2__/* .Heading */ .X6, {
        children: "404: Not Found"
      }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__/* .jsx */ .tZ)(theme_ui__WEBPACK_IMPORTED_MODULE_2__/* .Text */ .xv, {
        children: "You just hit a route that doesn't exist"
      })]
    })]
  });
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (NotFoundPage);

/***/ })

};
;
//# sourceMappingURL=component---src-pages-404-tsx.js.map