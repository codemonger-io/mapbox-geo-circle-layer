<script setup lang="ts">
import { GeoCircleLayer } from 'mapbox-geo-circle-layer'
import mapboxgl from 'mapbox-gl'
import { markRaw, ref, watchEffect } from 'vue'

import mapboxConfig from '../configs/mapbox-config'

const circleLayerParameters = [
  {
    radiusInMeters: 100,
    center: { lng: 139.7671, lat: 35.6812 },
    fill: { red: 0.25, green: 0.25, blue: 0.5, alpha: 0.5 }
  },
  {
    radiusInMeters: 250,
    center: { lng: 139.7671, lat: 35.6812 },
    fill: { red: 0.5, green: 0.25, blue: 0.25, alpha: 0.3 }
  },
  {
    radiusInMeters: 1000,
    center: { lng: 139.7671, lat: 35.6812 },
    fill: { red: 0.25, green: 0.5, blue: 0.25, alpha: 0.75 }
  }
]
const circleLayer = new GeoCircleLayer('example-circle', circleLayerParameters[0])

const mapContainer = ref<HTMLElement>()
const map = ref<mapboxgl.Map>()
const circleLayerParamIndex = ref(0)

// configures the map when the map container becomes ready
watchEffect(() => {
  if (mapContainer.value == null) {
    return
  }
  if (map.value != null) {
    console.warn('map has already been initialized')
  }
  mapboxgl.accessToken = mapboxConfig.accessToken
  map.value = markRaw(
    new mapboxgl.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [139.7671, 35.6812], // Tokyo station
      zoom: 15
    })
  )
  map.value.on('load', () => {
    map.value!.addLayer(circleLayer)
    map.value!.on('click', () => {
      ++circleLayerParamIndex.value
      if (circleLayerParamIndex.value >= circleLayerParameters.length) {
        circleLayerParamIndex.value = 0
      }
      const params = circleLayerParameters[circleLayerParamIndex.value]
      circleLayer.radiusInMeters = params.radiusInMeters
      circleLayer.center = params.center
      circleLayer.fill = params.fill
    })
  })
})
</script>

<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}
</style>
