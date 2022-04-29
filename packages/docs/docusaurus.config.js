/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'noodl-builder',
  tagline: 'Noodl',
  url: 'https://aitmed.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'noodl',
  projectName: 'noodl-builder',
  themeConfig: {
    navbar: {
      title: 'noodl-builder',
      logo: {
        alt: 'AiTmed Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'installation',
          position: 'left',
          label: 'Installation',
        },
        { type: 'doc', docId: 'usage', label: 'Usage', position: 'left' },
        // {
        //   type: 'doc',
        //   categoryId: 'api',
        //   label: 'API Reference',
        //   position: 'left',
        // },
        {
          href: '#',
          label: 'noodl',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'API',
          items: [
            {
              label: 'Installation',
              to: '/docs/installation',
            },
            {
              label: 'Usage',
              to: '/docs/usage',
            },
            {
              label: 'Reference',
              to: '/docs/api',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Website',
              href: 'https://aitmed.com',
            },
            {
              label: 'Linkedin',
              href: 'https://www.linkedin.com/company/aitmed/',
            },
            {
              label: 'Pinterest',
              href: 'https://www.pinterest.com/aitmedinc/',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitLab',
              href: '#',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} noodl-builder, Inc.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          // sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // editUrl:
          // 'https://github.com/facebook/docusaurus/edit/master/website/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // editUrl:
          // 'https://github.com/facebook/docusaurus/edit/master/website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
}
