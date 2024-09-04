import * as dat from 'dat.gui'
import * as Cesium from 'cesium'

let viewer = window.viewer
async function LoadGeologicalLayer(url, offset, scale, ColorSurface) {
  const viewer = window.viewer
  const response = await fetch(url)
  const geojson = await response.json()
  const features = geojson.features
  const geometries = []
  const colors = []

  features.forEach((feature) => {
    if (feature.geometry.coordinates) {
      const coordinates = feature.geometry.coordinates
      const contourHeight = feature.properties.CONTOUR

      const positions = coordinates.map((coord) =>
        Cesium.Cartesian3.fromDegrees(
          coord[0],
          coord[1],
          contourHeight * scale - offset
        )
      )

      geometries.push(
        new Cesium.PolylineGeometry({
          positions: positions,
          width: 2.0
        })
      )

      colors.push(
        Cesium.ColorGeometryInstanceAttribute.fromColor(
          Cesium.Color.fromCssColorString(ColorSurface)
        )
      )
    }
  })

  const instances = geometries.map((geometry, index) => {
    return new Cesium.GeometryInstance({
      geometry: geometry,
      attributes: {
        color: colors[index]
      }
    })
  })

  viewer.scene.primitives.add(
    new Cesium.Primitive({
      geometryInstances: instances,
      appearance: new Cesium.PolylineColorAppearance()
    })
  )
}
//初始化控制面板
function initGUI(config, globalConfig, terrainOptions) {
  var gui = new dat.GUI()

  // 全局控制分组
  const globalFolder = gui.addFolder('全局地形控制')
  globalFolder
    .add(globalConfig, 'enableGlobalControl')
    .name('启用全局控制')
    .onChange(() => updateAllTerrains(config, globalConfig, terrainOptions))
  globalFolder
    .add(globalConfig, 'globalOffset', -50000, 50000)
    .name('全局偏移系数')
    .onChange(() => updateAllTerrains(config, globalConfig, terrainOptions))
  globalFolder
    .add(globalConfig, 'globalScale', 1, 10)
    .name('全局拉伸系数')
    .onChange(() => updateAllTerrains(config, globalConfig, terrainOptions))
  globalFolder
    .addColor(globalConfig, 'globalColor')
    .name('全局颜色')
    .onChange(() => updateAllTerrains(config, globalConfig, terrainOptions))
  globalFolder.open()

  // 单独地形控制分组
  const terrainFolder = gui.addFolder('单独地形控制')
  terrainFolder
    .add(
      config,
      'selectedTerrain',
      terrainOptions.map((o) => o.file)
    )
    .name('选择地形')
    .onChange(() => updateTerrain(config, globalConfig))
  terrainFolder
    .add(config, 'offset', -50000, 50000)
    .name('偏移系数')
    .onChange(() => updateTerrain(config, globalConfig))
  terrainFolder
    .add(config, 'scale', 1, 10)
    .name('拉伸系数')
    .onChange(() => updateTerrain(config, globalConfig))
  terrainFolder
    .addColor(config, 'color')
    .name('颜色')
    .onChange(() => updateTerrain(config, globalConfig))
  terrainFolder.open()
}

//更新地形
function updateTerrain(config, globalConfig) {
  const viewer = window.viewer
  console.log(globalConfig)
  if (!globalConfig.enableGlobalControl) {
    viewer.scene.primitives.removeAll()
    LoadGeologicalLayer(
      `/json/${config.selectedTerrain}`,
      config.offset,
      config.scale,
      config.color
    )
  }
}
//更新全部地形
function updateAllTerrains(config, globalConfig, terrainOptions) {
  if (globalConfig.enableGlobalControl) {
    viewer.scene.primitives.removeAll()
    terrainOptions.forEach((option) => {
      LoadGeologicalLayer(
        `/json/${option.file}`,
        globalConfig.globalOffset,
        globalConfig.globalScale,
        globalConfig.globalColor
      )
    })
  } else {
    updateTerrain(config, globalConfig)
  }
}
export default {
  LoadGeologicalLayer,
  updateAllTerrains,
  updateTerrain,
  initGUI
}
