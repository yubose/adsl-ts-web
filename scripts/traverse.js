/**
 * @argument { HTMLElement[] } elements
 * @argument { HTMLElement } el
 * @returns { HTMLElement[] }
 */
function getTreeBF(elements = [], el) {
  const children = [...el.children]
  const numChildren = children.length

  for (let index = 0; index < numChildren; index++) {
    let childNode = children[index]
    let sibling = childNode.nextElementSibling

    elements.push(childNode)

    while (sibling) {
      elements.push(sibling)
      sibling = sibling.nextElementSibling
    }
  }

  return elements
}

function bfs() {
  const nodesToVisit = []
  const visitedNodes = []
  nodes.push(document.getElementsByClassName('a')[0])
  const log = document.getElementById('results')
  while (nodesToVisit.length > 0) {
    let currentNode = nodesToVisit.shift() // from the front!
    if (currentNode && !visitedNodes.includes(currentNode)) {
      visitedNodes.push(currentNode)

      if (currentNode.nodeType == 1) {
        let logItem = document.createElement('p')
        let logText = document.createTextNode(currentNode.className)
        logItem.appendChild(logText)
        log.appendChild(logItem)
      }
      ;[].slice.call(currentNode.childNodes).forEach(function (node) {
        nodesToVisit.push(node)
      })
    }
  }
}
