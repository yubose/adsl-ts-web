export default {
  "title": "noodl-ui-dom",
  "tagline": "NOODL",
  "url": "https://aitmed.com",
  "baseUrl": "/",
  "onBrokenLinks": "throw",
  "onBrokenMarkdownLinks": "warn",
  "favicon": "img/favicon.ico",
  "organizationName": "noodl",
  "projectName": "NOODL",
  "themeConfig": {
    "navbar": {
      "title": "noodl-ui-dom",
      "logo": {
        "alt": "My Site Logo",
        "src": "img/logo.svg"
      },
      "items": [
        {
          "type": "doc",
          "docId": "installation",
          "position": "left",
          "label": "Installation",
          "activeSidebarClassName": "navbar__link--active"
        },
        {
          "type": "doc",
          "docId": "usage",
          "label": "Usage",
          "position": "left",
          "activeSidebarClassName": "navbar__link--active"
        },
        {
          "href": "#",
          "label": "noodl",
          "position": "right"
        }
      ],
      "hideOnScroll": false
    },
    "footer": {
      "style": "dark",
      "links": [
        {
          "title": "API",
          "items": [
            {
              "label": "Installation",
              "to": "/docs/installation"
            },
            {
              "label": "Usage",
              "to": "/docs/usage"
            },
            {
              "label": "Reference",
              "to": "/docs/api"
            }
          ]
        },
        {
          "title": "Community",
          "items": [
            {
              "label": "Website",
              "href": "https://aitmed.com"
            },
            {
              "label": "Linkedin",
              "href": "https://www.linkedin.com/company/aitmed/"
            },
            {
              "label": "Pinterest",
              "href": "https://www.pinterest.com/aitmedinc/"
            }
          ]
        },
        {
          "title": "More",
          "items": [
            {
              "label": "GitLab",
              "href": "#"
            }
          ]
        }
      ],
      "copyright": "Copyright © 2021 noodl-ui-dom, Inc."
    },
    "colorMode": {
      "defaultMode": "light",
      "disableSwitch": false,
      "respectPrefersColorScheme": false,
      "switchConfig": {
        "darkIcon": "🌜",
        "darkIconStyle": {},
        "lightIcon": "🌞",
        "lightIconStyle": {}
      }
    },
    "docs": {
      "versionPersistence": "localStorage"
    },
    "metadatas": [],
    "prism": {
      "additionalLanguages": []
    },
    "hideableSidebar": false
  },
  "presets": [
    [
      "@docusaurus/preset-classic",
      {
        "docs": {},
        "blog": {
          "showReadingTime": true
        },
        "theme": {
          "customCss": "/Users/christ/aitmed-noodl-web-copy/packages/docs/src/css/custom.css"
        }
      }
    ]
  ],
  "baseUrlIssueBanner": true,
  "i18n": {
    "defaultLocale": "en",
    "locales": [
      "en"
    ],
    "localeConfigs": {}
  },
  "onDuplicateRoutes": "warn",
  "customFields": {},
  "plugins": [],
  "themes": [],
  "titleDelimiter": "|",
  "noIndex": false
};