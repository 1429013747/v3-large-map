<!--
 * @author: guoqiancheng
 * @since: 2025-11-06
-->
<template>
  <div class="container">
    <a-cascader v-model:value="value" v-bind="$attrs" :options="options" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import provinceList from '@/utils/province.js';
// define model 用来绑定级联选择器的值
const value = defineModel('value', {
  type: Array,
  default: () => []
});
const props = defineProps({
  options: {
    type: Array,
    default: () => provinceList
  }
});
</script>

<style scoped>
.container {
  :deep(.ant-select-selection-item) {
    max-width: 246px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
