const observer = new MutationObserver((mutations) => {
  console.log(mutations)
})

const root = document.createElement('div')
root.id = 'root'

const btn = document.createElement('button')

root.appendChild(btn)
document.body.appendChild(root)

observer.observe(btn, {
  attributes: true,
  childList: true,
  characterData: true,
  attributeOldValue: true,
  // attributeFilter: true,
  subtree: true,
  characterDataOldValue: true,
})

const input = document.createElement('input')

btn.appendChild(input)

btn.onclick = () => {
  btn.style.width = '200px'
  btn.dataset.key = 'formData.greeting'
}
