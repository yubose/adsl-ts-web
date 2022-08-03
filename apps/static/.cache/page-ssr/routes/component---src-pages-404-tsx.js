"use strict";
exports.id = "component---src-pages-404-tsx";
exports.ids = ["component---src-pages-404-tsx"];
exports.modules = {

/***/ "./src/components/Seo.tsx":
/*!********************************!*\
  !*** ./src/components/Seo.tsx ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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

/***/ "./src/pages/404.tsx":
/*!***************************!*\
  !*** ./src/pages/404.tsx ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var theme_ui__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! theme-ui */ "./node_modules/@theme-ui/components/dist/theme-ui-components.esm.js");
/* harmony import */ var _components_Seo__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../components/Seo */ "./src/components/Seo.tsx");
/* harmony import */ var _emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @emotion/react/jsx-runtime */ "./node_modules/@emotion/react/jsx-runtime/dist/emotion-react-jsx-runtime.esm.js");







function NotFoundPage() {
  return (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.Fragment, {
    children: [(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_components_Seo__WEBPACK_IMPORTED_MODULE_1__["default"], {
      title: "404: Not found"
    }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(theme_ui__WEBPACK_IMPORTED_MODULE_3__.Box, {
      as: "main",
      children: [(0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(theme_ui__WEBPACK_IMPORTED_MODULE_3__.Heading, {
        children: "404: Not Found"
      }), (0,_emotion_react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(theme_ui__WEBPACK_IMPORTED_MODULE_3__.Text, {
        children: "You just hit a route that doesn't exist"
      })]
    })]
  });
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (NotFoundPage);

/***/ }),

/***/ "./public/page-data/sq/d/2582528629.json":
/*!***********************************************!*\
  !*** ./public/page-data/sq/d/2582528629.json ***!
  \***********************************************/
/***/ ((module) => {

module.exports = JSON.parse('{"data":{"site":{"siteMetadata":{"siteName":"AiTmed","siteTitle":"AiTmed | Start your E-health Journey Anywhere, Anytime","siteDescription":"Anyone, Anywhere, Anytime Start Your E-health Journey With Us","siteLogo":"https://public.aitmed.com/cadl/www3.83/assets/aitmedLogo.png","siteUrl":"https://aitmed.com","siteVideo":"https://public.aitmed.com/commonRes/video/aitmed228FromBlair11192020.mp4"}}}}');

/***/ })

};
;
//# sourceMappingURL=component---src-pages-404-tsx.js.map