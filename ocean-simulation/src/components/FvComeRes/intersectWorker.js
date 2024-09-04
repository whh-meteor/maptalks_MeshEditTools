self.onmessage = function (event) {
  const { layer1, layer2 } = event.data
  const intersection = turf.intersect(layer1, layer2)
  self.postMessage(intersection)
}
