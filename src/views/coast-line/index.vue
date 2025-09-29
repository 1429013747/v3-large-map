<!--
 * @author: guoqiancheng
 * @since: 2025-09-28
-->
<template>
  <MapLayout title="智能地图">
    <div class="coastline-container">
      <div class="left">
        <!-- 风险点信息 -->
        <div class="risk-point-info">
          <!-- 标题栏 -->
          <div class="info-header">
            <span class="header-title">风险点信息</span>
          </div>

          <!-- 基本信息 -->
          <div class="info-section">
            <div class="section-title">基本信息</div>
            <div class="basic-info">
              <div class="risk-point-header">
                <span class="risk-point-name">白岩码头</span>
                <div class="risk-level-badge high-risk">高风险</div>
              </div>
              <div class="risk-row">
                <span class="risk-label">责任单位:</span>
                <span class="risk-value">白岩村</span>
                <span class="risk-label">责任人:</span>
                <span class="risk-value">张某某</span>
              </div>
              <div class="risk-row">
                <span class="risk-label">位置:</span>
                <span class="risk-value">温岭市白岩码头</span>
              </div>
              <div class="risk-row">
                <span class="risk-label">经纬度:</span>
                <span class="risk-value">118°19.968E, 38°30.241N</span>
              </div>
            </div>
          </div>

          <!-- 静态指标 -->
          <div class="info-section">
            <div class="section-title">静态指标</div>
            <div class="risk-box">
              <!-- 风险点类型 -->
              <div class="indicator-group">
                <div class="indicator-title">
                  <span class="triangle-icon">▶</span>
                  <span>风险点类型</span>
                </div>
                <div class="indicator-content">
                  <span class="type-options"
                    >正常码头 | 废弃码头 | 冲滩点 | 埠口 | 岙口 | 岸线 |
                    其他</span
                  >
                </div>
              </div>

              <!-- 周边环境 -->
              <div class="indicator-group">
                <div class="indicator-title">
                  <span class="triangle-icon">▶</span>
                  <span>周边环境</span>
                </div>
                <div class="indicator-content">
                  <div class="info-item">
                    <span class="item-label">附近有无居民社区或厂房</span>
                    <span class="item-value">有</span>
                  </div>
                  <div class="info-item">
                    <span class="item-label">距离</span>
                    <span class="item-value">500米以内</span>
                  </div>
                  <div class="info-item">
                    <span class="item-label">夜间是否有灯光</span>
                    <span class="item-value">是</span>
                  </div>
                </div>
              </div>

              <!-- 交通条件 -->
              <div class="indicator-group">
                <div class="indicator-title">
                  <span class="triangle-icon">▶</span>
                  <span>交通条件</span>
                </div>
                <div class="indicator-content">
                  <span class="traffic-info">...</span>
                </div>
                <div class="indicator-content">
                  <span class="traffic-info">...</span>
                </div>
                <div class="indicator-content">
                  <span class="traffic-info">...</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 动态指标 -->
          <div class="info-section">
            <div class="section-title">动态指标</div>
            <div class="dynamic-box">
              <!-- 历史走私案件 -->
              <div class="indicator-group">
                <div class="indicator-title">
                  <span class="triangle-icon">▶</span>
                  <span>历史走私案件</span>
                </div>
                <div class="indicator-content">
                  <div class="info-item">
                    <span class="item-label">时间范围</span>
                    <span class="item-value">1-3年内</span>
                  </div>
                </div>
              </div>

              <!-- 防控措施 -->
              <div class="indicator-group">
                <div class="indicator-title">
                  <span class="triangle-icon">▶</span>
                  <span>防控措施</span>
                </div>
                <div class="indicator-content">
                  <div class="info-item">
                    <span class="item-label">挿型感型智能限高杆</span>
                    <span class="item-value">已配置</span>
                  </div>
                  <div class="info-item">
                    <span class="item-label">船舶电子围栏</span>
                    <span class="item-value">已配置</span>
                  </div>
                  <div class="info-item">
                    <span class="item-label">结构化视频监控设备</span>
                    <span class="item-value">已配置</span>
                  </div>
                  <div class="info-item">
                    <span class="item-label">无人机空中巡航</span>
                    <span class="item-value">已配置</span>
                  </div>
                  <div class="info-item">
                    <span class="item-label">派出所出警时长</span>
                    <span class="item-value">5分钟以内</span>
                  </div>
                  <div class="info-item">
                    <span class="item-label">日常防控措施落实情况</span>
                    <span class="item-value">已部分落实</span>
                  </div>
                  <div class="measures-detail">
                    码头长制度、反走私宣传牌(标语)、日常巡查(人防)机制、群众反走私宣传教育、信息化核查机制
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="center"></div>
      <div class="right"></div>
    </div>
  </MapLayout>
</template>

<script setup>
import { ref } from "vue";
import MapLayout from "@/layouts/MapLayout.vue";
</script>

<style lang="scss" scoped>
.coastline-container {
  display: flex;
  gap: 10px;
  height: 100%;
  padding: 20px 10px;

  .left,
  .right,
  .center {
    flex: 1;
    border: 1px solid rgb(162, 162, 162, 0.5);
    height: 100%;
    background: rgba(18, 28, 43, 0.8);
    border-radius: 8px;
    padding: 16px;
  }

  .left,
  .right {
    flex: 0.2;
  }

  .center {
    flex: 0.6;
  }

  // 风险点信息样式
  .risk-point-info {
    color: rgba(255, 255, 255, 0.8);
    height: 100%;
    overflow-y: auto;

    // 标题栏
    .info-header {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;

      .header-title {
        font-size: 20px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
      }
    }

    // 信息区块
    .info-section {
      margin-bottom: 20px;

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
        margin: 20px 0;
        background: linear-gradient(
          90deg,
          rgba(0, 255, 255, 0.2),
          transparent 70%
        );
      }
      .risk-box {
        height: 260px;
        overflow-y: auto;
        padding-right: 8px;
      }
      .dynamic-box {
        height: 320px;
        overflow-y: auto;
        padding-right: 8px;
      }
      .basic-info {
        .risk-point-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;

          .risk-point-name {
            font-size: 16px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.8);
          }

          .risk-level-badge {
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;

            &.high-risk {
              background: #b4261e;
              color: rgba(255, 255, 255, 0.8);
            }
          }
        }

        .risk-row {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;

          .risk-label {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
          }
          .risk-label:nth-child(3) {
            margin-left: 50px;
          }
          .risk-value {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
          }
        }
      }

      .indicator-group {
        margin-bottom: 16px;
        .indicator-title {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 14px;
          font-size: 16px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);

          .triangle-icon {
            color: #00ffff;
            font-size: 10px;
          }
        }

        .indicator-content {
          padding-left: 16px;

          .type-options {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            line-height: 1.4;
          }

          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            font-size: 14px;

            .item-label {
              color: rgba(255, 255, 255, 0.8);
            }

            .item-value {
              color: rgba(255, 255, 255, 0.8);
              text-align: right;
            }
          }

          .measures-detail {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            line-height: 1.4;
            margin-top: 8px;
            padding: 8px;
            background: rgba(0, 255, 255, 0.05);
            border: 1px solid rgba(0, 255, 255, 0.1);
            border-radius: 4px;
          }

          .traffic-info {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
          }
        }
      }
    }

    // 滚动条样式
    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(0, 255, 255, 0.1);
      border-radius: 2px;
    }

    &::-webkit-scrollbar-thumb {
      background: #00ffff;
      border-radius: 2px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: #00e6e6;
    }
  }
}
</style>
