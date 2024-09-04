<template>
  <div id="cesiumContainer"></div>
</template>

<script>
/* eslint-disable */
import 'cesium/Build/Cesium/Widgets/widgets.css'
import * as Cesium from 'cesium'
import * as dat from 'dat.gui'
import CesiumWind from './common/cesium-wind.esm.js'
import netcdfjs from './common/netcdfjs.min.js'
import CanvasWindy from './common/windy2D.js'
import windyDatajson from './common/windy_data.json'
export default {
  name: 'CesiumViewer',
  data() {
    return {
      viewer: null,
      gui: null,
      windLayer: null,
      config: {
        selectedTerrain: 't8_等值线_100.json',
        offset: 0,
        scale: 3,
        color: '#00ffff'
      },
      globalConfig: {
        enableGlobalControl: false,
        globalOffset: 0,
        globalScale: 3,
        globalColor: '#00ff00'
      },
      windyConfig: {
        enableViable: false
      },
      terrainOptions: [
        { name: 't8_等值线_100', file: 't8_等值线_100.json' },
        { name: 't9_等高线_100', file: 't9_等高线_100.json' },
        { name: 't10_等值线_100', file: 't10_等值线_100.json' },
        { name: 't13_等值线_100', file: 't13_等值线_100.json' }
      ],
      options: {
        age: 120,
        particlesNumber: 2000,
        frameRate: 1,

        speedRate: 3000
      },
      windData: {},
      windycanvas: null
    }
  },
  mounted() {
    this.init()
    this.initGUI()
    // this.loadNetCDF('/nc/demo.nc')
  },
  methods: {
    //初始化地图
    init() {
      Cesium.Ion.defaultAccessToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMjA3MDk1Ni05YTUxLTQ1YTItYTgxNS1iZTQwODM4NDVmOTciLCJpZCI6MjI1NjE0LCJpYXQiOjE3MTk4MjYxNDR9.nMeglmI4UqBSGUtKT2g6oegxXgBYvR1ATaZ34rrN5OI'

      this.viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider:
          Cesium.createDefaultTerrainProviderViewModels()[1].provider
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
          114.296063,
          30.55245,
          20000000
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0.0
        },
        duration: 10
      })

      this.useTranslucencyMask()
      this.loadGeoJSONTurf(
        `/json/${this.config.selectedTerrain}`,
        this.config.offset,
        this.config.scale,
        this.config.color
      )

      Cesium.GeoJsonDataSource.load('/json/等值面_10.json', {
        clampToGround: false, // 将数据贴地渲染
        stroke: Cesium.Color.WHITE,
        fill: Cesium.Color.BLUE.withAlpha(0.3), //注意：颜色必须大写，即不能为blue
        strokeWidth: 5
      }).then((dataSource) => {
        console.log(dataSource)
        this.viewer.dataSources.add(dataSource)
        // this.ColorScheme(dataSource)// 分级设色
      })

      // //windy
      // setTimeout(() => {
      //   this.windycanvas = document.createElement('canvas')
      //   this.windycanvas.setAttribute('id', 'windycanvas')
      //   this.windycanvas.style.position = 'fixed'
      //   // this.windycanvas.style['pointer-event'] = 'none'
      //   this.windycanvas.style['z-index'] = 100
      //   this.windycanvas.style.top = 0
      //   document.getElementById('cesiumContainer').appendChild(this.windycanvas)
      //   this.addWindLayer()
      // }, 500)
    },
    addWindLayer() {
      this.windData = windyDatajson
      // 将 udata 和 vdata 转换为 Float32Array
      this.windData.udata = new Float32Array(this.windData.udata)
      this.windData.vdata = new Float32Array(this.windData.vdata)
      console.log(this.windData)
      let windParams = {
        viewer: this.viewer,
        canvas: this.windycanvas,
        canvasWidth: window.innerWidth,
        canvasHeight: window.innerHeight,
        speedRate: this.options.speedRate,
        maxAge: this.options.age,
        frameRate: this.options.frameRate,
        particlesNumber: this.options.particlesNumber
      }
      console.log(this.windData)
      console.log(windParams)
      var windy = new CanvasWindy(this.windData, windParams)

      this.resizeCanvas(windy)
    },
    resizeCanvas(windy) {
      if (this.windycanvas == null) {
        return
      }
      this.windycanvas.width = window.innerWidth
      this.windycanvas.height = window.innerHeight
      if (windy) {
        windy._resize(this.windycanvas.width, this.windycanvas.height)
      }
    },

    // ColorScheme(dataSource) {
    //   // 定义颜色分级
    //   const colorLevels = [
    //     { min: 0, max: 10, color: Cesium.Color.BLUE },
    //     { min: 10, max: 20, color: Cesium.Color.GREEN },
    //     { min: 20, max: 30, color: Cesium.Color.YELLOW },
    //     { min: 30, max: 40, color: Cesium.Color.RED }
    //   ]

    //   // 获取所有的 entities
    //   const entities = dataSource.entities.values

    //   // 遍历所有 entities
    //   entities.forEach((entity) => {
    //     if (entity.polygon) {
    //       const properties = entity.properties // 获取实体的属性

    //       // 假设有一个名为 "value" 的属性用于决定颜色
    //       const value = properties.getValue
    //         ? properties.getValue('value')
    //         : undefined

    //       if (value !== undefined) {
    //         // 根据 value 设置颜色
    //         for (const level of colorLevels) {
    //           if (value >= level.min && value < level.max) {
    //             entity.polygon.material = level.color
    //             break
    //           }
    //         }
    //       }
    //     }
    //   })
    // },

    //初始化控制面板
    initGUI() {
      this.gui = new dat.GUI()

      // 全局控制分组
      const globalFolder = this.gui.addFolder('全局地形控制')
      globalFolder
        .add(this.globalConfig, 'enableGlobalControl')
        .name('启用全局控制')
        .onChange(this.updateAllTerrains)
      globalFolder
        .add(this.globalConfig, 'globalOffset', -50000, 50000)
        .name('全局偏移系数')
        .onChange(this.updateAllTerrains)
      globalFolder
        .add(this.globalConfig, 'globalScale', 1, 10)
        .name('全局拉伸系数')
        .onChange(this.updateAllTerrains)
      globalFolder
        .addColor(this.globalConfig, 'globalColor')
        .name('全局颜色')
        .onChange(this.updateAllTerrains)
      globalFolder.open()

      // 单独地形控制分组
      const terrainFolder = this.gui.addFolder('单独地形控制')
      terrainFolder
        .add(
          this.config,
          'selectedTerrain',
          this.terrainOptions.map((o) => o.file)
        )
        .name('选择地形')
        .onChange(this.updateTerrain)
      terrainFolder
        .add(this.config, 'offset', -50000, 50000)
        .name('偏移系数')
        .onChange(this.updateTerrain)
      terrainFolder
        .add(this.config, 'scale', 1, 10)
        .name('拉伸系数')
        .onChange(this.updateTerrain)
      terrainFolder
        .addColor(this.config, 'color')
        .name('颜色')
        .onChange(this.updateTerrain)
      terrainFolder.open()
      // 风场控制分组
      const windy = this.gui.addFolder('风场控制')
      windy
        .add(this.windyConfig, 'enableViable')
        .name('风场显示')
        .onChange(this.updateCloseWindy)
      windy.add(this, 'loadWindLayer').name('加载风场')
    },

    // 新的手动加载风场方法
    loadWindLayer() {
      if (!this.windLayer) {
        // 检查是否已经加载了风场
        this.loadNetCDF('/nc/UV010P202001_v4.nc')
      } else {
        console.log('风场已加载')
      }
    },
    //风场隐藏
    updateCloseWindy() {
      if (this.windLayer) {
        this.windyConfig.enableViable = !this.windyConfig.enableViable
        this.windLayer.canvas.style.display = this.windyConfig.enableViable
          ? 'block'
          : 'none'
      }
    },
    //更新地形
    updateTerrain() {
      if (!this.globalConfig.enableGlobalControl) {
        this.viewer.scene.primitives.removeAll()
        this.loadGeoJSONTurf(
          `/json/${this.config.selectedTerrain}`,
          this.config.offset,
          this.config.scale,
          this.config.color
        )
      }
    },
    //更新全部地形
    updateAllTerrains() {
      if (this.globalConfig.enableGlobalControl) {
        this.viewer.scene.primitives.removeAll()
        this.terrainOptions.forEach((option) => {
          this.loadGeoJSONTurf(
            `/json/${option.file}`,
            this.globalConfig.globalOffset,
            this.globalConfig.globalScale,
            this.globalConfig.globalColor
          )
        })
      } else {
        this.updateTerrain()
      }
    },
    //隐藏海洋
    useTranslucencyMask() {
      const scene = this.viewer.scene
      const globe = scene.globe
      const baseLayer = this.viewer.scene.imageryLayers.get(0)
      globe.showGroundAtmosphere = false
      globe.baseColor = Cesium.Color.TRANSPARENT
      globe.translucency.enabled = true
      globe.undergroundColor = undefined

      baseLayer.colorToAlpha = new Cesium.Color(0.0, 0.0, 0.0)
      baseLayer.colorToAlphaThreshold = 0.2
    },
    loadNetCDF(filePath) {
      var viewer = this.viewer
      return new Promise(function (resolve) {
        var request = new XMLHttpRequest()
        request.open('GET', filePath)
        request.responseType = 'arraybuffer'

        request.onload = function () {
          var arrayToMap = function arrayToMap(array) {
            return array.reduce(function (map, object) {
              map[object.name] = object
              return map
            }, {})
          }

          var NetCDF = new netcdfjs(request.response)

          // resolve(data);
          // 提取维度数据
          var lonArray = Array.from(NetCDF.getDataVariable('lat'))
          var latArray = Array.from(NetCDF.getDataVariable('lon'))

          // 提取U和V变量数据
          var uArray = Array.from(NetCDF.getDataVariable('U').flat())
          var vArray = Array.from(NetCDF.getDataVariable('V').flat())

          // // 用于存储过滤后的U和V数据
          // var filteredUArray = []
          // var filteredVArray = []

          // 用于存储保留的U和V数据
          var newUArray = []
          var newVArray = []

          // // 计算风向并进行过滤
          // for (let i = 0; i < uArray.length; i++) {
          //   // 计算风向（角度），atan2 返回的角度范围是 -π 到 π，因此需要转换为 0° 到 360° 范围
          //   let angle = Math.atan2(vArray[i], uArray[i]) * (180 / Math.PI)
          //   if (angle < 0) {
          //     angle += 360 // 将负角度转换为正角度
          //   }

          //   // 如果风向在70°-100°和250°-280°范围内，将其添加到过滤数组中
          //   if (
          //     (angle >= 70 && angle <= 100) ||
          //     (angle >= 250 && angle <= 280)
          //   ) {
          //     filteredUArray.push(uArray[i])
          //     filteredVArray.push(vArray[i])
          //   } else {
          //     // 否则，将其保留在新的数组中
          //     newUArray.push(uArray[i])
          //     newVArray.push(vArray[i])
          //   }
          // }

          // uArray = newUArray
          // vArray = newVArray
          // 创建U的JSON对象
          var uData = {
            header: {
              parameterCategory: 1,
              parameterNumber: 2,
              la1: 90.5,
              la2: -90.5,
              lo1: -180.5,
              lo2: 179.5,
              extent: [-180.5, -90.5, 179.5, 90.5],
              nx: 360,
              ny: 181,
              dx: 1,
              dy: 1,
              min: -20.7940673828125,
              max: 30.6459312438965,
              GRIB_COMMENT: 'u-component of wind [m/s]',
              GRIB_DISCIPLINE: '0(Meteorological)',
              GRIB_ELEMENT: 'UGRD',
              GRIB_FORECAST_SECONDS: '0 sec',
              GRIB_IDS:
                'CENTER=7(US-NCEP) SUBCENTER=0 MASTER_TABLE=2 LOCAL_TABLE=1 SIGNF_REF_TIME=1(Start_of_Forecast) REF_TIME=2020-06-20T00:00:00Z PROD_STATUS=0(Operational) TYPE=1(Forecast)',
              GRIB_PDS_PDTN: '0',
              GRIB_PDS_TEMPLATE_ASSEMBLED_VALUES:
                '2 2 2 0 81 0 0 1 0 103 0 10 255 0 0',
              GRIB_PDS_TEMPLATE_NUMBERS:
                '2 2 2 0 81 0 0 0 1 0 0 0 0 103 0 0 0 0 10 255 0 0 0 0 0',
              GRIB_REF_TIME: '1592611200 sec UTC',
              GRIB_SHORT_NAME: '10-HTGL',
              GRIB_UNIT: '[m/s]',
              GRIB_VALID_TIME: '1592611200 sec UTC'
            },
            data: uArray
          }

          // 创建V的JSON对象
          var vData = {
            header: {
              parameterCategory: 1,
              parameterNumber: 3,
              la1: 90.5,
              la2: -90.5,
              lo1: -180.5,
              lo2: 179.5,
              extent: [-180.5, -90.5, 179.5, 90.5],
              nx: 360,
              ny: 181,
              dx: 1,
              dy: 1,
              min: -22.7341823577881,
              max: 22.6458168029785,
              GRIB_COMMENT: 'v-component of wind [m/s]',
              GRIB_DISCIPLINE: '0(Meteorological)',
              GRIB_ELEMENT: 'VGRD',
              GRIB_FORECAST_SECONDS: '0 sec',
              GRIB_IDS:
                'CENTER=7(US-NCEP) SUBCENTER=0 MASTER_TABLE=2 LOCAL_TABLE=1 SIGNF_REF_TIME=1(Start_of_Forecast) REF_TIME=2020-06-20T00:00:00Z PROD_STATUS=0(Operational) TYPE=1(Forecast)',
              GRIB_PDS_PDTN: '0',
              GRIB_PDS_TEMPLATE_ASSEMBLED_VALUES:
                '2 3 2 0 81 0 0 1 0 103 0 10 255 0 0',
              GRIB_PDS_TEMPLATE_NUMBERS:
                '2 3 2 0 81 0 0 0 1 0 0 0 0 103 0 0 0 0 10 255 0 0 0 0 0',
              GRIB_REF_TIME: '1592611200 sec UTC',
              GRIB_SHORT_NAME: '10-HTGL',
              GRIB_UNIT: '[m/s]',
              GRIB_VALID_TIME: '1592611200 sec UTC'
            },
            data: vArray
          }

          // 将U和V对象整合到数组中
          var result = [uData, vData]
          console.log(result)

          const windOptions = {
            colorScale: [
              'rgb(36,104, 180)',
              'rgb(60,157, 194)',
              'rgb(128,205,193 )',
              'rgb(151,218,168 )',
              'rgb(198,231,181)',
              'rgb(238,247,217)',
              'rgb(255,238,159)',
              'rgb(252,217,125)',
              'rgb(255,182,100)',
              'rgb(252,150,75)',
              'rgb(250,112,52)',
              'rgb(245,64,32)',
              'rgb(237,45,28)',
              'rgb(220,24,32)',
              'rgb(180,0,35)'
            ],
            frameRate: 16,
            maxAge: 60,
            globalAlpha: 0.9,
            velocityScale: 1 / 30,
            paths: 2000
          }
          const windLayer = new CesiumWind(result, { windOptions })
          windLayer.addTo(viewer)
          resolve(windLayer)
        }

        request.send()
      }).then((windLayer) => {
        this.windLayer = windLayer // 将风场图层实例保存
      })
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
