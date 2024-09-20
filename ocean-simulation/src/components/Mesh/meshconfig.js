import * as turf from '@turf/turf'
import 'maptalks/dist/maptalks.css' // 导入 maptalks 的 CSS 样式
import maprequest from '@/api/maprequest.js'
var map = window.map
/**
 * 添加mesh节点
 */
let meshNodeLayer // 保存图层引用

function addMeshNode(meshNodes) {
  console.log('加载网格节点')
  console.log(meshNodes)
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

  // meshNodeLayer = new maptalks.GeoJSONVectorTileLayer('geo', {
  //   data: meshNodes,
  //   style
  // }).addTo(window.map)
  // 使用 fromJSON 方法将 GeoJSON 转换为 Geometry 对象
  const geometry = maptalks.Geometry.fromJSON(meshNodes)

  meshNodeLayer = new maptalks.PointLayer('meshPoints').addGeometry(
    geometry,
    true
  )
  meshNodeLayer.addTo(window.map).setStyle(style)
  meshNodeLayer.on('dataload', (e) => {
    window.map.fitExtent(e.extent)
  })
}

function removeMeshNode() {
  if (meshNodeLayer) {
    meshNodeLayer.remove()
    meshNodeLayer = null // 清空图层引用
  }
}

/**
 *   添加mesh网格
 */

let meshNetsLayer, labelLayer // 保存图层引用
// let vertexMap = new Map() // 用于存储顶点与三角形的映射关系
function addMeshNets(meshJson) {
  meshNetsLayer = new maptalks.VectorLayer('vector2mesh').addTo(window.map)
  let vertexMap = new Map() // 记录顶点id到三角形的映射关系
  labelLayer = new maptalks.VectorLayer('meshlabels').addTo(window.map) // 用于显示ID的图层

  const editOption = {
    draggable: false,
    fixAspectRatio: true,
    centerHandleSymbol: {
      markerType: 'ellipse',
      markerFill: 'red',
      markerWidth: 5,
      markerHeight: 5
    },
    vertexHandleSymbol: {
      markerType: 'ellipse',
      markerFill: 'blue',
      markerWidth: 8,
      markerHeight: 8
    },
    newVertexHandleSymbol: {
      markerType: 'ellipse',
      markerFill: 'green',
      markerWidth: 5,
      markerHeight: 5
    }
  }

  const autoAdsorb = new maptalks.Autoadsorb({ layers: [meshNetsLayer] })
  autoAdsorb.setMode('vertux')
  autoAdsorb.setDistance(20) // 吸附容差

  const tolerance = 0.000001 // 设置容差值，允许小的坐标误差

  // 比较坐标是否在容差范围内
  function areCoordsEqual(coord1, coord2, tolerance = 0.000001) {
    return (
      Math.abs(coord1[0] - coord2[0]) < tolerance &&
      Math.abs(coord1[1] - coord2[1]) < tolerance
    )
  }

  // 创建网格三角形
  meshJson.features.forEach((element, triangleIndex) => {
    const properties = element.properties || {}
    const coordinates = element.geometry.coordinates[0] // 获取三角形的顶点坐标
    const pointsProperties = properties.points_properties || [] // 获取点的属性

    // 创建三角形对象
    let p = new maptalks.Polygon(coordinates, {
      editable: true,
      draggable: false,
      properties: properties // 将属性添加到多边形对象
    })
      .setSymbol({ polygonFill: '#000000', polygonOpacity: 0.3 })
      .addTo(meshNetsLayer)

    // 显示三角形ID
    const centerCoord = p.getCenter() // 获取三角形中心点
    new maptalks.Label(`Triangle ID: ${triangleIndex}`, centerCoord, {
      textSize: 14,
      box: true,
      padding: [6, 2],
      textFill: '#f00',
      boxFill: '#fff',
      boxOpacity: 0.6
    }).addTo(labelLayer)

    // 记录每个顶点的id与三角形的映射关系
    pointsProperties.forEach((pointProp, index) => {
      const id = pointProp.id // 获取顶点的id
      if (!vertexMap.has(id)) {
        vertexMap.set(id, [])
      }
      vertexMap.get(id).push(p) // 将三角形与顶点id进行关联

      // 显示顶点ID
      const vertexCoord = coordinates[index] // 获取该顶点的坐标
      new maptalks.Label(`Vertex ID: ${id}`, vertexCoord, {
        textSize: 12,
        box: true,
        padding: [6, 2],
        textFill: '#00f',
        boxFill: '#fff',
        boxOpacity: 0.6
      }).addTo(labelLayer)
    })

    p.on('contextmenu', () => {
      let geometry = p
      if (geometry.isEditing()) {
        geometry.endEdit()
        autoAdsorb.refreshTargets()
      } else {
        autoAdsorb.bindGeometry(geometry)
        geometry.startEdit(editOption)
      }
    })
    // 添加撤销和重做事件监听器
    p.on('editrecord', () => {
      undoStack.push(p)
      redoStack = [] // 编辑新操作时清空重做堆栈
    })
    // 绑定撤销和重做事件
    p.on('undoedit', () => {
      redoStack.push(p) // 将当前操作放入重做堆栈
      undoStack.pop() // 从撤销堆栈移除最后一个操作
    })
    p.on('redoedit', () => {
      undoStack.push(p) // 将当前操作放入撤销堆栈
      redoStack.pop() // 从重做堆栈移除最后一个操作
    })
    let initialCoords
    let affectedTriangles = []

    // 在顶点拖动开始时记录初始坐标
    p.on('handledragstart', () => {
      initialCoords = p
        .getCoordinates()[0]
        .map((coord) =>
          Array.isArray(coord) ? coord.slice() : [coord.x, coord.y]
        )
      affectedTriangles = []
      console.log('Initial Coordinates:', initialCoords)
    })

    // 在顶点拖动结束后更新相邻的三角形
    p.on('handledragend', (event) => {
      const geometry = event.target
      const finalCoords = geometry
        .getCoordinates()[0]
        .map((coord) => (Array.isArray(coord) ? coord : [coord.x, coord.y]))

      console.log('Final Coordinates:', finalCoords)

      let draggedIndex = -1

      // 查找哪个顶点发生了变化
      for (let i = 0; i < finalCoords.length; i++) {
        if (!areCoordsEqual(finalCoords[i], initialCoords[i], tolerance)) {
          draggedIndex = i
          break
        }
      }

      if (draggedIndex !== -1) {
        const movedCoord = finalCoords[draggedIndex]
        const pointProp = pointsProperties[draggedIndex]
        const id = pointProp.id
        const triangles = vertexMap.get(id)

        if (triangles) {
          console.log('Updating triangles:', triangles)

          // 存储撤销和重做信息
          const affectedState = triangles.map((triangle) => ({
            triangle,
            originalCoords: triangle
              .getCoordinates()[0]
              .map((coord) =>
                Array.isArray(coord) ? coord.slice() : [coord.x, coord.y]
              ),
            finalCoords: triangle
              .getCoordinates()[0]
              .map((coord) =>
                Array.isArray(coord) ? coord.slice() : [coord.x, coord.y]
              ) // 这里确保记录所有三角形的最终坐标
          }))

          // 添加拖动三角形的原始和最终坐标
          affectedState.push({
            triangle: p,
            originalCoords: initialCoords,
            finalCoords: finalCoords // 确保拖动三角形的最终坐标也被存储
          })

          // 更新所有与该顶点相关的三角形
          triangles.forEach((triangle) => {
            const triangleCoords = triangle
              .getCoordinates()[0]
              .map((coord) =>
                Array.isArray(coord) ? coord : [coord.x, coord.y]
              )

            const i = triangleCoords.findIndex((triangleCoord) =>
              areCoordsEqual(
                triangleCoord,
                initialCoords[draggedIndex],
                tolerance
              )
            )

            if (i !== -1) {
              // 更新当前顶点
              triangleCoords[i] = movedCoord
              triangleCoords[triangleCoords.length - 1] = triangleCoords[0] // 保证闭合
              triangle.setCoordinates([triangleCoords])
            }
          })

          undoStack.push(affectedState)
          redoStack = []
        } else {
          console.error('No triangles found for the id:', id)
        }
      } else {
        console.error('No vertex was detected as dragged.')
      }
    })

    setTimeout(() => {
      autoAdsorb.bindGeometry(p)
    }, 10)
  })
}
/**
 *  重做和回退
 *  用于存储编辑历史的堆栈
 */
let undoStack = []
let redoStack = []
function undoeditMesh() {
  if (undoStack.length > 0) {
    const lastAction = undoStack.pop() // 获取最后的操作

    if (lastAction && Array.isArray(lastAction)) {
      lastAction.forEach(({ triangle, originalCoords }) => {
        if (triangle && Array.isArray(originalCoords)) {
          // 恢复所有受影响三角形的原始坐标
          triangle.setCoordinates([originalCoords])
        } else {
          console.error('Invalid triangle or originalCoords detected.')
        }
      })
      redoStack.push(lastAction) // 将操作放入重做栈
    } else {
      console.error('Invalid undo action structure detected.')
    }
  } else {
    console.warn('No more actions to undo.')
  }
}
function redoeditMesh() {
  if (redoStack.length > 0) {
    const lastRedoAction = redoStack.pop() // 获取最后的重做操作

    if (lastRedoAction && Array.isArray(lastRedoAction)) {
      lastRedoAction.forEach(({ triangle, finalCoords }) => {
        if (triangle && Array.isArray(finalCoords)) {
          // 恢复所有受影响三角形的最终坐标
          triangle.setCoordinates([finalCoords])
        } else {
          console.error('Invalid triangle or finalCoords detected.')
        }
      })
      undoStack.push(lastRedoAction) // 将操作放入撤销栈
    } else {
      console.error('Invalid redo action structure detected.')
    }
  } else {
    console.warn('No more actions to redo.')
  }
}

function isShowLabels(bool) {
  if (bool) {
    window.map.getLayer('meshlabels').show()
  } else {
    window.map.getLayer('meshlabels').hide()
  }
}
// function addMeshNets(meshJson) {
//   meshNetsLayer = new maptalks.VectorLayer('vector2mesh').addTo(window.map)
//   var editOption = {
//     draggable: false,
//     fixAspectRatio: true,
//     centerHandleSymbol: {
//       markerType: 'ellipse',
//       markerFill: 'red',
//       markerWidth: 5,
//       markerHeight: 5
//     },
//     vertexHandleSymbol: {
//       markerType: 'ellipse',
//       markerFill: 'blue',
//       markerWidth: 8,
//       markerHeight: 8
//     },
//     newVertexHandleSymbol: {
//       markerType: 'ellipse',
//       markerFill: 'green',
//       markerWidth: 5,
//       markerHeight: 5
//     }
//   }
//   const autoAdsorb = new maptalks.Autoadsorb({ layers: [meshNetsLayer] })
//   autoAdsorb.setMode('vertux')
//   autoAdsorb.setDistance(20) //吸附容差
//   meshJson.features.forEach((element) => {
//     // 提取属性
//     const properties = element.properties || {}
//     var p = new maptalks.Polygon(element.geometry.coordinates, {
//       editable: true,
//       draggable: false,
//       properties: properties // 将属性添加到多边形对象
//     })
//       .setSymbol({ polygonFill: '#000000', polygonOpacity: 0.3 })
//       .addTo(meshNetsLayer)
//     p.on('contextmenu', () => {
//       let geometry = p
//       if (geometry.isEditing()) {
//         geometry.endEdit()
//         autoAdsorb.refreshTargets()
//       } else {
//         autoAdsorb.bindGeometry(geometry)
//         geometry.startEdit(editOption)
//       }
//     })
//     // 添加撤销和重做事件监听器
//     p.on('editrecord', () => {
//       undoStack.push(p)
//       redoStack = [] // 编辑新操作时清空重做堆栈
//     })
//     // 绑定撤销和重做事件
//     p.on('undoedit', () => {
//       redoStack.push(p) // 将当前操作放入重做堆栈
//       undoStack.pop() // 从撤销堆栈移除最后一个操作
//     })
//     p.on('redoedit', () => {
//       undoStack.push(p) // 将当前操作放入撤销堆栈
//       redoStack.pop() // 从重做堆栈移除最后一个操作
//     })
//     p.on('handledragstart', () => {
//       p.on('handledragend', () => {
//         p.endEdit()
//         // undoeditMesh()
//         // redoeditMesh()
//       })
//     })
//     setTimeout(() => {
//       autoAdsorb.bindGeometry(p)
//     }, 10)
//   })
// }

function removeMeshNets() {
  if (meshNetsLayer) {
    meshNetsLayer.remove()
    meshNetsLayer = null // 清空图层引用
  }
}

// function undoeditMesh() {
//   if (undoStack.length > 0) {
//     const lastGeometry = undoStack.pop() // 从撤销堆栈中取出最后一个几何图形
//     lastGeometry.undoEdit() // 撤销该几何图形的编辑操作
//     redoStack.push(lastGeometry) // 将该几何图形放入重做堆栈
//   }
// }
// function redoeditMesh() {
//   if (redoStack.length > 0) {
//     const lastGeometry = redoStack.pop() // 从重做堆栈中取出最后一个几何图形
//     lastGeometry.redoEdit() // 重做
//     undoStack.push(lastGeometry) //// 将该几何图形放入撤销堆栈
//   }
// }
/**
 * 添加等值线等值面
 */
let meshIsoLinesLayer // 保存图层引用

function MeshIsoLines(meshJson) {
  var meshNodes = convertPolygonToPoints(meshJson)
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
    property: 'depth',
    units: 'degrees',
    weight: 10
  }

  var grid = turf.interpolate(meshNodes, 0.05, interpolate_options)
  const depths = meshNodes.features.map((feature) => feature.properties.depth)
  const minDepth = Math.min(...depths)
  const maxDepth = Math.max(...depths)
  const numberOfBreaks = colorChart.length
  const interval = (maxDepth - minDepth) / (numberOfBreaks - 1)
  const breaks = Array.from(
    { length: numberOfBreaks },
    (_, i) => minDepth + i * interval
  )
  const color = colorChart.map((color) => {
    return { fill: color }
  })
  const isolines_options = {
    zProperty: 'depth',
    commonProperties: {
      'fill-opacity': 0.7
    },
    breaksProperties: color
  }
  let gridIsobands = turf.isobands(grid, breaks, isolines_options)
  gridIsobands = turf.flatten(gridIsobands)
  var dissolved = turf.dissolve(meshJson)
  const features = []
  gridIsobands.features.forEach((layer1) => {
    dissolved.features.forEach((layer2) => {
      let intersection = turf.intersect(
        turf.featureCollection([layer1, layer2])
      )
      if (intersection != null) {
        intersection.properties = layer1.properties
        intersection.id = Math.random() * 100000
        features.push(intersection)
      }
    })
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
function convertPolygonToPoints(geojson) {
  let points = []

  geojson.features.forEach((feature) => {
    if (
      feature.geometry.type === 'Polygon' &&
      feature.properties.points_properties
    ) {
      const coordinates = feature.geometry.coordinates[0] // 获取多边形的坐标数组
      const properties = feature.properties.points_properties

      coordinates.forEach((coord, index) => {
        if (properties[index]) {
          points.push({
            geometry: {
              coordinates: coord,
              type: 'Point'
            },
            properties: {
              depth: properties[index].depth,
              id: properties[index].id,
              value: properties[index].value
            },
            type: 'Feature'
          })
        }
      })
    }
  })

  return {
    type: 'FeatureCollection',
    features: points
  }
}
function removeMeshIsoLines() {
  if (meshIsoLinesLayer) {
    meshIsoLinesLayer.remove()
    meshIsoLinesLayer = null // 清空图层引用
  }
}

/**
 * 导出和下载
 * @param {*} nodes
 * @param {*} nets
 */
function exportToGeoJSON() {
  // 获取地图上的所有图层
  const layer = map.getLayer('vector2mesh')

  const geoJSON = {
    type: 'FeatureCollection',
    features: []
  }

  const geometries = layer.getGeometries()

  geometries.forEach((geometry) => {
    const geoJSONFeature = geometry.toGeoJSON()
    geoJSON.features.push(geoJSONFeature)
  })

  // 将GeoJSON对象转换为字符串并导出
  const geoJSONString = JSON.stringify(geoJSON)

  downloadGeoJSON(geoJSONString, 'map-data.geojson')
  return geoJSON
}
function exportToMesh(nets) {
  maprequest.http.UploadGeoJson2mesh('/json2mesh', nets)
}
function downloadGeoJSON(geoJSONString, filename) {
  const blob = new Blob([geoJSONString], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 网格偏移
 */
function offsetMeshNets(layerName) {
  // 获取图层对象
  var layer = map.getLayer('vector2mesh') // 替换为您的图层名称

  // 获取图层中的所有要素
  var geometries = layer.getGeometries()

  // 假设您有一个参考点（目标偏移位置）
  var targetPoint = [130.14, 40.28]

  // 将所有几何对象组合为 FeatureCollection 以批量处理
  var featureCollection = {
    type: 'FeatureCollection',
    features: geometries.map(function (geometry) {
      return geometry.toGeoJSON()
    })
  }

  // 1. 使用 turf.union 或 turf.dissolve 合并所有要素
  var mergedFeature = turf.dissolve(featureCollection)

  // 2. 计算合并后网格整体的中心点
  var overallCenter = turf.center(mergedFeature).geometry.coordinates

  // 3. 计算从中心点到目标点的偏移方向和距离
  var distance = turf.distance(overallCenter, targetPoint, {
    units: 'kilometers'
  })
  var direction = turf.bearing(overallCenter, targetPoint)

  // 4. 对每个网格要素进行整体偏移
  featureCollection.features.forEach(function (feature) {
    turf.transformTranslate(feature, distance, direction, {
      units: 'kilometers',
      mutate: true
    })
  })

  // 5. 更新图层中的几何对象
  geometries.forEach(function (geometry, index) {
    geometry.setCoordinates(
      featureCollection.features[index].geometry.coordinates
    )
  })

  return featureCollection
}

/**
 * 对GeoJSON点集进行处理
 * @param {Object} pointCollection - 一个GeoJSON格式的点集合 (FeatureCollection)
 * @param {Array} targetPoint - 目标偏移位置 [lng, lat]
 * @param {string} unit - 偏移单位 ('kilometers', 'meters', 'degrees', etc.)
 * @returns {Object} - 处理后的GeoJSON点集合
 */
function offsetMeshPoints(layerName) {
  // 获取图层对象
  var layer = map.getLayer(layerName) // 替换为您的图层名称

  // 获取图层中的所有要素
  var geometries = layer.getGeometries()

  // 假设您有一个参考点（目标偏移位置）
  var targetPoint = [130.14, 40.28]

  // // 检查输入是否为FeatureCollection类型
  // if (pointCollection.type !== 'FeatureCollection') {
  //   throw new Error('输入的GeoJSON对象必须是FeatureCollection类型')
  // }
  // 将所有几何对象组合为 FeatureCollection 以批量处理
  var featureCollection = {
    type: 'FeatureCollection',
    features: geometries.map(function (geometry) {
      return geometry.toGeoJSON()
    })
  }
  // 计算点集的中心点
  var overallCenter = turf.center(featureCollection).geometry.coordinates

  // 计算从中心点到目标点的偏移方向和距离
  var distance = turf.distance(overallCenter, targetPoint, { units: 'miles' })
  var direction = turf.bearing(overallCenter, targetPoint)

  // 对点集中的每个点进行偏移
  featureCollection.features.forEach(function (feature) {
    if (feature.geometry.type === 'Point') {
      turf.transformTranslate(feature, distance, direction, {
        units: 'miles',
        mutate: true
      })
    }
  })
  //  更新图层中的几何对象
  geometries.forEach(function (geometry, index) {
    geometry.setCoordinates(
      featureCollection.features[index].geometry.coordinates
    )
  })
  // 返回处理后的点集
  return featureCollection
}

export default {
  addMeshNode,
  addMeshNets,
  MeshIsoLines,
  removeMeshNets,
  removeMeshNode,
  removeMeshIsoLines,
  exportToGeoJSON,
  undoeditMesh,
  redoeditMesh,
  exportToMesh,
  offsetMeshNets,
  offsetMeshPoints,
  convertPolygonToPoints,
  isShowLabels
}
