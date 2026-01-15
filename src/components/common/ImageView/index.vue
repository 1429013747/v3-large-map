<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import {
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  DownloadOutlined,
  FileTextOutlined,
} from "@ant-design/icons-vue";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  fileInfo: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(["update:open", "close"]);
// 从 public 目录动态加载 pdfjs-dist
let pdfjsLib = null;
let loadingPromise = null;

// 初始化 pdfjs-dist（从 public 目录加载）
async function initPdfJs() {
  if (pdfjsLib) return pdfjsLib;

  // 如果正在加载，等待加载完成
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || "/";
      const pdfPath =
        baseUrl === "/"
          ? "/pdfjs-dist/build/pdf.min.mjs"
          : `${baseUrl}pdfjs-dist/build/pdf.min.mjs`.replace(/\/\//g, "/");

      // 设置 worker 路径
      const workerPath =
        baseUrl === "/"
          ? "/pdfjs-dist/build/pdf.worker.min.mjs"
          : `${baseUrl}pdfjs-dist/build/pdf.worker.min.mjs`.replace(
              /\/\//g,
              "/"
            );

      // 使用 fetch 加载文件内容，然后通过 data URL 导入
      const response = await fetch(pdfPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF.js: ${response.statusText}`);
      }

      const code = await response.text();

      // 创建一个 blob URL
      const blob = new Blob([code], { type: "application/javascript" });
      const blobUrl = URL.createObjectURL(blob);

      try {
        // 动态导入 blob URL
        pdfjsLib = await import(/* @vite-ignore */ blobUrl);

        // 设置 worker 路径
        if (pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
        }

        // 调试信息（开发环境）
        if (import.meta.env.DEV) {
          console.log("PDF.js 已从 public 目录加载");
          console.log("PDF.js Worker 路径:", workerPath);
        }

        return pdfjsLib;
      } finally {
        // 清理 blob URL
        URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error("加载 PDF.js 失败:", error);
      throw error;
    }
  })();

  return loadingPromise;
}

const visible = computed({
  get: () => props.open,
  set: (val) => emit("update:open", val),
});

// 文件信息
const fileUrl = computed(() => {
  return props.fileInfo?.url || props.fileInfo?.filePath || "";
});

const fileSuffix = computed(() => {
  return props.fileInfo?.fileSuffix?.toLowerCase() || "";
});

const isPdf = computed(() => {
  return (
    fileSuffix.value === "pdf" || fileUrl.value.toLowerCase().endsWith(".pdf")
  );
});

const isImage = computed(() => {
  const imageTypes = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
  return (
    imageTypes.includes(fileSuffix.value) ||
    /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileUrl.value)
  );
});

// PDF相关
const pdfContainer = ref(null);
const pdfCanvas = ref(null);
const loading = ref(false);
const currentPage = ref(1);
const totalPages = ref(0);
const scale = ref(1);
const pageInput = ref(1);
let pdfDoc = null;
let renderTask = null;

// 加载PDF
async function loadPdf() {
  if (!isPdf.value || !fileUrl.value) return;

  try {
    loading.value = true;

    // 确保 pdfjs-dist 已加载
    const pdfLib = await initPdfJs();
    if (!pdfLib) {
      throw new Error("PDF.js 加载失败");
    }

    const loadingTask = pdfLib.getDocument({
      url: fileUrl.value,
      withCredentials: false,
    });

    pdfDoc = await loadingTask.promise;
    totalPages.value = pdfDoc.numPages;
    currentPage.value = 1;
    pageInput.value = 1;
    scale.value = 1;

    await renderPage(1);
  } catch (error) {
    console.error("PDF加载失败:", error);
    // 可以显示错误提示
  } finally {
    loading.value = false;
  }
}

// 渲染PDF页面
async function renderPage(pageNum) {
  if (!pdfDoc || !pdfCanvas.value) return;

  try {
    // 取消之前的渲染任务
    if (renderTask) {
      renderTask.cancel();
    }

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });

    const canvas = pdfCanvas.value;
    const context = canvas.getContext("2d");

    // 计算合适的缩放比例以适应容器
    const containerWidth = pdfContainer.value?.clientWidth || 1000;
    const containerHeight = pdfContainer.value?.clientHeight || 800;

    const scaleX = (containerWidth - 40) / viewport.width;
    const scaleY = (containerHeight - 200) / viewport.height;
    const autoScale = Math.min(scaleX, scaleY, 1.5); // 最大1.5倍

    const scaledViewport = page.getViewport({ scale: autoScale * scale.value });

    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
    };

    renderTask = page.render(renderContext);
    await renderTask.promise;
  } catch (error) {
    if (error.name !== "RenderingCancelledException") {
      console.error("PDF渲染失败:", error);
    }
  }
}

// 上一页
function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    pageInput.value = currentPage.value;
    renderPage(currentPage.value);
  }
}

// 下一页
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    pageInput.value = currentPage.value;
    renderPage(currentPage.value);
  }
}

// 跳转到指定页
function goToPage() {
  const page = Number(pageInput.value);
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    renderPage(page);
  } else {
    pageInput.value = currentPage.value;
  }
}

// 放大
function zoomIn() {
  if (scale.value < 3) {
    scale.value = Math.min(scale.value + 0.25, 3);
    renderPage(currentPage.value);
  }
}

// 缩小
function zoomOut() {
  if (scale.value > 0.5) {
    scale.value = Math.max(scale.value - 0.25, 0.5);
    renderPage(currentPage.value);
  }
}

// 重置缩放
function resetZoom() {
  scale.value = 1;
  renderPage(currentPage.value);
}

// 下载文件
function downloadFile() {
  if (fileUrl.value) {
    const link = document.createElement("a");
    link.href = fileUrl.value;
    link.download = props.fileInfo?.fileOriginName || "download";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// 关闭
function handleClose() {
  // 清理PDF资源
  if (renderTask) {
    renderTask.cancel();
    renderTask = null;
  }
  pdfDoc = null;
  currentPage.value = 1;
  totalPages.value = 0;
  scale.value = 1;

  emit("close");
}

// 监听打开状态
watch(
  () => props.open,
  (newVal) => {
    if (newVal && isPdf.value) {
      nextTick(() => {
        loadPdf();
      });
    }
  },
  { immediate: true }
);

// 监听文件变化
watch(
  () => props.fileInfo,
  () => {
    if (props.open && isPdf.value) {
      nextTick(() => {
        loadPdf();
      });
    }
  },
  { deep: true }
);

onUnmounted(() => {
  if (renderTask) {
    renderTask.cancel();
  }
});
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="fileInfo?.fileOriginName || '文件预览'"
    :width="1200"
    :centered="true"
    :mask-closable="true"
    :footer="null"
    class="file-preview-modal"
    @cancel="handleClose"
  >
    <template #closeIcon>
      <CloseOutlined style="color: #ffffff; font-size: 16px" />
    </template>

    <div class="file-preview-container">
      <!-- PDF预览 -->
      <div v-if="isPdf" ref="pdfContainer" class="pdf-viewer">
        <div class="pdf-toolbar">
          <div class="toolbar-left">
            <a-button-group>
              <a-button :disabled="currentPage <= 1" @click="prevPage">
                <template #icon>
                  <LeftOutlined />
                </template>
                上一页
              </a-button>
              <a-button :disabled="currentPage >= totalPages" @click="nextPage">
                下一页
                <template #icon>
                  <RightOutlined />
                </template>
              </a-button>
            </a-button-group>
            <span class="page-info">
              第 {{ currentPage }} / {{ totalPages }} 页
            </span>
            <a-input-number
              v-model:value="pageInput"
              :min="1"
              :max="totalPages"
              :precision="0"
              size="small"
              style="width: 80px; margin: 0 8px"
              @press-enter="goToPage"
            />
            <a-button :disabled="scale <= 0.5" @click="zoomOut">
              <template #icon>
                <ZoomOutOutlined />
              </template>
            </a-button>
            <span class="zoom-info">{{ Math.round(scale * 100) }}%</span>
            <a-button :disabled="scale >= 3" @click="zoomIn">
              <template #icon>
                <ZoomInOutlined />
              </template>
            </a-button>
            <a-button @click="resetZoom">
              <template #icon>
                <FullscreenOutlined />
              </template>
              适应宽度
            </a-button>
          </div>
          <div class="toolbar-right">
            <a-button type="primary" @click="downloadFile">
              <template #icon>
                <DownloadOutlined />
              </template>
              下载
            </a-button>
          </div>
        </div>
        <div class="pdf-content" :style="{ transform: `scale(${scale})` }">
          <canvas ref="pdfCanvas" class="pdf-canvas" />
        </div>
        <div v-if="loading" class="loading-mask">
          <a-spin size="large" tip="加载中..." />
        </div>
      </div>

      <!-- 图片预览 -->
      <div v-else-if="isImage" class="image-viewer">
        <img
          :src="fileUrl"
          :alt="fileInfo?.fileOriginName"
          class="preview-image"
        >
      </div>

      <!-- 不支持的文件类型 -->
      <div v-else class="unsupported-file">
        <FileTextOutlined style="font-size: 64px; color: #999" />
        <p>不支持预览此文件类型</p>
        <a-button type="primary" @click="downloadFile">
          <template #icon>
            <DownloadOutlined />
          </template>
          下载文件
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped>
.file-preview-modal {
  :deep(.ant-modal-content) {
    background: #1a1a1a;
    border-radius: 8px;
  }

  :deep(.ant-modal-header) {
    background: #1a1a1a;
    border-bottom: 1px solid #333;
    padding: 16px 24px;

    .ant-modal-title {
      color: #fff;
      font-size: 16px;
      font-weight: 500;
    }
  }

  :deep(.ant-modal-body) {
    padding: 0;
    background: #1a1a1a;
  }
}

.file-preview-container {
  width: 100%;
  height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a2a;
  position: relative;
}

.pdf-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.pdf-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
  flex-shrink: 0;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
  }

  .page-info {
    color: #fff;
    font-size: 14px;
    margin: 0 8px;
  }

  .zoom-info {
    color: #fff;
    font-size: 14px;
    min-width: 50px;
    text-align: center;
  }

  :deep(.ant-btn) {
    color: #fff;
    border-color: #434343;
    background: #262626;

    &:hover:not(:disabled) {
      border-color: #1890ff;
      color: #1890ff;
    }

    &:disabled {
      color: #666;
      border-color: #333;
      background: #1a1a1a;
    }
  }

  :deep(.ant-input-number) {
    background: #262626;
    border-color: #434343;
    color: #fff;

    .ant-input-number-input {
      color: #fff;
    }
  }
}

.pdf-content {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  transform-origin: center center;
}

.pdf-canvas {
  display: block;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  background: #fff;
}

.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10;

  :deep(.ant-spin-text) {
    color: #fff;
  }
}

.image-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  .preview-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}

.unsupported-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  color: #999;

  p {
    font-size: 16px;
    margin: 0;
  }
}
</style>
