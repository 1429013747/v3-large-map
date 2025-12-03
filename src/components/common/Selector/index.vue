<!--
 * @author: guoqiancheng
 * @since: 2025-10-30
-->
<template>
  <div class="container">
    <a-select v-model:value="modelValue" v-bind="$attrs">
      <a-select-option v-for="item in dictList" :key="item.id" :value="item.value">
        {{ item.label }}
      </a-select-option>
    </a-select>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getDictList } from '@/api/index.js';
const modelValue = defineModel('value', {
  type: [String, Number, null],
  required: false,
  default: null
});
const dictList = ref([]);
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
onMounted(() => {
  if (props.dictCode) {
    getDictList({ code: props.dictCode }).then((res) => {
      dictList.value = res.data.map((item) => ({
        value: item.code,
        label: item.value
      }));
    });
  } else {
    dictList.value = props.options;
  }
});
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
}
</style>
