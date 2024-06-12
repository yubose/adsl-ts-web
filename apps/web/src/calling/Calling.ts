import App from '../App'
import { EventEmitter } from 'events'
import { Device } from '@twilio/voice-sdk'
import log from '../log'
import { toast } from '../utils/dom'
import { Calling } from '../app/types'
const createCallingFns = function _createCallingFns(app: App) {
  let _call = new EventEmitter() as any & { _isMock?: boolean }
  let _calledOnConnected = false
  let device

  async function _createCall(token: string, from: string, to: string) {
    device = new Device(token)
    let call = await device.connect({
      params: {
        to: to,
        from,
      },
    })
    return call
  }

  async function onConnected(call: Calling['call']) {
    function disconnect(payload) {
      app.register.emit('onDisconnect')
      log.debug('disconnect', payload)
    }
    function ringing(payload) {
      log.debug('ringing', payload)
    }
    function accept(payload) {
      app.register.emit('onRecord')
      log.debug('accept', payload)
    }
    function cancel(payload) {
      log.debug('cancel', payload)
    }
    function reject(payload) {
      log.debug('reject', payload)
    }
    call.removeAllListeners()

    call.on('disconnect', disconnect)
    call.on('accept', accept)
    call.on('cancel', cancel)
    call.on('reject', reject)
    call.off('ringing', ringing)
  }

  const o = {
    get calledOnConnected() {
      return !!_calledOnConnected
    },
    set calledOnConnected(called: boolean) {
      _calledOnConnected = called
    },
    get call() {
      return _call
    },
    set call(call) {
      _call = call
    },
    async join(token: string, from: string, to: string) {
      try {
        if (_call) {
          _call = await _createCall(token, from, to)
        } else {
          o.calledOnConnected && o.leave()
          _call = await _createCall(token, from, to)
        }
        log.debug(`joining room`, _call)
        await onConnected(_call)
        o.calledOnConnected = true
        return _call
      } catch (error) {
        log.error(error)
        toast(
          //@ts-expect-error
          (error instanceof Error ? error : new Error(String(error['reason'])))
            .message,
          { type: 'error' },
        )
      }
    },
    leave() {
      log.error(`LEAVING MEETING ROOM`)
      if (this.calledOnConnected) {
        _call.disconnect()
        _call.removeAllListeners()
        device.destroy()
        o.calledOnConnected = false
        o.reset()
      }
      return this
    },
    reset(key?: 'call' | 'streams') {
      if (key) {
        key === 'call' && (_call = new EventEmitter())
        // key === 'streams' && (_streams = new Streams())
      } else {
        _call = null
        // _streams = new Streams()
      }
      return this
    },
  }

  return o
}

export default createCallingFns
