import CesiumWind from './cesium-wind.esm'

 function createWindLayer(data, viewer) {
    const windOptions = {
      colorScale: [...],
      frameRate: 16,
      maxAge: 60,
      globalAlpha: 0.9,
      velocityScale: 1 / 30,
      paths: 2000
    }
    const windLayer = new CesiumWind(data, { windOptions })
    windLayer.addTo(viewer)
  }


  export default createWindLayer