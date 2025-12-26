<!--
 * @author: guoqiancheng
 * @since: 2025-10-30
-->
<script setup>
import { getDictList } from '@/api/index.js';
import { onMounted, ref } from 'vue';

const props = defineProps({
  dictCode: {
    type: String,
    required: false
  },
  options: {
    type: Array,
    required: false,
    default: () => []
  }
});
const modelValue = defineModel('value', {
  type: [String, Number, null],
  required: false,
  default: null
});
const dictList = ref([]);
onMounted(() => {
  if (props.dictCode) {
    getDictList({ code: props.dictCode }).then((res) => {
      dictList.value = res.data.map(item => ({
        value: item.code,
        label: item.value
      }));
    });
  }
  else {
    dictList.value = props.options;
  }
});
</script>

<template>
  <div class="container">
    <a-select v-model:value="modelValue" v-bind="$attrs">
      <a-select-option v-for="item in dictList" :key="item.id" :value="item.value">
        {{ item.label }}
      </a-select-option>
    </a-select>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  height: 100%;
}
</style>
