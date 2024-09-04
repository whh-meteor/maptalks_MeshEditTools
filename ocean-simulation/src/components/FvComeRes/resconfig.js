let fvPointsLayer // 保存图层引用
import * as turf from '@turf/turf'

function addFvcomePoints(fvPoints) {
  const style = [
    {
      filter: true,
      renderPlugin: {
        dataConfig: {
          type: 'point'
        },
        sceneConfig: {
          collision: false,
          fading: false,
          depthFunc: 'always'
        },
        type: 'icon'
      },
      symbol: {
        markerType: 'ellipse',
        markerFill: '#1bbc9b',
        markerHeight: 5,
        markerWidth: 5
      }
    }
  ]

  // fvPointsLayer = new maptalks.GeoJSONVectorTileLayer('geo', {
  //   data: fvPoints,
  //   style
  // }).addTo(window.map)
  // 使用 fromJSON 方法将 GeoJSON 转换为 Geometry 对象
  const geometry = maptalks.Geometry.fromJSON(fvPoints)

  fvPointsLayer = new maptalks.PointLayer('meshPoints').addGeometry(
    geometry,
    true
  )
  fvPointsLayer.addTo(window.map).setStyle(style)
  fvPointsLayer.on('dataload', (e) => {
    window.map.fitExtent(e.extent)
  })
}
let meshIsoLinesLayer // 保存图层引用

function MeshIsoLines(meshNodes, propertyName) {
  //点数据外围边界
  // var dissolved = turf.dissolve(meshJson)
  var options = { units: 'miles', maxEdge: 20 }

  var dissolved = turf.concave(meshNodes, options)

  // dissolved = turf.featureCollection(dissolved)

  console.log(dissolved)

  var colorChart = [
    '#0000FF',
    '#0033FF',
    '#0066FF',
    '#0099FF',
    '#00CCFF',
    '#00FFFF',
    '#33FFCC',
    '#66FF99',
    '#99FF66',
    '#CCFF33',
    '#FFFF00',
    '#FFCC00',
    '#FF9900',
    '#FF6600',
    '#FF3300',
    '#FF0000',
    '#CC0000'
  ]

  const interpolate_options = {
    gridType: 'points',
    property: propertyName,
    units: 'degrees',
    weight: 10
  }

  var grid = turf.interpolate(meshNodes, 0.05, interpolate_options)

  const depths = meshNodes.features.map(
    (feature) => feature.properties[propertyName]
  )
  console.log(depths)
  const minDepth = Math.min(...depths)
  const maxDepth = Math.max(...depths)

  // 检查 minDepth 和 maxDepth 是否有效
  if (isNaN(minDepth) || isNaN(maxDepth)) {
    console.error('Invalid minDepth or maxDepth:', minDepth, maxDepth)
    return // 退出函数，不继续执行
  }
  const numberOfBreaks = colorChart.length
  const interval = (maxDepth - minDepth) / (numberOfBreaks - 1)
  // const breaks = Array.from(
  //   { length: numberOfBreaks },
  //   (_, i) => minDepth + i * interval
  // )

  const breaks = Array.from({ length: numberOfBreaks }, (_, i) => {
    const value = minDepth + i * interval
    return isNaN(value) ? null : value // 检查是否为 NaN，跳过无效值
  }).filter((value) => value !== null) // 过滤掉无效的值

  if (breaks.length < 2) {
    console.error('Insufficient valid breaks:', breaks)
    return // 如果有效的 breaks 数量不足，退出函数
  }

  const color = colorChart.map((color) => {
    return { fill: color }
  })
  const isolines_options = {
    zProperty: propertyName,
    commonProperties: {
      'fill-opacity': 0.7
    },
    breaksProperties: color
  }
  let gridIsobands = turf.isobands(grid, breaks, isolines_options)
  gridIsobands = turf.flatten(gridIsobands)

  const features = []
  gridIsobands.features.forEach((layer1) => {
    let intersection = turf.intersect(
      turf.featureCollection([layer1, dissolved])
    )
    if (intersection != null) {
      intersection.properties = layer1.properties
      intersection.id = Math.random() * 100000
      features.push(intersection)
    }
  })

  const geojson = turf.featureCollection(features)

  meshIsoLinesLayer = new maptalks.VectorLayer('meshISO').addTo(window.map)

  const geo = new maptalks.GeoJSON.toGeometry(geojson, (geometry) => {
    geometry.config('symbol', {
      lineColor: '#000000',
      lineWidth: 0.2,
      lineDasharray: null,
      lineOpacity: 1,
      polygonFill: geometry.properties.fill,
      polygonOpacity: geometry.properties['fill-opacity']
    })
    geometry.addTo(meshIsoLinesLayer)
  })
}

export default { addFvcomePoints, MeshIsoLines }
