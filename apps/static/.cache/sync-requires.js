
// prefer default export if available
const preferDefault = m => (m && m.default) || m


exports.components = {
  "component---src-pages-404-tsx": preferDefault(require("C:\\Users\\Chris\\aitmed-noodl-web\\apps\\static\\src\\pages\\404.tsx")),
  "component---src-pages-index-tsx": preferDefault(require("C:\\Users\\Chris\\aitmed-noodl-web\\apps\\static\\src\\pages\\index.tsx")),
  "component---src-pages-introspection-tsx": preferDefault(require("C:\\Users\\Chris\\aitmed-noodl-web\\apps\\static\\src\\pages\\introspection.tsx")),
  "component---src-templates-page-tsx": preferDefault(require("C:\\Users\\Chris\\aitmed-noodl-web\\apps\\static\\src\\templates\\page.tsx"))
}

