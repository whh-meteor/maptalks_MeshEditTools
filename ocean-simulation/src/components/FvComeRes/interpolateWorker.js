self.onmessage = function (event) {
  const { meshNodes, interpolate_options } = event.data
  const grid = turf.interpolate(meshNodes, 0.05, interpolate_options)
  self.postMessage(grid)
}
