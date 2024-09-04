import * as turf from '@turf/turf'
import EventBus from '@/api/mapbus'
function loadAnXian(anxianJson, layername, linename) {
  if (!window.map.getLayer(layername)) {
    new maptalks.VectorLayer(layername).addTo(window.map)
  }

  // 1. 加载岸线上的折点并设置样式

  anxianJson.features.forEach((element) => {
    // 创建几何对象
    const geometry = maptalks.GeoJSON.toGeometry(element)

    // 将几何对象添加到图层
    geometry.addTo(window.map.getLayer(layername)).setSymbol({
      markerFile: '/img/Z折点(悬停).png',
      markerWidth: 10,
      markerHeight: 10
    })

    // 将 properties 属性附加到几何对象
    geometry.setProperties(element.properties)
  })

  // 2. 加载岸线 点转线
  var coordinates = []
  anxianJson.features.forEach((element) => {
    coordinates.push(element.geometry.coordinates)
  })
  var linestring1 = turf.lineString(coordinates, { name: linename })

  maptalks.GeoJSON.toGeometry(linestring1)
    .addTo(window.map.getLayer(layername))
    .setSymbol({
      lineColor: '#1bbc9b', // 线的颜色
      lineWidth: 3, // 线的宽度
      lineDasharray: [10, 10], // 虚线样式
      // markerFile: '/img/Z折点(悬停).png', // 标记图像文件路径
      // markerPlacement: 'center', // 标记放置位置，顶点
      markerVerticalAlignment: 'middle', // 标记垂直对齐方式
      markerWidth: 16, // 标记宽度
      markerHeight: 16 // 标记高度
    })

  return window.map.getLayer(layername)
  //   //3. 加载一段线
  //   var start = turf.point([121.64073575625395, 37.754175814015746])
  //   var stop = turf.point([123.79057108474568, 37.71827432244768])
  //   var sliced = turf.lineSlice(start, stop, linestring1)
  //   maptalks.GeoJSON.toGeometry(sliced).addTo(window.map.getLayer('vector'))
}

function SelectedLayersSymbol(layer, anxianJson) {
  //   var self = this;
  window.map.on('click', function (e) {
    //identify
    window.map.identify(
      {
        coordinate: e.coordinate,
        layers: [
          layer,
          window.map.getLayer('anxian2'),
          window.map.getLayer('breakAnxian')
        ]
      },
      function (geos) {
        if (geos.length === 0) {
          return
        }
        geos.forEach(function (g) {
          switch (g.type) {
            // case 'Polygon':
            //   g.updateSymbol({
            //     polygonFill: 'rgb(135,196,240)',
            //     polygonOpacity: 1,
            //     lineColor: '#1bbc9b',
            //     lineWidth: 6,
            //     lineJoin: 'round', //miter, round, bevel
            //     lineCap: 'round', //butt, round, square
            //     lineDasharray: null, //dasharray, e.g. [10, 5, 5]
            //     'lineOpacity ': 1
            //   })

            //   break
            case 'LineString':
              EventBus.$emit('LsLayer', g) // 记录当前选中的图层
              manageLinesCombine(g)
              g.updateSymbol({
                lineColor: '#1bbc9b',
                lineWidth: 1,
                lineJoin: 'round', //miter, round, bevel
                lineCap: 'round', //butt, round, square
                lineDasharray: null, //dasharray, e.g. [10, 5, 5]
                'lineOpacity ': 1
              })
              break
            case 'Point':
              // 调用函数添加标记和标签
              manageMarkerLabels(layer, g._coordinates, g.properties.id)
              g.updateSymbol({
                markerFill: '#f00',
                markerFile: '/img/捕捉折点.png', // 标记图像文件路径
                markerWidth: 24, // 标记宽度
                markerHeight: 24 // 标记高度
              })
              break

            default:
              break
          }
        })
      }
    )
  })
}
var lastTwoCoordinates = []
var lastTwoBreakAnxian = []
function manageMarkerLabels(layer, coordinate, id) {
  // 创建一个新标记
  let newMarker = addMarkerLabel(layer, coordinate, id)

  // 将新标记添加到数组
  lastTwoCoordinates.push(newMarker)

  // 检查数组长度是否超过两个
  if (lastTwoCoordinates.length > 2) {
    // 移除第一个标记
    let markerToRemove = lastTwoCoordinates.shift()
    markerToRemove.remove()
  }

  // console.log(lastTwoCoordinates)
}
function manageLinesCombine(layer) {
  lastTwoBreakAnxian.push(layer)
  // 检查数组长度是否超过两个
  if (lastTwoBreakAnxian.length > 2) {
    // 移除第一个标记
    let LinesToRemove = lastTwoBreakAnxian.shift()
    LinesToRemove.remove()
  }

  // console.log(lastTwoCoordinates)
}

function getLastLines() {
  return lastTwoBreakAnxian
}
function addMarkerLabel(layer, coordinate, id) {
  var text = new maptalks.Marker([coordinate.x + 0.02, coordinate.y + 0.02], {
    properties: {
      name: coordinate.x.toFixed(3) + ',' + coordinate.y.toFixed(3) + ',' + id,
      id: id
    },
    symbol: {
      textFaceName: 'sans-serif',
      textName: '{name}', //value from name in geometry's properties
      textWeight: 'normal', //'bold', 'bolder'
      textStyle: 'normal', //'italic', 'oblique'
      textSize: 15,
      textFont: null, //same as CanvasRenderingContext2D.font, override textName, textWeight and textStyle
      textFill: '#34495e',
      textOpacity: 1,
      textHaloFill: '#fff',
      textHaloRadius: 5,
      textWrapWidth: null,
      textWrapCharacter: '\n',
      textLineSpacing: 0,

      textDx: 0,
      textDy: 0,

      textHorizontalAlignment: 'middle', //left | middle | right | auto
      textVerticalAlignment: 'middle', // top | middle | bottom | auto
      textAlign: 'center' //left | right | center | auto
    }
  }).addTo(layer)
  return text // 返回标记以便之后移除
}

function breaklines(geojson) {
  // 方案二：Turf点选分割==========================================================================================================================================================

  var line = turf.lineString([
    [
      lastTwoCoordinates[0]._coordinates.x,
      lastTwoCoordinates[0]._coordinates.y
    ],
    [lastTwoCoordinates[1]._coordinates.x, lastTwoCoordinates[1]._coordinates.y]
  ])

  console.log(line)

  // // 2. 加载岸线 点转线
  // var coordinates = []
  // geojson.features.forEach((element) => {
  //   coordinates.push(element.geometry.coordinates)
  // })

  // var splitter = turf.lineString(coordinates)
  // console.log(splitter)
  // var split = turf.lineSplit(line, splitter)
  // console.log(split)
  // var layer
  // if (!window.map.getLayer('breakAnxian')) {
  //   layer = new maptalks.VectorLayer('breakAnxian').addTo(window.map)
  // }
  // maptalks.GeoJSON.toGeometry(line).addTo(window.map.getLayer('breakAnxian'))
  // maptalks.GeoJSON.toGeometry(splitter).addTo(
  //   window.map.getLayer('breakAnxian')
  // )
  // maptalks.GeoJSON.toGeometry(split).addTo(window.map.getLayer('breakAnxian'))
  // // 清空
  // lastTwoCoordinates = []
  // return split
  //方案一：筛选JSON数组===========================================================================================================================
  var startCoord = lastTwoCoordinates[0].properties.id
  var endCoord = lastTwoCoordinates[1].properties.id
  // console.log('开始：' + startCoord + ',' + '结束：' + endCoord)

  // Make sure startCoord is less than endCoord
  if (startCoord > endCoord) {
    ;[startCoord, endCoord] = [endCoord, startCoord]
  }

  // // Filter features based on id
  var filteredFeatures = geojson.features.filter(function (feature) {
    var featureId = feature.properties.id
    return featureId >= startCoord && featureId <= endCoord
  })

  // 选中的另一部分
  var UnSelectedJSON = reverseSelectFeatures(geojson, startCoord, endCoord)

  var coordinates = []
  filteredFeatures.forEach((element) => {
    coordinates.push(element.geometry.coordinates)
  })
  var linestring1 = turf.lineString(coordinates, { name: 'line 1' })
  var layer
  if (!window.map.getLayer('breakAnxian')) {
    layer = new maptalks.VectorLayer('breakAnxian').addTo(window.map)
  }
  maptalks.GeoJSON.toGeometry(linestring1).addTo(
    window.map.getLayer('breakAnxian')
  )
  // 清空
  lastTwoCoordinates = []
  //  返回选中的和未选中的要素
  return { filteredFeatures, UnSelectedJSON }
}

/**
 * 反选GeoJSON要素，筛选出ID不在startID和endID之间的要素
 * @param {Object} geojson - GeoJSON 对象
 * @param {number} startID - 起始ID
 * @param {number} endID - 结束ID
 * @returns {Array} - 筛选后的要素数组
 */
function reverseSelectFeatures(geojson, startID, endID) {
  // 确保 startID 小于 endID
  if (startID > endID) {
    ;[startID, endID] = [endID, startID]
  }

  // 筛选出 ID 不在 startID 和 endID 之间的要素
  return geojson.features.filter(function (feature) {
    var featureId = feature.properties.id
    return featureId < startID || featureId > endID
  })
}

function loadBreakAnXian(anxianJson, layername, linename) {
  if (anxianJson) {
    if (!window.map.getLayer(layername)) {
      new maptalks.VectorLayer(layername).addTo(window.map)
    }

    // anxianJson.features.forEach((element) => {
    //   // 创建几何对象
    //   const geometry = maptalks.GeoJSON.toGeometry(element)

    //   // 将几何对象添加到图层
    //   geometry.addTo(window.map.getLayer(layername)).setSymbol({
    //     markerFile: '/img/Z折点(悬停).png',
    //     markerWidth: 10,
    //     markerHeight: 10
    //   })

    //   // 将 properties 属性附加到几何对象
    //   geometry.setProperties(element.properties)
    // })

    // 2. 加载岸线 点转线
    var coordinates = []
    anxianJson.forEach((element) => {
      coordinates.push(element.geometry.coordinates)
    })
    var linestring1 = turf.lineString(coordinates, { name: linename })

    maptalks.GeoJSON.toGeometry(linestring1)
      .addTo(window.map.getLayer(layername))
      .setSymbol({
        lineColor: '#0000ff', // 线的颜色
        lineWidth: 3, // 线的宽度
        lineDasharray: [10, 10], // 虚线样式
        // markerFile: '/img/Z折点(悬停).png', // 标记图像文件路径
        // markerPlacement: 'center', // 标记放置位置，顶点
        markerVerticalAlignment: 'middle', // 标记垂直对齐方式
        markerWidth: 16, // 标记宽度
        markerHeight: 16 // 标记高度
      })

    return window.map.getLayer(layername)
  } else {
    alert('数据载入出错')
  }
}
function loadLines(anxianJson, layername, linename) {
  if (anxianJson) {
    if (!window.map.getLayer(layername)) {
      new maptalks.VectorLayer(layername).addTo(window.map)
    }

    // anxianJson.features.forEach((element) => {
    //   // 创建几何对象
    //   const geometry = maptalks.GeoJSON.toGeometry(element)

    //   // 将几何对象添加到图层
    //   geometry.addTo(window.map.getLayer(layername)).setSymbol({
    //     markerFile: '/img/Z折点(悬停).png',
    //     markerWidth: 10,
    //     markerHeight: 10
    //   })

    //   // 将 properties 属性附加到几何对象
    //   geometry.setProperties(element.properties)
    // })

    // 2. 加载岸线 点转线
    var coordinates = []
    anxianJson.features.forEach((element) => {
      coordinates.push(element.geometry.coordinates)
    })
    var linestring1 = turf.lineString(coordinates, { name: linename })

    maptalks.GeoJSON.toGeometry(linestring1)
      .addTo(window.map.getLayer(layername))
      .setSymbol({
        lineColor: '#0000ff', // 线的颜色
        lineWidth: 3, // 线的宽度
        lineDasharray: [10, 10], // 虚线样式
        // markerFile: '/img/Z折点(悬停).png', // 标记图像文件路径
        // markerPlacement: 'center', // 标记放置位置，顶点
        markerVerticalAlignment: 'middle', // 标记垂直对齐方式
        markerWidth: 16, // 标记宽度
        markerHeight: 16 // 标记高度
      })

    return window.map.getLayer(layername)
  } else {
    alert('数据载入出错')
  }
}
function CombineAnxian(geojson1, geojson2) {
  console.log(geojson1)

  // 检查输入是否为有效的GeoJSON LineString
  if (
    geojson1.type !== 'Feature' ||
    geojson1.geometry.type !== 'LineString' ||
    geojson2.type !== 'Feature' ||
    geojson2.geometry.type !== 'LineString'
  ) {
    throw new Error('Invalid GeoJSON LineString')
  }

  // 创建一个合并后的LineString，包含两个LineString的坐标
  const mergedLineString = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        ...geojson1.geometry.coordinates,
        ...geojson2.geometry.coordinates
      ]
    },
    properties: {
      name: 'Merged LineString'
    }
  }

  // 创建一个FeatureCollection并添加合并后的LineString
  const mergedGeoJSON = {
    type: 'FeatureCollection',
    features: [mergedLineString]
  }

  return mergedGeoJSON
}

function convertLineStringToPoints(mergedGeoJSON) {
  // 检查输入是否为有效的GeoJSON FeatureCollection并包含LineString
  if (
    mergedGeoJSON.type !== 'FeatureCollection' ||
    mergedGeoJSON.features.length === 0 ||
    mergedGeoJSON.features[0].geometry.type !== 'LineString'
  ) {
    throw new Error('Invalid GeoJSON FeatureCollection or LineString')
  }

  // 获取合并的LineString的坐标
  const lineCoordinates = mergedGeoJSON.features[0].geometry.coordinates

  // 将LineString的坐标转换为GeoJSON点
  const pointFeatures = lineCoordinates.map((coords, index) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: coords
    },
    properties: {
      id: `point-${index + 1}` // 为每个点添加唯一的ID
    }
  }))

  // 创建一个FeatureCollection并添加转换后的点
  const pointsGeoJSON = {
    type: 'FeatureCollection',
    features: pointFeatures
  }

  return pointsGeoJSON
}

export default {
  loadAnXian,
  SelectedLayersSymbol,
  breaklines,
  reverseSelectFeatures,
  loadBreakAnXian,
  CombineAnxian,
  getLastLines,
  convertLineStringToPoints,
  loadLines
}
