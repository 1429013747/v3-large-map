<template>
  <div class="test-container">
    <h1>控制图层面板测试</h1>
    
    <div class="test-controls">
      <a-button type="primary" @click="openPanel">
        打开控制图层面板
      </a-button>
      
      <a-button @click="toggleLayer" style="margin-left: 16px;">
        切换风险点图层
      </a-button>
    </div>

    <div class="test-info">
      <h3>测试信息：</h3>
      <p>面板状态: {{ layerControlVisible ? '打开' : '关闭' }}</p>
      <p>最后操作的图层: {{ lastToggledLayer || '无' }}</p>
      <p>最后点击的图层: {{ lastClickedLayer || '无' }}</p>
    </div>

    <!-- 控制图层面板 -->
    <LayerControlPanel
      v-model:open="layerControlVisible"
      @layer-toggle="handleLayerToggle"
      @layer-click="handleLayerClick"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import LayerControlPanel from "@/components/LayerControlPanel/LayerControlPanel.vue";

// 响应式数据
const layerControlVisible = ref(false);
const lastToggledLayer = ref(null);
const lastClickedLayer = ref(null);

// 方法
const openPanel = () => {
  layerControlVisible.value = true;
};

const toggleLayer = () => {
  // 模拟切换风险点图层
  console.log("模拟切换风险点图层");
};

const handleLayerToggle = (layer) => {
  console.log("图层切换:", layer);
  lastToggledLayer.value = `${layer.name} (${layer.visible ? '显示' : '隐藏'})`;
};

const handleLayerClick = (layer) => {
  console.log("图层点击:", layer);
  lastClickedLayer.value = layer.name;
};
</script>

<style lang="scss" scoped>
.test-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
  
  h1 {
    color: #333;
    margin-bottom: 20px;
  }
  
  .test-controls {
    margin-bottom: 20px;
  }
  
  .test-info {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    h3 {
      color: #333;
      margin-bottom: 16px;
    }
    
    p {
      margin: 8px 0;
      color: #666;
    }
  }
}
</style>
