function display(
  container: HTMLElement,
  el?: HTMLElement,
): Promise<HTMLDivElement> {
  return new Promise((resolve, reject) => {
    if (!el) {
      el = container
      container = document.body
    }
    const div = document.createElement('div')
    div.style.position = 'fixed'
    div.style.top = '0'
    div.style.right = '0'
    div.style.bottom = '0'
    div.style.left = '0'
    div.style.width = '100%'
    div.style.height = '100%'
    div.style.display = 'flex'
    div.style.justifyContent = 'center'
    div.style.alignContent = 'center'
    div.style.zIndex = '99999999'
    if (el instanceof HTMLCanvasElement) {
      const image = new Image()
      image.src = el.toDataURL()
      image.style.margin = 'auto'
      image.style.textAlign = 'center'
      image.style.border = '1px solid tomato'
      image.onload = () => {
        resolve(div)
      }
      image.onerror = (error) => {
        const err = error instanceof Error ? error : new Error(String(error))
        console.error(err)
        div.click()
        reject(err)
      }
      div.appendChild(image)
    } else {
      div.appendChild(el)
      const box = document.createElement('div')
      box.style.margin = 'auto'
      box.style.textAlign = 'center'
      box.style.border = '1px solid tomato'

      box.appendChild(el)
      resolve(div)
    }

    const onClick = () => {
      container.removeChild(div)
      div.removeEventListener('click', onClick)
    }
    div.addEventListener('click', onClick)
    container.appendChild(div)
  })
}

export default display
