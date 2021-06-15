
import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';
export default [
{
  path: '/',
  component: ComponentCreator('/','deb'),
  exact: true,
},
{
  path: '/__docusaurus/debug',
  component: ComponentCreator('/__docusaurus/debug','3d6'),
  exact: true,
},
{
  path: '/__docusaurus/debug/config',
  component: ComponentCreator('/__docusaurus/debug/config','914'),
  exact: true,
},
{
  path: '/__docusaurus/debug/content',
  component: ComponentCreator('/__docusaurus/debug/content','c28'),
  exact: true,
},
{
  path: '/__docusaurus/debug/globalData',
  component: ComponentCreator('/__docusaurus/debug/globalData','3cf'),
  exact: true,
},
{
  path: '/__docusaurus/debug/metadata',
  component: ComponentCreator('/__docusaurus/debug/metadata','31b'),
  exact: true,
},
{
  path: '/__docusaurus/debug/registry',
  component: ComponentCreator('/__docusaurus/debug/registry','0da'),
  exact: true,
},
{
  path: '/__docusaurus/debug/routes',
  component: ComponentCreator('/__docusaurus/debug/routes','244'),
  exact: true,
},
{
  path: '/markdown-page',
  component: ComponentCreator('/markdown-page','be1'),
  exact: true,
},
{
  path: '/docs',
  component: ComponentCreator('/docs','7de'),
  
  routes: [
{
  path: '/docs/actions',
  component: ComponentCreator('/docs/actions','a9f'),
  exact: true,
},
{
  path: '/docs/api/actions',
  component: ComponentCreator('/docs/api/actions','235'),
  exact: true,
},
{
  path: '/docs/api/unit_tests',
  component: ComponentCreator('/docs/api/unit_tests','558'),
  exact: true,
},
{
  path: '/docs/builtIns',
  component: ComponentCreator('/docs/builtIns','6ce'),
  exact: true,
},
{
  path: '/docs/installation',
  component: ComponentCreator('/docs/installation','b2a'),
  exact: true,
},
{
  path: '/docs/notifications',
  component: ComponentCreator('/docs/notifications','e6a'),
  exact: true,
},
{
  path: '/docs/usage',
  component: ComponentCreator('/docs/usage','184'),
  exact: true,
},
]
},
{
  path: '*',
  component: ComponentCreator('*')
}
];
