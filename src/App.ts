function component() {
  const element = document.createElement("div");

  // Lodash, currently included via a script, is required for this line to work
  element.innerHTML = "Hello!";

  return element;
}

const t: string = 5;

document.body.appendChild(component());
