export default {
  "title": "noodl-builder",
  "tagline": "Noodl",
  "url": "https://aitmed.com",
  "baseUrl": "/",
  "onBrokenLinks": "throw",
  "onBrokenMarkdownLinks": "warn",
  "favicon": "img/favicon.ico",
  "organizationName": "noodl",
  "projectName": "noodl-builder",
  "themeConfig": {
    "navbar": {
      "title": "noodl-builder",
      "logo": {
        "alt": "AiTmed Logo",
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
      "copyright": "Copyright © 2022 noodl-builder, Inc."
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
          "customCss": "/Users/christ/aitmed-noodl-web/packages/docs/src/css/custom.css"
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