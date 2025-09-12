<script setup>
import { ConfigProvider } from "ant-design-vue";
import zhCN from "ant-design-vue/es/locale/zh_CN";
import GlobalLoading from "@/components/common/GlobalLoading/GlobalLoading.vue";
import { useThemeStore } from "./stores/theme";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { computed } from "vue";

dayjs.locale("zh-cn");

const themeStore = useThemeStore();
themeStore.initTheme("dark");

// 静态主题配置，避免 derivative4 错误
const theme = {
  token: {
    fontSize: 16,
    fontSizeHeading1: 32,
  },
};
</script>

<template>
  <!-- component-size="large" -->
  <ConfigProvider :locale="zhCN" :theme="theme">
    <router-view />
    <!-- 全局Loading组件 -->
    <GlobalLoading />
  </ConfigProvider>
</template>

<style lang="scss">
@use "./styles/antd-custom-style.scss" as *;
</style>
