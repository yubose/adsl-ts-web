import _ from 'lodash'
import NOODLElement from 'components/NOODLElement'

export interface VerificationCodeOnSubmit {
  (e: Event): any
}

export interface VerificationCodeOnCancel<E = any> {
  (e?: E): any
}

class VerificationCode extends NOODLElement {
  private _timer: number = 0
  private _timeoutRef: NodeJS.Timeout | undefined
  private _intervalRef: any
  public refs: {
    _hiddenInput: HTMLInputElement
    form: HTMLFormElement
    submitButton: HTMLButtonElement
    cancelButton: HTMLButtonElement
    title: HTMLHeadingElement
    verificationCode: HTMLInputElement
    actionsContainer: HTMLDivElement
  }

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

    this.refs = {
      _hiddenInput: document.createElement('input'),
      form: document.createElement('form'),
      submitButton: document.createElement('button'),
      cancelButton: document.createElement('button'),
      title: document.createElement('h6'),
      verificationCode: document.createElement('input'),
      actionsContainer: document.createElement('div'),
    }

    this.refs._hiddenInput['name'] = 'verificationCode'
    this.refs._hiddenInput.dataset['key'] = 'verificationCode'
    this.refs._hiddenInput.dataset['name'] = 'verificationCode'
    this.refs._hiddenInput.style['visibility'] = 'hidden'
    this.refs._hiddenInput.hidden = true

    this.refs.form.style['margin'] = '10px 0'

    this.refs.verificationCode.id = 'verificationCodeTextField'
    this.refs.verificationCode.name = 'verificationCodeTextField'
    this.refs.verificationCode.style['width'] = '100%'
    this.refs.verificationCode.required = true
    this.refs.verificationCode.autofocus = true

    this.refs.submitButton.type = 'submit'
    this.refs.submitButton.innerText = 'Submit'

    this.refs.cancelButton.type = 'button'
    this.refs.cancelButton.innerText = 'Cancel'

    this.refs.actionsContainer.style['justifyContent'] = 'center'

    if (onSubmit) {
      this.refs.form.addEventListener('submit', onSubmit)
    }

    if (onCancel) {
      this.refs.cancelButton.addEventListener('click', onCancel)
    }

    this.refs.form.appendChild(this.refs.verificationCode)
    this.refs.form.appendChild(this.refs.actionsContainer)
    this.refs.actionsContainer.appendChild(this.refs.cancelButton)
    this.refs.actionsContainer.appendChild(this.refs.submitButton)

    const onInputChange = (e: any) => {
      if (e.target?.value) {
        if (`${e.target.value}`.length > 6) {
          this.refs.verificationCode.value = `${e.target.value}`.substring(0, 6)
        }
      }
    }

    this.node.addEventListener('unload', () => {
      const logMsg = `%c[VerificationCode.tsx][constructor - Event: unload] Cleaning up listeners`
      const logStyle = `color:#3498db;font-weight:bold;`
      console.log(logMsg, logStyle)
      this.clearTimer()
      onUnload?.()
      this.refs.verificationCode.removeEventListener('change', onInputChange)
    })

    this.refs.verificationCode.addEventListener('change', onInputChange)
  }

  public submit() {
    this.refs.form.submit()
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
