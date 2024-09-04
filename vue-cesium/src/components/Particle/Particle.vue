<template>
  <div>
    <Timeline
      :timelineData="timelineData"
      :activeYear="2021"
      @timeline-event="GetTimeLineYear"
    />
  </div>
</template>

<script>
/* eslint-disable */
import SeaParticle from './SeaParticle'
import Timeline from '../TimeLine/timeline.vue'
export default {
  name: 'seaParticle',
  components: { Timeline },

  data() {
    return {
      timelineData: [
        {
          year: 2022
        },
        {
          year: 2021
        },
        {
          year: 2020
        },
        {
          year: 2019
        },
        {
          year: 2018
        }
      ],
      obj: null
    }
  },
  mounted() {
    this.init()
  },

  methods: {
    init() {
      SeaParticle.loadParticle('nc/merge_nc.nc')
    },
    GetTimeLineYear(payload) {
      switch (payload.year) {
        case 2018:
          SeaParticle.loadParticle('nc/4_result_40.nc')
          SeaParticle.removeParticle()
          break
        case 2019:
          SeaParticle.loadParticle('nc/4_result_10.nc')
          SeaParticle.removeParticle()
          break
        case 2020:
          SeaParticle.loadParticle('nc/4_result_20.nc')
          SeaParticle.removeParticle()
          break
        case 2021:
          SeaParticle.loadParticle('nc/4_result_30.nc')
          SeaParticle.removeParticle()
          break
        case 2022:
          SeaParticle.loadParticle('nc/4_result_40.nc')
          SeaParticle.removeParticle()
          break
        default:
          break
      }
    }
  }
}
</script>
