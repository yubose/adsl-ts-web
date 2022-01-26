module.exports = [{
      plugin: require('../node_modules/gatsby-plugin-image/gatsby-browser.js'),
      options: {"plugins":[]},
    },{
      plugin: require('../../gatsby-noodl-plugin/gatsby-browser.js'),
      options: {"plugins":[],"config":"www","loglevel":"debug","path":"C:/Users/Chris/aitmed-noodl-web/packages/homepage/output","template":"C:/Users/Chris/aitmed-noodl-web/packages/homepage/src/templates/page.tsx","viewport":{"width":1024,"height":768}},
    },{
      plugin: require('../node_modules/gatsby-plugin-manifest/gatsby-browser.js'),
      options: {"plugins":[],"name":"AiTmed Homepage","short_name":"AiTmed","start_url":"/","background_color":"#663399","display":"minimal-ui","icon":"src/resources/images/logo.png","legacy":true,"theme_color_in_head":true,"cache_busting_mode":"query","crossOrigin":"anonymous","include_favicon":true,"cacheDigest":"b1515d058b0ca329c15ff1780f733c1c"},
    },{
      plugin: require('../gatsby-browser.js'),
      options: {"plugins":[]},
    }]
