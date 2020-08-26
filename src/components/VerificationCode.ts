import _ from 'lodash'
import BaseComponent from 'components/BaseComponent'

export interface VerificationCodeOnSubmit {
  (e: Event): any
}

export interface VerificationCodeOnCancel<E = any> {
  (e?: E): any
}

class VerificationCode extends BaseComponent {
  private _hiddenInput: HTMLInputElement
  public submitForm: HTMLFormElement
  public cancelButton: HTMLButtonElement
  public submitButton: HTMLButtonElement
  public title: HTMLHeadingElement
  public verificationCodeInput: HTMLInputElement
  public actionsContainer: HTMLDivElement

  constructor({
    onSubmit,
    onCancel,
  }: {
    onSubmit?: VerificationCodeOnSubmit
    onCancel?: VerificationCodeOnCancel
  } = {}) {
    super({ node: document.createElement('div') })
    this._hiddenInput = document.createElement('input')
    this.submitForm = document.createElement('form')
    this.submitButton = document.createElement('button')
    this.cancelButton = document.createElement('button')
    this.title = document.createElement('h6')
    this.verificationCodeInput = document.createElement('input')
    this.actionsContainer = document.createElement('div')

    this._hiddenInput['name'] = 'verificationCode'
    this._hiddenInput.dataset['key'] = 'verificationCode'
    this._hiddenInput.dataset['name'] = 'verificationCode'
    this._hiddenInput.style['visibility'] = 'hidden'
    this._hiddenInput.hidden = true

    this.submitForm.style['margin'] = '10px 0'
    if (onSubmit) {
      this.submitForm.onsubmit = onSubmit
    }

    this.verificationCodeInput.id = 'verificationCodeTextField'
    this.verificationCodeInput.name = 'verificationCodeTextField'
    this.verificationCodeInput.style['width'] = '100%'
    this.verificationCodeInput.required = true
    this.verificationCodeInput.autofocus = true

    this.submitButton.type = 'submit'
    this.submitButton.innerText = 'Submit'

    this.cancelButton.type = 'button'
    this.cancelButton.innerText = 'Cancel'
    if (onCancel) {
      this.cancelButton.addEventListener('click', onCancel)
    }

    this.actionsContainer.style['justifyContent'] = 'center'

    this.submitForm.appendChild(this.verificationCodeInput)
    this.submitForm.appendChild(this.actionsContainer)
    this.actionsContainer.appendChild(this.cancelButton)
    this.actionsContainer.appendChild(this.submitButton)
  }

  public submit() {
    this.submitForm.submit()
    return this
  }

  public cancel() {
    this.onCancel()
    return this
  }

  public set onSubmit(onSubmit: VerificationCodeOnSubmit) {
    this.onSubmit = onSubmit
  }

  public set onCancel(onCancel: VerificationCodeOnCancel) {
    this.onCancel = onCancel
  }
}

export default VerificationCode
