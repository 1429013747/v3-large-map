<!--
 * @author: guoqiancheng
 * @since: 2025-09-04
-->
<script setup>
import ImageView from "@/components/common/ImageView/index.vue";

const previewVisible = ref(false);
const currentFile = ref(null);

function handleClick() {
  currentFile.value = {
    createTime: "2026-01-12 13:06:05",
    id: "2010578999582945282",
    fileOriginName: "操作手册.pdf",
    fileSuffix: "pdf",
    fileSizeKb: "3517",
    fileSizeInfo: "3.43 MB",
    filePath:
      "https://lq1990.oss-cn-hangzhou.aliyuncs.com/demo/202601/2010578999582945282_1768194363236.pdf",
    url: "https://lq1990.oss-cn-hangzhou.aliyuncs.com/demo/202601/2010578999582945282_1768194363236.pdf",
  };
  previewVisible.value = true;
}

function handleClose() {
  previewVisible.value = false;
  currentFile.value = null;
}
</script>

<template>
  <div class="test-container">
    <a-button type="primary" @click="handleClick">
      预览PDF文件
    </a-button>

    <ImageView
      v-model:open="previewVisible"
      :file-info="currentFile"
      @close="handleClose"
    />
  </div>
</template>

<style lang="scss" scoped>
.test-container {
  padding: 20px;
}
</style>
