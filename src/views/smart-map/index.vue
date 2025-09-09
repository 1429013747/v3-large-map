<!--
 * @author: guoqiancheng
 * @since: 2025-09-09
-->
<template>
  <div class="container">
    <MapLayout :showMap="true" :enableScale="true" title="智能地图">
      <template #map>
        <div class="map-container"></div>
      </template>
      <template #default>
        <div class="main-container">asdf</div>
      </template>
    </MapLayout>
  </div>
</template>

<script setup>
import { useGlobalLoading } from "@/components/common/GlobalLoading/useGlobalLoading";
import MapLayout from "@/layouts/MapLayout.vue";

const { startLoading, stopLoading } = useGlobalLoading();

onMounted(() => {
  const key = startLoading();
  setTimeout(() => {
    stopLoading(key);
  }, 1000);
});
</script>

<style scoped></style>
