<template>
  <div>
    <div id="map"></div>
    <mesh v-if="isShowMeshTools"></mesh>
    <anxian v-if="isShowAnxian"></anxian>
    <FvcomeRes v-if="isShowFvRes"></FvcomeRes>
  </div>
</template>

<script>
import 'maptalks/dist/maptalks.css' // 导入 maptalks 的 CSS 样式
import mapconfig from '@/api/mapconfig.js'


export default {
  name: 'MapComponent', // 组件的名称
  components: {
    mesh: () => import('@/components/Mesh/mesh.vue'),
    anxian: () => import('@/components/Anxian/anxian.vue'),
    FvcomeRes: () => import('@/components/FvComeRes/fvcome-res.vue')
  },
  data() {
    return {
      // 可以在这里定义组件的数据
      coordinates: null,
      bohaiPolygon: null,
      map: null,
      isShowMeshTools: false,
      isShowAnxian: false,
      isShowFvRes: false
    }
  },

  mounted() {
    this.initMapTalk() // 在组件挂载后初始化地图
  },
  methods: {
    initMapTalk() {
      // 创建一个新的 maptalks.Map 实例
      this.map = new maptalks.Map('map', {
        center: [120.623049, 38.498568], // 设置地图中心的经纬度坐标
        zoom: 8, // 设置地图的初始缩放级别
        baseLayer: new maptalks.TileLayer('base', {
          urlTemplate:
            'http://192.168.3.200:8086/gis/{z}/{y}/{x}.png', // 设置瓦片图层的 URL 模板
          subdomains: ['a', 'b', 'c', 'd'], // 设置子域
          attribution:
            '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>' // 设置版权信息
        }),
        layerSwitcherControl: {
          'position': 'top-right',
          // title of base layers
          'baseTitle': 'Base Layers',
          // title of layers
          'overlayTitle': 'Layers',
          // layers you don't want to manage with layer switcher
          'excludeLayers': [],
          // css class of container element, maptalks-layer-switcher by default
          'containerClass': 'maptalks-layer-switcher'
        },
      })
      window.map = this.map
      var drawBox = mapconfig.DrawTools()
      var self = this
      // 创建一个工具栏并添加到地图中
      var toolbar = new maptalks.control.Toolbar({
        items: [
          {
            item: '工具栏', // 工具栏的主项目
            children: [
              {
                item: '网格工具',
                click: function () {
                  self.isShowMeshTools = !self.isShowMeshTools
                }
              },
              {
                item: '岸线工具',
                click: function () {
                  self.isShowAnxian = !self.isShowAnxian
                }
              },
              {
                item: 'FVCOME结果',
                click: function () {
                  self.isShowFvRes = !self.isShowFvRes
                }
              }
            ] // 子项目，即各种绘图模式
          },
          {
            item: 'Shape', // 工具栏的主项目
            children: drawBox.items // 子项目，即各种绘图模式
          },
          {
            item: 'Disable', // 禁用绘图工具的按钮
            click: function () {
              drawBox.drawTool.disable() // 禁用绘图工具
            }
          },
          {
            item: 'Clear', // 清除矢量图层的按钮
            click: function () {
              drawBox.layer.clear() // 清空矢量图层
            }
          },

          {
            item: 'mesh网格解析',
            click: function () { },
            children: [
              {
                item: '加载mesh网格',
                click: function () {
                  mapconfig.addTrian()
                }
              },
              {
                item: 'mesh网格(MultiPolygon)',
                click: function () {
                  mapconfig.addMultiTrian(drawBox.drawTool, drawBox.layer)
                }
              },
              {
                item: '加载mesh节点',
                click: function () {
                  mapconfig.addMeshNode()
                }
              },
              {
                item: 'mesh等值线',
                click: function () {
                  mapconfig.MeshIsoLines()
                }
              },
              {
                item: '吸附编辑',
                click: function () {
                  mapconfig.xf()
                }
              },
              {
                item: 'Tin',
                click: function () {
                  mapconfig.genTrian()
                }
              }
            ]
          },
          {
            item: '岸线范围', // 清除矢量图层的按钮
            click: function () {
              mapconfig.coastLine()
            },
            children: [
              {
                item: '岸线加载',
                click: function () {
                  mapconfig.loadAnXian()
                }
              },
              {
                item: '面转线',
                click: function () {
                  mapconfig.coastLine2Line()
                }
              },
              {
                item: '要素转点',
                click: function () {
                  mapconfig.coastExplodePoint()
                }
              },
              {
                item: '点转线',
                click: function () {
                  mapconfig.coastPoint2Line()
                }
              },
              {
                item: '分割线',
                click: function () {
                  mapconfig.coastSplitLine()
                }
              }
            ]
          }
        ]
      }).addTo(this.map)
    }
  }
}
</script>

<style scoped>
/* 可以添加自定义样式 */
html,
body {
  margin: 0px;
  height: 100%;
  width: 100%;
}

#map {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
