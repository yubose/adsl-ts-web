function getConstrainedImageSize(
  ratio: number,
  maxW: number,
  maxH: number,
  w: number,
) {
  if (ratio > 1) return { width: maxW * ratio, height: maxH / ratio }
  if (ratio === 1) return { width: maxW, height: maxH }
  return { width: maxW, height: w / ratio }
}

export default getConstrainedImageSize
