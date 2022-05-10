# `@noodl/core`

> Zero dependency JavaScript NOODL library to assist with building the next generation of Telemedicine applications in eCOS

## Usage

```
const noodl = require('@noodl/core');

const componentObject = {
  type: 'label',
  style: {
    textAlign: {
      x: 'centerX',
      y: 'center',
    },
    shadow: 'true'
  }
}

const root = {
  SignIn: {
    formData: { email: 'pf@gmail.com' },
    theme: {
      fontSize: '1.4vh',
    }
  }
}

const component = noodl.transform(componentObject, {
  root,
  rootKey: 'SignIn',
  viewport: {
    width: 375,
    height: 667,
  },
})

console.log(component)
```

Result:

```json
{
  "type": "label",
  "style": {}
}
```
