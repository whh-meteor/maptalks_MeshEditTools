import 'maptalks/dist/maptalks.css' // 导入 maptalks 的 CSS 样式
import bohaiJson from '@/assets/baohai_Polygon.json'
import anxianJson from '@/assets/Xyz2Json_84.json'
import meshJson from '@/assets/triangular_geojson.json'
import meshNodes from '@/assets/nodes.json'
import MultiMeshJson from '@/assets/muti_tri_polygon.json'
import * as turf from '@turf/turf'
import { Polygon } from 'maptalks'
// 添加mesh节点
function addMeshNode() {
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

  const layer = new maptalks.GeoJSONVectorTileLayer('geo', {
    data: meshNodes,
    style
  }).addTo(window.map)

  layer.on('dataload', (e) => {
    window.map.fitExtent(e.extent)
  })
}

function addMultiTrian(drawTool, drawLayer) {
  const layer = new maptalks.PolygonLayer('polygon')

  const multiPolygon = new maptalks.MultiPolygon(
    MultiMeshJson.features[0].geometry.coordinates,
    {
      visible: true,
      editable: true,
      cursor: 'pointer',
      shadowBlur: 0,
      shadowColor: 'black',
      draggable: false,
      dragShadow: false, // display a shadow during dragging
      drawOnAxis: null, // force dragging stick on a axis, can be: x, y
      symbol: {
        lineColor: '#34495e',
        lineWidth: 2,
        polygonFill: 'rgb(135,196,240)',
        polygonOpacity: 0.6
      }
    }
  ).addTo(layer)
  const groupLayer = new maptalks.GroupGLLayer('group', [layer])
  groupLayer.addTo(window.map)
}
function addTrian() {
  // var converted = turf.toWgs84(meshJson);
  // console.log(converted);
  //1- 循环加载
  //   meshJson.features.forEach((element) => {
  //     maptalks.GeoJSON.toGeometry(element).addTo(window.map.getLayer("vector"));
  //   });
  //2- 整体加载
  const style = {
    style: [
      {
        filter: ['all', ['==', '$type', 'Polygon']],
        renderPlugin: {
          dataConfig: {
            type: 'fill' //面设置
          },
          sceneConfig: {},
          type: 'fill'
        },
        symbol: {
          polygonBloom: false,
          polygonFill: '#ecc4ac',
          polygonOpacity: 0.2,
          polygonPatternFile: null
        }
      },
      {
        filter: ['all', ['==', '$type', 'Polygon']],
        renderPlugin: {
          dataConfig: {
            type: 'line' // 边线设置
          },
          sceneConfig: {},
          type: 'line'
        },
        symbol: {
          lineColor: '#ea6b48',
          lineWidth: 1
        }
      }
    ]
  }
  const layer = new maptalks.GeoJSONVectorTileLayer('geo', {
    data: meshJson,
    style
  }).addTo(window.map)
  console.log(layer)
  //   var edit = new GeometryEditor(layer, optsopt);
  layer.on('dataload', (e) => {
    window.map.fitExtent(e.extent)
  })
}
function xf(drawTool) {
  var layer = new maptalks.VectorLayer('vector2').addTo(window.map)
  //   //1- 循环加载

  var editOption = {
    //   symbol: { polygonOpacity: 0.5, polygonFill: "#000000" },
    // 禁止拖动
    draggable: false,
    fixAspectRatio: true,
    // 设置中心点样式
    centerHandleSymbol: {
      markerType: 'ellipse',
      markerFill: 'red',
      markerWidth: 5,
      markerHeight: 5
    },
    // 设置顶点样式
    vertexHandleSymbol: {
      markerType: 'ellipse',
      markerFill: 'blue',
      markerWidth: 8,
      markerHeight: 8
    },
    // 设置新顶点样式
    newVertexHandleSymbol: {
      markerType: 'ellipse',
      markerFill: 'green',
      markerWidth: 5,
      markerHeight: 5
    }
  }
  // 新的自动吸附，选项层是必要的。
  const autoAdsorb = new maptalks.Autoadsorb({ layers: [layer] })
  autoAdsorb.setMode('vertux')
  autoAdsorb.setDistance(50)
  meshJson.features.forEach((element) => {
    var p = new maptalks.Polygon(element.geometry.coordinates, {
      editable: true,
      draggable: false
    })
      .setSymbol({ polygonFill: '#000000', polygonOpacity: 0.3 })
      .addTo(layer)

    p.on('contextmenu', () => {
      console.log('编辑')
      let geometry = p
      if (geometry.isEditing()) {
        geometry.endEdit()
        autoAdsorb.refreshTargets()
      } else {
        autoAdsorb.bindGeometry(geometry)
        geometry.startEdit(editOption)
      }
    })
    p.on('handledragstart', () => {
      console.log('开始编辑形状')
      p.on('handledragend', () => {
        p.endEdit() // 第一次编辑结束后停止编辑，防止第二次中心点偏移
      })
    })
    setTimeout(() => {
      autoAdsorb.bindGeometry(p)
    }, 10)

    // maptalks.GeoJSON.toGeometry(meshJson.features[0]).addTo(
    //   window.map.getLayer("vector")
    // );
  })
}
//加载json面饼记载到地图上
function coastLine() {
  //从feature collection 中获取单个feature
  maptalks.GeoJSON.toGeometry(bohaiJson.features[0]).addTo(
    window.map.getLayer('vector')
  )
}
//面转线
function coastLine2Line() {
  var line = turf.polygonToLine(bohaiJson.features[0])
  maptalks.GeoJSON.toGeometry(line).addTo(window.map.getLayer('vector'))
}
//要素转点
function coastExplodePoint() {
  var line = turf.polygonToLine(bohaiJson.features[0])
  var explode = turf.explode(line)
  console.log(explode)
  explode.features.forEach((element) => {
    maptalks.GeoJSON.toGeometry(element).addTo(window.map.getLayer('vector'))
  })
}
//点转线
function coastPoint2Line() {
  var line = turf.polygonToLine(bohaiJson.features[0])
  var explode = turf.explode(line)
  var coordinates = []
  explode.features.forEach((element) => {
    coordinates.push(element.geometry.coordinates)
  })
  var linestring1 = turf.lineString(coordinates, { name: 'line 1' })
  maptalks.GeoJSON.toGeometry(linestring1).addTo(window.map.getLayer('vector'))
}
//打断线
function coastSplitLine() {
  // 1. 面转线
  var line = turf.polygonToLine(bohaiJson.features[0])
  // 2.用于打断的线
  var line2 = {
    type: 'Feature',
    properties: {},
    geometry: {
      coordinates: [
        [116.66192466198561, 39.44249939480318],
        [122.31036944610531, 39.76526340701045]
      ],
      type: 'LineString'
    }
  }

  maptalks.GeoJSON.toGeometry(line2).addTo(window.map.getLayer('vector'))
  //  3. 执行分割
  var split = turf.lineSplit(line, line2)
  console.log(split)

  split.features.forEach((element) => {
    maptalks.GeoJSON.toGeometry(element).addTo(window.map.getLayer('vector'))
  })
}

function genTrian() {
  // 面转线
  var lines = []
  meshJson.features.forEach((element) => {
    var line = turf.polygonToLine(element)
    lines.push(line)
    maptalks.GeoJSON.toGeometry(line).addTo(window.map.getLayer('vector'))
  })
  // 线转点
  // 用于存储所有相交点的集合，确保唯一性
  var uniqueIntersections = new Set()

  // 用于存储所有相交点的集合，确保唯一性
  var uniqueIntersections = new Set()

  // 迭代lines数组，找到所有相交点
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      let line1 = lines[i]
      let line2 = lines[j]
      let intersectPoints = turf.lineIntersect(line1, line2)

      if (intersectPoints.features.length > 0) {
        intersectPoints.features.forEach((point) => {
          // 将坐标转换为字符串，确保唯一性
          let coordStr = point.geometry.coordinates.join(',')
          uniqueIntersections.add(coordStr)
        })
      }
    }
  }
  var Points = []
  // 将唯一的相交点添加到maptalks图层中
  uniqueIntersections.forEach((coordStr) => {
    // 将字符串转换回坐标数组
    let coordinates = coordStr.split(',').map(Number)
    let point = turf.point(coordinates)
    maptalks.GeoJSON.toGeometry(point)
      .addTo(window.map.getLayer('vector'))
      .setSymbol({
        markerType: 'ellipse',
        markerFill: '#f00', // 红色
        markerLineColor: '#fff', // 白色边框
        markerLineWidth: 1,
        markerWidth: 10,
        markerHeight: 10
      })

    Points.push(point)
  })
  console.log(Points)
  console.log(uniqueIntersections)
  var collection = turf.featureCollection(Points)
  var tin = turf.tin(collection)

  tin.features.forEach((element) => {
    maptalks.GeoJSON.toGeometry(element).addTo(window.map.getLayer('vector'))
  })
}
function testTin() {
  // generate some random point data
  var points = turf.randomPoint(30, { bbox: [50, 30, 70, 50] })
  console.log(points)
  // add a random property to each point between 0 and 9
  for (var i = 0; i < points.features.length; i++) {
    points.features[i].properties.z = ~~(Math.random() * 9)
  }
  var tin = turf.tin(points, 'z')
}
function loadAnXian() {
  // 1. 加载岸线上的折点并设置样式
  anxianJson.features.forEach((element) => {
    maptalks.GeoJSON.toGeometry(element)
      .addTo(window.map.getLayer('vector'))
      .setSymbol({
        markerFile: '/img/Z折点(悬停).png',
        markerWidth: 10,
        markerHeight: 10
      })
  })
  // 2. 加载岸线
  var coordinates = []
  anxianJson.features.forEach((element) => {
    coordinates.push(element.geometry.coordinates)
  })
  var linestring1 = turf.lineString(coordinates, { name: 'line 1' })

  maptalks.GeoJSON.toGeometry(linestring1)
    .addTo(window.map.getLayer('vector'))
    .setSymbol({
      lineColor: '#1bbc9b', // 线的颜色
      lineWidth: 3, // 线的宽度
      lineDasharray: [10, 10], // 虚线样式
      // markerFile: "/img/Z折点(悬停).png", // 标记图像文件路径
      // markerPlacement: "vertex", // 标记放置位置，顶点
      markerVerticalAlignment: 'middle', // 标记垂直对齐方式
      markerWidth: 16, // 标记宽度
      markerHeight: 16 // 标记高度
    })
  //3. 加载一段线
  var start = turf.point([121.64073575625395, 37.754175814015746])
  var stop = turf.point([123.79057108474568, 37.71827432244768])
  var sliced = turf.lineSlice(start, stop, linestring1)
  maptalks.GeoJSON.toGeometry(sliced).addTo(window.map.getLayer('vector'))
}
function DrawTools() {
  // 创建一个新的矢量图层，并添加到地图中
  var layer = new maptalks.VectorLayer('vector').addTo(window.map)

  // 创建一个绘图工具，初始模式为“点”
  var drawTool = new maptalks.DrawTool({
    mode: 'Point'
  })
    .addTo(window.map)
    .disable() // 添加到地图并禁用
  //   // 新的自动吸附，选项层是必要的。
  //   const autoAdsorb = new maptalks.Autoadsorb({ layers: [layer] }).bindDrawTool(
  //     drawTool
  //   );

  // 监听绘图结束事件
  drawTool.on('drawend', function (param) {
    console.log(param.geometry) // 打印绘制的几何图形
    layer.addGeometry(param.geometry) // 将几何图形添加到矢量图层中
    SelectedLayersSymbol(layer) //选中改变样式
    // const { geometry } = param;

    // autoAdsorb.refreshTargets();
    // geometry.on("contextmenu", () => {
    //   console.log("结束");
    //   if (geometry.isEditing()) {
    //     geometry.endEdit();
    //     autoAdsorb.refreshTargets();
    //   } else {
    //     autoAdsorb.bindGeometry(geometry);
    //     geometry.startEdit();
    //   }
    // });
  })
  // 设置吸附模式和距离
  //   autoAdsorb.setMode("vertux");
  //   autoAdsorb.setDistance(20);
  // 定义工具栏的项目，包括各种绘图模式和功能
  var items = [
    'Point',
    'LineString',
    'Polygon',
    'Circle',
    'Ellipse',
    'Rectangle',
    'FreeHandLineString',
    'FreeHandPolygon'
  ].map(function (value) {
    return {
      item: value, // 项目的名称
      click: function () {
        drawTool.setMode(value).enable() // 设置绘图模式并启用绘图工具
      }
    }
  })

  return { items, drawTool, layer }
}

function SelectedLayersSymbol(layer) {
  //   var self = this;
  window.map.on('click', function (e) {
    //reset colors
    layer.forEach(function (g) {
      g.updateSymbol({
        markerFill: '#0e595e'
      })
    })
    //identify
    window.map.identify(
      {
        coordinate: e.coordinate,
        layers: [layer]
      },
      function (geos) {
        if (geos.length === 0) {
          return
        }
        geos.forEach(function (g) {
          switch (g.type) {
            case 'Polygon':
              g.updateSymbol({
                polygonFill: 'rgb(135,196,240)',
                polygonOpacity: 1,
                lineColor: '#1bbc9b',
                lineWidth: 6,
                lineJoin: 'round', //miter, round, bevel
                lineCap: 'round', //butt, round, square
                lineDasharray: null, //dasharray, e.g. [10, 5, 5]
                'lineOpacity ': 1
              })

              break
            case 'LineString':
              g.updateSymbol({
                lineColor: '#1bbc9b',
                lineWidth: 6,
                lineJoin: 'round', //miter, round, bevel
                lineCap: 'round', //butt, round, square
                lineDasharray: null, //dasharray, e.g. [10, 5, 5]
                'lineOpacity ': 1
              })
              break
            case 'Point':
              console.log(g._coordinates)
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
//添加等值线等值面
function MeshIsoLines() {
  // 根据 breaks 数组的长度定义 colorChart 色带
  var colorChart = [
    '#0000FF', // 深蓝色
    '#0033FF',
    '#0066FF',
    '#0099FF',
    '#00CCFF',
    '#00FFFF',
    '#33FFCC',
    '#66FF99',
    '#99FF66',
    '#CCFF33',
    '#FFFF00', // 黄色
    '#FFCC00',
    '#FF9900',
    '#FF6600',
    '#FF3300',
    '#FF0000', // 红色
    '#CC0000' // 深红色
  ]

  const interpolate_options = {
    gridType: 'points',
    // value 为参数 data 数值字段的key value
    property: 'depth',
    units: 'degrees',
    weight: 10
  }

  var grid = turf.interpolate(meshNodes, 0.05, interpolate_options)

  var breaks = [
    -80, -75, -70, -65, -60, -55, -50, -45, -40, -35, -30, -25, -20, -15, -10,
    -5, 0
  ]
  // 根据色卡生成颜色
  const color = colorChart.map((color) => {
    return { fill: color }
  })

  // 配置
  const isolines_options = {
    // value 为参数 data 数值字段的key value
    zProperty: 'depth',
    commonProperties: {
      'fill-opacity': 0.7
    },
    breaksProperties: color
  }
  // gridIsobands是FeatureCollection <MultiPolygon>类型
  let gridIsobands = turf.isobands(grid, breaks, isolines_options)
  // 先将gridIsobands需要先 flatten() 处理一下
  gridIsobands = turf.flatten(gridIsobands)

  // // 剔除超出区域范围数据
  var dissolved = turf.dissolve(meshJson)
  console.log('融合')
  console.log(dissolved)
  const features = []
  gridIsobands.features.forEach((layer1) => {
    //根据mesh网格裁剪
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

  // 将裁切之后的数据转成FeatureCollection类型
  const geojson = turf.featureCollection(features)

  const geo = new maptalks.GeoJSON.toGeometry(geojson, (geometry) => {
    geometry.config('symbol', {
      lineColor: '#000000',
      lineWidth: 0.2, //等值线宽度,
      lineDasharray: null, //线形
      lineOpacity: 1,
      polygonFill: geometry.properties.fill,
      polygonOpacity: geometry.properties['fill-opacity']
    })
    geometry.addTo(window.map.getLayer('vector'))
  })

  // //创建等值线
  // const lineLayer = new maptalks.LineStringLayer("linelayer");
  // var lines = turf.isolines(grid, breaks, { zProperty: "depth" });
  // var features_lines = [];
  // lines.features.forEach((item) => {
  //   new maptalks.GeoJSON.toGeometry(item).addTo(lineLayer);
  // });

  // console.log("等值线");
  // console.log(lines);

  // const groupLayer = new maptalks.GroupGLLayer("group", [lineLayer]).addTo(
  //   window.map
  // );
}
export default {
  xf,
  addMultiTrian,
  MeshIsoLines,
  DrawTools,
  loadAnXian,
  testTin,
  genTrian,
  addTrian,
  coastLine,
  addMeshNode,
  coastLine2Line,
  coastExplodePoint,
  coastPoint2Line,
  coastSplitLine
}
