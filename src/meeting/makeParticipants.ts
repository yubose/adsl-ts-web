import _ from 'lodash'
import { RemoteParticipant, LocalParticipant, Room } from 'twilio-video'
import { Draft } from 'immer'
import { cadl } from 'app/client'
import makeDominantSpeaker, { DominantSpeaker } from './makeDominantSpeaker'

export type AppParticipants = ReturnType<typeof makeParticipants>

export interface ParticipantsState {
  primary: RemoteParticipant | null
  secondary: RemoteParticipant[]
}

export interface MakeParticipantsOptions {
  handleWaitingOthersMessage(
    participants:
      | Map<string, LocalParticipant | RemoteParticipant>
      | Array<LocalParticipant | RemoteParticipant>
      | ParticipantsState,
    delay?: number,
  ): void
  room: Room
}

function makeParticipants({
  handleWaitingOthersMessage,
  room,
}: MakeParticipantsOptions) {
  let _state: ParticipantsState = {
    primary: null,
    secondary: [],
  }

  makeDominantSpeaker({ room })
    .listen()
    .on('onChange', (prevDominantSpeaker, nextDominantSpeaker) => {
      // Synchronize the state whenever dominant speaker has changed
      if (nextDominantSpeaker) {
        _setState((prevState) => {
          if (nextDominantSpeaker !== prevState.primary) {
            const nextState = _getStateByPrimaryInsert(
              prevState,
              nextDominantSpeaker,
            )
            if (nextState) {
              console.log(
                `%c[makeParticipants.ts][dominantSpeaker.onChange] ` +
                  ' An update to the state occurred because the dominant speaker was changed',
                `color:cyan;font-weight:bold;`,
                {
                  prevDominantSpeaker,
                  nextDominantSpeaker,
                  prevState,
                  nextState,
                },
              )
              _updateSdk(nextState)
              return nextState
            }
          }
          return prevState
        })
      }
    })

  function _setState(
    setState: (prevState: ParticipantsState) => ParticipantsState | undefined,
  ) {
    const newState = setState(_state)
    if (newState) {
      _state = { ..._state, ...newState }
      _synchronizeState(_state)
      console.log(
        `%c[makeParticipants.ts][_setState] State update`,
        `color:cyan;font-weight:bold;`,
        _state,
      )
    }
  }
  /** 
    Keeps the primary participant away from being included in the
    secondary participants list 
  */
  function _synchronizeState(state: ParticipantsState) {
    const participant = _.find(
      state.secondary,
      (participant) => participant === state.primary,
    )
    if (participant) {
      _setState(() => ({
        primary: state.primary,
        secondary: state.secondary.filter((p) => p !== participant),
      }))
    }
  }

  function _getStateByInsert(
    currentState: ParticipantsState,
    participant: RemoteParticipant,
  ): ParticipantsState | undefined {
    // The participant is new and is not in our local state
    if (currentState) {
      if (
        participant !== currentState.primary &&
        !currentState.secondary.includes(participant)
      ) {
        if (!currentState.primary) {
          if (currentState.secondary.length) {
            const nextSecondary = [...currentState.secondary]
            const nextPrimary = nextSecondary.shift()
            nextSecondary.push(participant)
            return {
              primary: nextPrimary || null,
              secondary: nextSecondary,
            }
          } else {
            return {
              primary: participant,
              secondary: [],
            }
          }
        } else {
          return {
            primary: currentState.primary,
            secondary: [...currentState.secondary, participant],
          }
        }
      }
    }
  }

  function _getStateByPrimaryInsert(
    currentState: ParticipantsState,
    primary: DominantSpeaker,
  ): ParticipantsState | undefined {
    if (currentState) {
      if (currentState.primary === primary) {
        return currentState
      }
      // Only proceed if the primary to be used is a real participant
      if (primary) {
        const nextSecondary = []
        if (currentState.primary) {
          nextSecondary.push(currentState.primary)
        }
        nextSecondary.push(...currentState.secondary)
        // @ts-expect-error
        const index = nextSecondary.indexOf(primary)
        if (index !== -1) {
          nextSecondary.splice(index, 1)
        }
        return {
          primary: primary as RemoteParticipant,
          secondary: nextSecondary,
        }
      }
    }
  }

  function _updateSdk(value: ParticipantsState) {
    // Update the internal values in SDK
    cadl.editDraft((d: Draft<any>) => {
      if (!d.VideoChat) {
        d['VideoChat'] = {}
      }
      if (!d.VideoChat.listData) {
        d.VideoChat['listData'] = {}
      }
      d.VideoChat.listData['participants'] = [value.primary].concat(
        value.secondary,
      )
    })
  }

  function _onParticipantConnected(
    participant: LocalParticipant | RemoteParticipant,
  ) {
    let logMsg = ''
    // The "selfStream" NOODL component is already being used for the local participant
    // So we can skip them here so we don't have the user viewing 2 duplicate screens of themselves
    if (participant !== room?.localParticipant) {
      logMsg =
        `%c[makeParticipants.ts][_onParticipantConnected] ` +
        'Remote participant connected'
      console.log(logMsg, `color:cyan;font-weight:bold;`, { room, participant })
      o.addParticipant(participant as RemoteParticipant)
      handleWaitingOthersMessage(room.participants)
    } else {
      logMsg = `%c[makeParticipants.ts][_onParticipantConnected] Local participant connected`
      console.log(logMsg, `color:cyan;font-weight:bold;`, { room, participant })
    }
  }

  function _onParticipantDisconnected(participant: RemoteParticipant) {
    const logMsg =
      `%c[makeParticipants.ts][_onParticipantDisconnected] ` +
      'Participant disconnected'
    console.log(logMsg, `color:cyan;font-weight:bold;`, { room, participant })
    o.removeParticipant(participant)
    handleWaitingOthersMessage(room.participants)
  }

  const o = {
    /**
     * Adds the participant to the local state if it doesn't already exist
     * @param { RemoteParticipant } participant
     */
    addParticipant(participant: RemoteParticipant) {
      if (participant) {
        _setState((prevState) => {
          const nextState = _getStateByInsert(prevState, participant)
          if (nextState) {
            console.log(
              `%c[makeParticipants.ts][addParticipant] Updating state from adding participant`,
              `color:cyan;font-weight:bold;`,
              { participant, prevState, nextState },
            )
            _updateSdk(nextState)
            return nextState
          }
          return prevState
        })
      } else {
        console.log(
          `%c[makeParticipants.ts][addParticipant] Tried to add a participant but it was null or undefined`,
          `color:cyan;font-weight:bold;`,
          participant,
        )
      }
    },
    /**
     * Removes the participant from primary/secondary if it exists
     * @param { RemoteParticipant } participant
     */
    removeParticipant(participant: RemoteParticipant) {
      if (participant) {
        _setState((prevState) => {
          let nextState

          // If the participant is currently the dominant speaker
          if (participant === prevState.primary) {
            const nextPrimary = prevState.secondary?.[0] || null
            nextState = {
              primary: nextPrimary,
              secondary: nextPrimary ? prevState.secondary.slice(1) : [],
            }
          }
          // Else if they are not, and they are still in the other participants list
          else if (prevState.secondary.includes(participant)) {
            if (!prevState.primary) {
              let nextSecondary = [...prevState.secondary]

              const participantIndex = nextSecondary.indexOf(participant)

              nextSecondary.splice(participantIndex, 1)

              if (nextSecondary.length) {
                if (nextSecondary.length > 1) {
                  nextState = {
                    primary: nextSecondary[0],
                    secondary: nextSecondary.slice(1),
                  }
                } else {
                  nextState = {
                    primary: nextSecondary[0],
                    secondary: [],
                  }
                }
              } else {
                nextState = {
                  primary: prevState.primary,
                  secondary: nextSecondary,
                }
              }
            }
          }
          if (nextState) {
            _updateSdk(nextState)
            console.log(
              `%c[makeParticipants.ts][removeParticipant] Updating state from removing participant`,
              `color:cyan;font-weight:bold;`,
              { participant, prevState, nextState },
            )
          }
          return nextState || prevState
        })
      } else {
        console.log(
          `%c[makeParticipants.ts][removeParticipant] Tried to remove a participant but the participant is null or undefined`,
          `color:cyan;font-weight:bold;`,
          participant,
        )
      }
    },
    listen() {
      room.on('participantConnected', _onParticipantConnected)
      room.on('participantDisconnected', _onParticipantDisconnected)
    },
    unlisten() {
      room.off('participantConnected', _onParticipantConnected)
      room.off('participantDisconnected', _onParticipantDisconnected)
    },
  }

  window.addParticipant = o.addParticipant
  window.removeParticipant = o.removeParticipant
  window.participants = _state

  return o
}

export default makeParticipants
