<template>
  <div>
    <div id="cesiumContainer"></div>
  </div>
</template>

<script>
/* eslint-disable */
import { Particle3D, Vortex } from 'cesium-particle'

import 'cesium/Build/Cesium/Widgets/widgets.css'
import * as Cesium from 'cesium'
import * as dat from 'dat.gui'
import TIFFImageryProvider from 'tiff-imagery-provider'
import proj4 from 'proj4'
import TerrainCutting from './common/TerrainCutting.js'

export default {
  name: 'CesiumViewer',
  data() {
    return {
      viewer: null,
      TerrainCutting: null,
      config: {
        selectedTerrain: 't8_等值线_100.json',
        offset: 0,
        scale: 3,
        color: '#00ffff'
      }
    }
  },
  mounted() {
    this.init()
    // this.addGeojson()
  },
  methods: {
    //初始化地图
    init() {
      Cesium.Ion.defaultAccessToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMjA3MDk1Ni05YTUxLTQ1YTItYTgxNS1iZTQwODM4NDVmOTciLCJpZCI6MjI1NjE0LCJpYXQiOjE3MTk4MjYxNDR9.nMeglmI4UqBSGUtKT2g6oegxXgBYvR1ATaZ34rrN5OI'

      this.viewer = new Cesium.Viewer('cesiumContainer', {
        // terrainProvider: Cesium.createWorldTerrain(),
        animation: false, // 是否显示动画控件
        homeButton: true, // 是否显示home键
        geocoder: true, // 是否显示地名查找控件        如果设置为true，则无法查询
        baseLayerPicker: true, // 是否显示图层选择控件
        timeline: true, // 是否显示时间线控件
        fullscreenButton: true, // 是否全屏显示
        scene3DOnly: false, // 如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
        infoBox: true, // 是否显示点击要素之后显示的信息
        sceneModePicker: true, // 是否显示投影方式控件  三维/二维
        navigationInstructionsInitiallyVisible: true,
        navigationHelpButton: true, // 是否显示帮助信息控件
        selectionIndicator: true, // 是否显示指示器组件
        // 加载天地图
        imageryProvider: new Cesium.WebMapTileServiceImageryProvider({
          url: 'http://t0.tianditu.com/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=19b72f6cde5c8b49cf21ea2bb4c5b21e',
          layer: 'tdtBasicLayer',
          style: 'default',
          format: 'image/jpeg',
          tileMatrixSetID: 'GoogleMapsCompatible',
          show: false,
          mininumLevel: 0,
          maximumLevel: 16
        })
      })
      this.viewer.scene.globe.depthTestAgainstTerrain = true
      this.viewer.scene.screenSpaceCameraController.minimumZoomDistance = -1000
      this.viewer.scene.camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z
      const outerCoreRadius = 6000000
      this.viewer.entities.add({
        name: 'Outer Core',
        position: Cesium.Cartesian3.ZERO,
        ellipsoid: {
          radii: new Cesium.Cartesian3(
            outerCoreRadius,
            outerCoreRadius,
            outerCoreRadius
          ),
          material: Cesium.Color.BLACK.withAlpha(0.5)
        }
      })
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          // 102.296063,
          // 32.55245,
          // 2000000
          102.10841361613471,
          27.899574509614315,
          20000
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0.0
        },
        duration: 1
      })
      this.useTranslucencyRectangle()
      // this.loadParticle('/nc/5_mask_result_00.nc')
      // this.loadParticle('/nc/5_mask_result_01.nc')
      // this.loadParticle('/nc/5_mask_result_02.nc')
      // this.loadParticle('/nc/5_mask_result_03.nc')
      this.loadParticle('/nc/5_mask_result_00 copy.nc')

      //实例化TerrainCutting类
      this.TerrainCutting = new TerrainCutting(this.viewer)
      //开始挖掘
      this.TerrainCutting.create()
      this.loadGeoJSONTurf(
        `/json/${this.config.selectedTerrain}`,
        this.config.offset,
        this.config.scale,
        this.config.color
      )
    },
    async loadGeoJSONTurf(url, offset, scale, ColorSurface) {
      const viewer = this.viewer
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
    },
    //点击获取粒子值
    addClickHandler(data) {
      var viewer = this.viewer
      // 初始化事件处理器
      var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
      // 监听鼠标点击事件

      handler.setInputAction(function (click) {
        console.log(click.position)
        var cartesian = viewer.scene.pickPosition(click.position)
        console.log(cartesian)
        if (Cesium.defined(cartesian)) {
          var cartographic = Cesium.Cartographic.fromCartesian(cartesian)
          var lon = Cesium.Math.toDegrees(cartographic.longitude)
          var lat = Cesium.Math.toDegrees(cartographic.latitude)

          // 判断点击位置是否在数据范围内
          if (
            lon >= data.lon.min &&
            lon <= data.lon.max &&
            lat >= data.lat.min &&
            lat <= data.lat.max
          ) {
            // 根据经纬度计算索引
            var lonIndex = Math.floor(
              ((lon - data.lon.min) / (data.lon.max - data.lon.min)) *
                (data.dimensions.lon - 1)
            )
            var latIndex = Math.floor(
              ((lat - data.lat.min) / (data.lat.max - data.lat.min)) *
                (data.dimensions.lat - 1)
            )
            var index = latIndex * data.dimensions.lon + lonIndex

            // 获取对应的数据
            var H = data.H.array[index]
            var U = data.U.array[index]
            var V = data.V.array[index]
            var W = data.W.array[index]

            // 输出点击位置的数据
            console.log(`点击位置: 经度=${lon}, 纬度=${lat}`)
            console.log(`H=${H}, U=${U}, V=${V}, W=${W}`)
          } else {
            console.log('点击位置不在数据范围内')
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    },
    //加载粒子
    loadParticle(url) {
      var viewer = this.viewer

      // 粒子系统配置
      const systemOptions = {
        maxParticles: 250000, // 最大粒子数(会自动取平方数)
        particleHeight: 1000.0, // 粒子高度
        fadeOpacity: 0.996, // 拖尾透明度
        dropRate: 0.003, // 粒子重置率
        dropRateBump: 0.01, // 随速度增加的粒子重置率百分比，速度越快越密集，
        // 最终的粒子重置率particleDropRate = dropRate + dropRateBump * speedNorm;
        speedFactor: 1.0, // 粒子速度
        lineWidth: 4.0, // 线宽
        dynamic: true // 是否动态运行
      }

      // 粒子颜色色带
      const colorTable = [
        [0.015686, 0.054902, 0.847059], // 深蓝色，表示低速
        [0.12549, 0.313725, 1.0], // 蓝色
        [0.0, 0.807843, 0.819608], // 青色
        [0.0, 0.988235, 0.0], // 绿色
        [1.0, 1.0, 0.0], // 黄色，表示中速
        [1.0, 0.647059, 0.0], // 橙色
        [1.0, 0.0, 0.0] // 红色，表示高速
      ]
      fetch(url)
        .then((response) => response.blob())
        .then((blob) => {
          // 将 blob 传递给 Particle3D
          const particleObj = new Particle3D(this.viewer, {
            input: blob,
            colorTable: colorTable,

            systemOptions: systemOptions,
            fields: {
              U: 'water_u',
              V: 'water_v',
              H: '',
              W: ''
            }
          })
          // console.log(particleObj)
          // particleObj.data.H.forEach((element) => {
          //   element = 10000
          // })
          //获取数据

          particleObj.init().then((res) => {
            // 将 H.array 中的所有值替换为统一值，例如 10000
            // for (let i = 0; i < particleObj.data.H.array.length; i++) {
            //   particleObj.data.H.array[i] = 1000000.00584891
            // }
            particleObj.show()
            this.addClickHandler(particleObj.data)
          })
          // 更新粒子系统配置的回调函数
          function updateOptions() {
            particleObj.optionsChange(systemOptions)
          }

          // 初始化dat.GUI
          const gui = new dat.GUI()

          // 添加控制面板选项
          gui
            .add(systemOptions, 'maxParticles', 1000, 10000)
            .onChange(updateOptions)
          gui
            .add(systemOptions, 'particleHeight', 0, 5000000)
            .onChange(updateOptions)
          gui
            .add(systemOptions, 'fadeOpacity', 0.9, 1.0)
            .onChange(updateOptions)
          gui.add(systemOptions, 'dropRate', 0.0, 0.1).onChange(updateOptions)
          gui
            .add(systemOptions, 'dropRateBump', 0.0, 0.1)
            .onChange(updateOptions)
          gui
            .add(systemOptions, 'speedFactor', 0.1, 5.0)
            .onChange(updateOptions)
          gui.add(systemOptions, 'lineWidth', 1.0, 10.0).onChange(updateOptions)
        })
      // // 第二种
      // // 构建涡旋模型对象
      // const parameter = [[120, 30, 100], 5, 5, 2000, 0.1, 0.1, 2000] // [['lon', 'lat', 'lev'], 'radiusX', 'radiusY', 'height', 'dx', 'dy', 'dz']
      // const jsonData = new Vortex(...parameter).getData()
      // // 从json数据生成粒子系统对象
      // const particleObj2 = new Particle3D(viewer, {
      //   input: jsonData,
      //   type: 'json', // 必填
      //   userInput: systemOptions,
      //   colorTable: colorTable,
      //   colour: 'height' // 颜色变化跟随速度,可选值: 'speed'(defalut) or 'height'
      // })

      // systemOptions.fadeOpacity = 0.9
      // particleObj.optionsChange(systemOptions) // 更新粒子系统配置

      // particleObj.hide() // 停止粒子系统
      // particleObj.remove() // 移除粒子系统
    }, //隐藏海洋
    useTranslucencyMask() {
      const scene = this.viewer.scene
      const globe = scene.globe
      const baseLayer = this.viewer.scene.imageryLayers.get(0)

      // 隐藏地球的地面大气层
      globe.showGroundAtmosphere = false

      // 设置地球的基础颜色为透明，以便隐藏海洋
      globe.baseColor = Cesium.Color.TRANSPARENT

      // 启用地球的半透明功能，使地球表面可以根据颜色进行透明化处理
      globe.translucency.enabled = true

      // 清除地下颜色设置（默认情况下禁用地下颜色）
      globe.undergroundColor = undefined

      // 将基础图层的颜色设为透明，以隐藏特定颜色的部分（通常是黑色）
      baseLayer.colorToAlpha = new Cesium.Color(0.0, 0.0, 0.0)

      // 设置透明化阈值，低于此值的颜色将变得透明
      baseLayer.colorToAlphaThreshold = 0.2
    },

    useTranslucencyRectangle() {
      let points
      // 假设以下变量是根据用户界面交互来控制的
      let clippingPlanesEnabled = true // 控制是否启用剪切平面
      let edgeStylingEnabled = true // 控制是否启用边缘样式
      const globe = this.viewer.scene.globe

      function loadStHelens() {
        // 定义手动绘制的地理坐标点，使用 Cesium.Cartesian3 进行表示
        // 这些坐标点定义了一个多边形的顶点
        points = [
          new Cesium.Cartesian3(
            -1182592.8630924462,
            5515580.9806405855,
            2966674.365247578
          ),
          new Cesium.Cartesian3(
            -1183337.777477057,
            5515825.617716778,
            2965927.4345367434
          ),
          new Cesium.Cartesian3(
            -1184508.4932830015,
            5515571.328839522,
            2965932.974956288
          ),
          new Cesium.Cartesian3(
            -1185587.0332886775,
            5514889.448799464,
            2966764.2948399023
          )
        ]

        // 打印坐标点，检查是否正确
        console.log(points)

        // 计算裁剪平面的数量
        const pointsLength = points.length
        const clippingPlanes = []

        // 遍历每一个点，生成裁剪平面
        for (let i = 0; i < pointsLength; ++i) {
          // 获取当前点和下一个点（形成边）
          const nextIndex = (i + 1) % pointsLength

          // 计算当前边的中点
          let midpoint = Cesium.Cartesian3.add(
            points[i],
            points[nextIndex],
            new Cesium.Cartesian3()
          )
          midpoint = Cesium.Cartesian3.multiplyByScalar(midpoint, 0.5, midpoint)

          // 计算中点的“上”向量
          // 这里的“上”向量通常是从地球中心到该点的向量，但我们需要定义其他方向
          const up = Cesium.Cartesian3.normalize(
            midpoint,
            new Cesium.Cartesian3()
          )

          // 计算边的方向向量
          let right = Cesium.Cartesian3.subtract(
            points[nextIndex],
            points[i],
            new Cesium.Cartesian3()
          )
          right = Cesium.Cartesian3.normalize(right, right)

          // 计算裁剪平面的法线向量
          // 使用叉积计算平面的法线
          let normal = Cesium.Cartesian3.cross(
            right,
            up,
            new Cesium.Cartesian3()
          )
          normal = Cesium.Cartesian3.normalize(normal, normal)

          // 创建裁剪平面，初始距离为0
          const originCenteredPlane = new Cesium.Plane(normal, 0.0)

          // 计算裁剪平面的实际距离
          const distance = Cesium.Plane.getPointDistance(
            originCenteredPlane,
            midpoint
          )

          // 将裁剪平面添加到裁剪平面列表
          clippingPlanes.push(new Cesium.ClippingPlane(normal, distance))
        }

        // 将计算得到的裁剪平面应用到地球上
        globe.clippingPlanes = new Cesium.ClippingPlaneCollection({
          planes: clippingPlanes, // 添加的裁剪平面集合
          edgeWidth: edgeStylingEnabled ? 1.0 : 0.0, // 控制边缘宽度的样式
          edgeColor: Cesium.Color.WHITE, // 边缘的颜色
          enabled: clippingPlanesEnabled // 是否启用裁剪平面
        })

        // 启用反向面剔除，确保只有裁剪后的面被渲染
        globe.backFaceCulling = true

        // 启用裙边渲染，确保多边形不会出现可见的缝隙
        globe.showSkirts = true
      }

      // 在合适的时机调用 loadStHelens 函数
      loadStHelens()
    }
  }
}
</script>

<style lang="scss" scoped>
#cesiumContainer {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
