<!--
 * @author: guoqiancheng
 * @since: 2025-01-XX
 * @description: 基于 a-tree-select 的树形选择器组件
-->
<script setup>
import { getDictList } from '@/api/index.js';
import { onMounted, ref, watch } from 'vue';

const props = defineProps({
  // 字典代码，如果提供则从字典获取数据
  dictCode: {
    type: String,
    required: false
  },
  // 树形数据选项
  options: {
    type: Array,
    required: false,
    default: () => []
  },
  // 占位符
  placeholder: {
    type: String,
    default: '请选择'
  },
  // 是否允许清除
  allowClear: {
    type: Boolean,
    default: true
  },
  // 是否默认展开所有节点
  treeDefaultExpandAll: {
    type: Boolean,
    default: false
  },
  // 是否显示搜索框
  showSearch: {
    type: Boolean,
    default: true
  },
  // 是否支持多选
  multiple: {
    type: Boolean,
    default: false
  },
  // 是否显示复选框（多选模式）
  treeCheckable: {
    type: Boolean,
    default: false
  },
  // 字段名配置
  fieldNames: {
    type: Object,
    default: () => ({
      label: 'label',
      value: 'value',
      children: 'children'
    })
  }
});

const modelValue = defineModel('value', {
  type: [String, Number, Array, null],
  required: false,
  default: null
});

// 树形数据
const treeData = ref([]);

// 将普通数组转换为树形结构（如果 options 是普通数组）
function convertToTreeData(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  // 如果数据已经是树形结构（有 children），直接返回
  const hasChildren = data.some(item => item.children && Array.isArray(item.children));
  if (hasChildren) {
    return formatTreeData(data);
  }

  // 如果是普通数组，转换为树形结构
  return formatTreeData(
    data.map(item => ({
      title: item[props.fieldNames.label] || item.label,
      value: item[props.fieldNames.value] || item.value,
      key: item[props.fieldNames.value] || item.value
    }))
  );
}

// 格式化树形数据
function formatTreeData(data) {
  return data.map((item) => {
    const node = {
      title: item[props.fieldNames.label] || item.label || item.title,
      value: item[props.fieldNames.value] || item.value || item.key,
      key: item[props.fieldNames.value] || item.value || item.key
    };

    // 如果有子节点，递归处理
    if (item[props.fieldNames.children] || item.children) {
      const children = item[props.fieldNames.children] || item.children;
      if (Array.isArray(children) && children.length > 0) {
        node.children = formatTreeData(children);
      }
    }

    return node;
  });
}

// 从字典获取数据
async function fetchDictData() {
  if (!props.dictCode) return;

  try {
    const res = await getDictList({ code: props.dictCode });
    if (res && res.data) {
      const dictList = res.data.map(item => ({
        label: item.value,
        value: item.code
      }));
      treeData.value = convertToTreeData(dictList);
    }
  }
  catch (error) {
    console.error('获取字典数据失败:', error);
  }
}

// 初始化数据
onMounted(() => {
  if (props.dictCode) {
    fetchDictData();
  }
  else if (props.options && props.options.length > 0) {
    treeData.value = convertToTreeData(props.options);
  }
});

// 监听 options 变化
watch(
  () => props.options,
  (newOptions) => {
    if (!props.dictCode && newOptions && newOptions.length > 0) {
      treeData.value = convertToTreeData(newOptions);
    }
  },
  { deep: true }
);
</script>

<template>
  <div class="tree-select-container">
    <a-tree-select
      v-model:value="modelValue"
      :tree-data="treeData"
      :placeholder="placeholder"
      :allow-clear="allowClear"
      :tree-default-expand-all="treeDefaultExpandAll"
      :show-search="showSearch"
      :tree-checkable="treeCheckable"
      :multiple="multiple"
      v-bind="$attrs"
    />
  </div>
</template>

<style scoped>
.tree-select-container {
  width: 100%;
  height: 100%;
}
</style>
