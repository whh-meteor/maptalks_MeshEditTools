<template>
  <div>
    <div
      id="app"
      style="z-index: 999; position: relative; background-color: aliceblue"
    >
      <VueDragResize
        :isActive="true"
        :w="700"
        :h="100"
        v-on:resizing="resize"
        v-on:dragging="resize"
      >
        <el-button type="" @click="LoadTerrain()">加载地形</el-button>
        <el-button type="" @click="LoadPartial()">加载粒子场</el-button>
        <el-button type="" @click="cutting()">地形开挖</el-button>
        <el-button type="" @click="stopCutting()">停止开挖</el-button>
        <el-button type="" @click="hideSeaArea()">隐藏海洋</el-button>
      </VueDragResize>

      <VueDragResize
        :isActive="true"
        :w="700"
        :h="100"
        v-on:resizing="resize"
        v-on:dragging="resize"
      >
        <el-button type="">温度</el-button>
        <el-button type="">盐度</el-button>
        <el-button type="">海流</el-button>
        <el-button type="">风场</el-button>
        <el-button type="">风场</el-button>
        <el-button type="">水深</el-button>
      </VueDragResize>
    </div>
    <div id="cesiumContainer">
      <SeaParticle v-if="showParticle"></SeaParticle>
      <UnderSeaLayer v-if="showUnderSea"></UnderSeaLayer>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import VueDragResize from 'vue-drag-resize'

import 'cesium/Build/Cesium/Widgets/widgets.css'
import * as Cesium from 'cesium'

import TIFFImageryProvider from 'tiff-imagery-provider'
import proj4 from 'proj4'
import TerrainCutting from '../components/TerrainCutting/TerrainCutting.js'
import SeaParticle from '../components/Particle/Particle'
import TerrainCut from '@/components/TerrainCutting/terrainCut.vue'
import UnderSeaLayer from '@/components/UnderSeaLayer/underSea'

import cesiumconfig from '../api/cesium/cesiumconfig.js'
export default {
  name: 'CesiumViewer',
  components: {
    VueDragResize,
    SeaParticle,
    UnderSeaLayer,
    TerrainCut
  },
  data() {
    return {
      viewer: null,
      TerrainCutting: null,
      config: {
        selectedTerrain: 't8_等值线_100.json',
        offset: 0,
        scale: 3,
        color: '#00ffff'
      },
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      showParticle: false,
      showUnderSea: false
    }
  },
  mounted() {
    window.$supervise = this

    this.init()
    // this.loadZoro()
  },
  methods: {
    //初始化地图
    init() {
      Cesium.Ion.defaultAccessToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMjA3MDk1Ni05YTUxLTQ1YTItYTgxNS1iZTQwODM4NDVmOTciLCJpZCI6MjI1NjE0LCJpYXQiOjE3MTk4MjYxNDR9.nMeglmI4UqBSGUtKT2g6oegxXgBYvR1ATaZ34rrN5OI'

      let viewer = (this.viewer = new Cesium.Viewer('cesiumContainer', {
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
      }))
      this.viewer.scene.globe.depthTestAgainstTerrain = true
      this.viewer.scene.screenSpaceCameraController.minimumZoomDistance = -1000
      this.viewer.scene.camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z
      this.fly()
      window.viewer = viewer

      cesiumconfig.addProjectMarker('/json/marker/marker.json')
    },
    stopCutting() {
      this.TerrainCutting.stop()
    },
    cutting() {
      //实例化TerrainCutting类
      this.TerrainCutting = new TerrainCutting(this.viewer)
      //开始挖掘
      this.TerrainCutting.create()
    },
    LoadPartial() {
      this.showParticle = !this.showParticle
    },
    LoadTerrain() {
      this.showUnderSea = !this.showUnderSea
    },
    resize(newRect) {
      this.width = newRect.width
      this.height = newRect.height
      this.top = newRect.top
      this.left = newRect.left
    },
    fly() {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          124.10841361613471,
          28.399574509614315,
          1000000
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: -0.9764350593431694,
          roll: 0.0
        },
        duration: 1
      })
    },

    loadZoro() {
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
