<template>
  <div></div>
</template>

<script>
/* eslint-disable */
import UnderSeaLayer from './UnderSeaLayer'
export default {
  name: 'UnderSea',

  data() {
    return {
      config: {
        selectedTerrain: 't8_等值线_100.json',
        offset: 0,
        scale: 3,
        color: '#00ffff'
      },
      terrainOptions: [
        { name: 't8_等值线_100', file: 't8_等值线_100.json' },
        { name: 't9_等高线_100', file: 't9_等高线_100.json' },
        { name: 't10_等值线_100', file: 't10_等值线_100.json' },
        { name: 't13_等值线_100', file: 't13_等值线_100.json' }
      ],
      globalConfig: {
        enableGlobalControl: false,
        globalOffset: 0,
        globalScale: 3,
        globalColor: '#00ff00'
      }
    }
  },
  mounted() {
    this.init()
  },

  methods: {
    init() {
      UnderSeaLayer.initGUI(this.config, this.globalConfig, this.terrainOptions)
      UnderSeaLayer.LoadGeologicalLayer(
        `/json/${this.config.selectedTerrain}`,
        this.config.offset,
        this.config.scale,
        this.config.color
      )
    }
  }
}
</script>
