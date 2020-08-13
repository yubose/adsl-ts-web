// Giving color codes according to the feature that represents a certain stream
// Ex: rooms = #e50087
// This is to have an easier time debugging with console messages
export const color = {
  room: '#e50087',
  mainStream: '#e50087',
  remoteParticipant: '#B520CB',
  localParticipant: '#3852D8',
  selfStream: '#14BDAC',
  localStream: '#759000',
  other: '#B7771F',
}

/**
 * Retrieves a matching color code for the value passed in that should represent a certain stream
 * If it does not find a matching color code it will return color.other as the fallback color
 * @param { string } from - The name of twilio feature that represents a certain stream
 * @return { string }
 */
export function getColorFrom(from: string) {
  const colorKeys = Object.keys(color)
  const regex = new RegExp(from, 'i')
  for (let index = 0; index < colorKeys.length; index++) {
    const colorKey = colorKeys[index]
    if (regex.test(colorKey)) {
      return color[colorKey as keyof typeof color]
    }
  }
  return color.other
}
