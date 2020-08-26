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
  private _timer: number = 0
  private _timeoutRef: NodeJS.Timeout | undefined
  private _intervalRef: any
  public submitFormNode: HTMLFormElement
  public cancelBtnNode: HTMLButtonElement
  public submitBtnNode: HTMLButtonElement
  public titleNode: HTMLHeadingElement
  public verificationCodeInput: HTMLInputElement
  public actionsContainer: HTMLDivElement

  constructor({
    onSubmit,
    onCancel,
    onUnload,
  }: {
    onSubmit?: VerificationCodeOnSubmit
    onCancel?: VerificationCodeOnCancel
    onUnload?(): void
  } = {}) {
    super({ node: document.createElement('div') })

    this._timeoutRef = undefined
    this._intervalRef = undefined

    this._hiddenInput = document.createElement('input')
    this.submitFormNode = document.createElement('form')
    this.submitBtnNode = document.createElement('button')
    this.cancelBtnNode = document.createElement('button')
    this.titleNode = document.createElement('h6')
    this.verificationCodeInput = document.createElement('input')
    this.actionsContainer = document.createElement('div')

    this._hiddenInput['name'] = 'verificationCode'
    this._hiddenInput.dataset['key'] = 'verificationCode'
    this._hiddenInput.dataset['name'] = 'verificationCode'
    this._hiddenInput.style['visibility'] = 'hidden'
    this._hiddenInput.hidden = true

    this.submitFormNode.style['margin'] = '10px 0'
    if (onSubmit) {
      this.submitFormNode.onsubmit = onSubmit
    }

    this.verificationCodeInput.id = 'verificationCodeTextField'
    this.verificationCodeInput.name = 'verificationCodeTextField'
    this.verificationCodeInput.style['width'] = '100%'
    this.verificationCodeInput.required = true
    this.verificationCodeInput.autofocus = true

    this.submitBtnNode.type = 'submit'
    this.submitBtnNode.innerText = 'Submit'

    this.cancelBtnNode.type = 'button'
    this.cancelBtnNode.innerText = 'Cancel'
    if (onCancel) {
      this.cancelBtnNode.addEventListener('click', onCancel)
    }

    this.actionsContainer.style['justifyContent'] = 'center'

    this.submitFormNode.appendChild(this.verificationCodeInput)
    this.submitFormNode.appendChild(this.actionsContainer)
    this.actionsContainer.appendChild(this.cancelBtnNode)
    this.actionsContainer.appendChild(this.submitBtnNode)

    const onInputChange = (e: any) => {
      if (e.target?.value) {
        if (`${e.target.value}`.length > 6) {
          this.verificationCodeInput.value = `${e.target.value}`.substring(0, 6)
        }
      }
    }

    this.node.addEventListener('unload', () => {
      const logMsg = `%c[VerificationCode.tsx][constructor - Event: unload] Cleaning up listeners`
      const logStyle = `color:#3498db;font-weight:bold;`
      console.log(logMsg, logStyle)
      this.clearTimer()
      onUnload?.()
      this.verificationCodeInput.removeEventListener('change', onInputChange)
    })

    this.verificationCodeInput.addEventListener('change', onInputChange)
  }

  public submit() {
    this.submitFormNode.submit()
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

  public startTimer() {
    if (this._timer > 0) {
      // Start the interval
      this._intervalRef = setInterval(() => {
        this._timer -= 1000
      }, 1000)

      // Start the timeout
      this._timeoutRef = setTimeout(() => {
        clearInterval(this._intervalRef)
      }, this.getInitialTimer(this._timer))
    }
  }

  public clearTimer() {
    if (this._intervalRef) clearInterval(this._intervalRef)
    if (this._timeoutRef) clearTimeout(this._timeoutRef)
  }

  /**
   * Returns the initial timer in milliseconds
   * @param { number? } initialTimer - Initial timer in seconds
   */
  public getInitialTimer(initialTimer?: number) {
    if (_.isNumber(initialTimer)) {
      if (initialTimer > 0) {
        return initialTimer * 1000
      }
    }
    return 0
  }
}

export default VerificationCode
