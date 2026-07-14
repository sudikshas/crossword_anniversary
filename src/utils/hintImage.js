export function getHintImagePath(hintImage) {
  if (!hintImage) return null
  const filename = hintImage.split('/').pop()
  return `/hint_photos/${filename}`
}
