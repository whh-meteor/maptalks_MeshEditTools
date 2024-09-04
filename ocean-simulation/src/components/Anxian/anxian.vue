<template>
  <div class="anxian-drag">
    <VueDragResize :isActive="true" :w="200" :h="500" v-on:resizing="resize" v-on:dragging="resize">
      <!--文件上传表单-->
      <form>
        <h2>岸线</h2>
        <input type="file" @change="getFile($event)" />
        <!-- <input type="file" @change="getFile2($event)" /> -->
        <el-button @click="submit($event)" type="danger">上传岸线</el-button>
        <el-button @click="loadAnxian()" type="primary">加载岸线</el-button>
        <el-button @click="SelectAnxian()" type="info">绘制岸线</el-button>

        <el-button @click="AxBreakLines()">打断岸线</el-button>
        <el-button @click="combineAnxian()">岸线组合</el-button>
        <el-button @click="removeMeshNets()">岸线加密</el-button>
        <el-button @click="removeMeshNets()">岸线抽吸</el-button>

        <el-button @click="removeMeshNets()">移除岸线</el-button>
        <el-button @click="exportMeshNets()" type="info">导出岸线文件</el-button>
      </form>

      <Controller v-if="isShowController"></Controller>
    </VueDragResize>
  </div>
</template>
<script>
import MapRequest from '@/api/maprequest.js'
import VueDragResize from 'vue-drag-resize'
import anxianconfig from './anxianconfig'
import Controller from './Controller.vue';
import { update } from 'three/examples/jsm/libs/tween.module.js';
import bkAnxian from "@/assets/bkAnxian.json"
import EventBus from "@/api/mapbus"
export default {
  name: 'mesh',
  components: { VueDragResize, Controller },
  data() {
    return {
      file: null,
      file2: null,
      AnxianJSON: null,
      Axlayer: null, // 岸线1
      Axlayer2: null, // 岸线2
      isShowController: false,
      CurrentLayer: null
    }
  },
  created() {
    EventBus.$on('LsLayer', (g) => {
      this.CurrentLayer = g;
      // console.log(this.CurrentLayer)
    });
  },
  mounted() {

  },
  methods: {

    resize(newRect) { },
    getFile(event) {
      // console.log(event)
      this.file = event.target.files[0]
      // console.log(this.file)
    },
    getFile2(event) {
      this.file2 = event.target.files[0]
      // console.log(this.file2)
    },
    //提交文件
    submit(event) {
      event.preventDefault() //取消默认行为
      //创建 formData 对象
      let formData = new FormData()
      // 向 formData 对象中添加文件
      formData.append('file', this.file)
      formData.append('file', this.file2)
      var that = this
      MapRequest.http
        .UploadFile('uploadAxBln', formData)
        .then(function (response) {
          // console.log('res: ', response)
          that.AnxianJSON = response.data.geojson
          // console.log(that.AnxianJSON)
        })
    },
    updateController() {
      this.isShowController = false

      setTimeout(() => {
        this.isShowController = true
      }, 500);


    },
    loadAnxian() {
      this.Axlayer = anxianconfig.loadAnXian(this.AnxianJSON, "anxian1", "LineAnxian1")

      this.Axlayer2 = anxianconfig.loadAnXian(bkAnxian, "anxian2", "LineAnxian2") // 用于组合和打断的测试线

      this.isShowController = !this.isShowController // 开启图层管理
      anxianconfig.SelectedLayersSymbol(this.Axlayer)
    },
    SelectAnxian() {
      // 开启监听


      anxianconfig.SelectedLayersSymbol(this.Axlayer)

      // if (this.CurrentLayer.properties.name == "LineAnxian2") {

      //  

      //   anxianconfig.SelectedLayersSymbol(this.Axlayer2)
      // }


      // anxianconfig.SelectedLayersSymbol(this.Axlayer)
      // console.log(anxianconfig.getSelectedLayers())
    },
    AxBreakLines() {

      if (!this.CurrentLayer.properties) {
        alert("请选中图层")

      } else {
        if (this.CurrentLayer.properties.name == "LineAnxian1") {
          console.log(this.CurrentLayer.properties.name + "," + this.CurrentLayer._layer._id)

          var newAnxian = anxianconfig.breaklines(this.AnxianJSON)

          console.log(newAnxian)


          anxianconfig.loadBreakAnXian(newAnxian.UnSelectedJSON, "breakAnxian", "LineBK1")
          console.log("未选中的JSON部分")
          console.log(newAnxian.UnSelectedJSON)
          // anxianconfig.loadBreakAnXian(newAnxian.filteredFeatures, "breakAnxian", "LineBK2")


        } else if (this.CurrentLayer.properties.name = "LineAnxian2") {
          anxianconfig.breaklines(bkAnxian)
        }
        this.updateController()// 更新图层组件
      }

    },
    combineAnxian() {
      console.log("当前的图层————————————————————" + this.CurrentLayer._layer._id)
      var twoSelectedLayers = anxianconfig.getLastLines()
      var CombineLineJson = anxianconfig.CombineAnxian(twoSelectedLayers[0].toGeoJSON(), twoSelectedLayers[1].toGeoJSON())
      var CombinePointJSON = anxianconfig.convertLineStringToPoints(CombineLineJson)
      anxianconfig.loadAnXian(CombinePointJSON, "mergeAnxian", "finallyAnxian")
      this.updateController()// 更新图层组件
    }
  }
}
</script>
<style>
.anxian-drag {
  z-index: 999;
}
</style>
