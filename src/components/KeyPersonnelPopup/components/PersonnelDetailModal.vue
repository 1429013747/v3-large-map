<template>
  <div class="vehicle-detail-modal-container">
    <a-modal
      :open="open"
      title="重点人员"
      :width="1200"
      :centered="true"
      :mask-closable="false"
      getContainer=".vehicle-detail-modal-container"
      @cancel="handleCancel"
      :footer="null"
    >
      <template #closeIcon>
        <CloseOutlined style="color: #ffffff; font-size: 16px" />
      </template>

      <div class="vehicle-detail-content">
        <div class="basic-info-title">基本信息</div>
        <!-- 基本信息区域 -->
        <div class="basic-info-section">
          <div class="vehicle-header">
            <div class="vehicle-id">
              <span class="vehicle-number">{{ personnelData.name }}</span>
              <a-tag color="red" class="status-tag">
                {{ personnelData.status }}
              </a-tag>
            </div>
          </div>

          <div class="vehicle-info-row">
            <div class="vehicle-image">
              <img
                src="@/assets/imgs/personnel.png"
                :alt="personnelData.nationality"
              />
            </div>

            <div class="vehicle-details">
              <div class="detail-item">
                <span class="label">国籍:</span>
                <span class="value">{{ personnelData.nationality }}</span>
              </div>
              <div class="detail-item">
                <span class="label">户籍地址:</span>
                <span class="value">{{ personnelData.address }}</span>
              </div>
              <div class="detail-item">
                <span class="label">现居住地址:</span>
                <span class="value">{{ personnelData.address }}</span>
              </div>
              <div class="detail-item">
                <span class="label">关联车辆:</span>
                <span class="value">{{ personnelData.vehicle || "无" }}</span>
              </div>
            </div>

            <div class="status-info">
              <div class="status-details">
                <div class="status-item">
                  <span class="label">性别:</span>
                  <span class="value">
                    {{ personnelData.gender }}
                  </span>
                </div>
                <div class="status-item">
                  <span class="label">证件号码:</span>
                  <span class="value">{{ personnelData.idCard }}</span>
                </div>
                <div class="status-item">
                  <span class="label">出生日期:</span>
                  <span class="value">{{ personnelData.birthday || "" }}</span>
                </div>
                <div class="status-item">
                  <span class="label">联系方式:</span>
                  <span class="value">{{ personnelData.phone }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import { CloseOutlined } from "@ant-design/icons-vue";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  personnelData: {
    type: Object,
    default: () => {},
  },
});

// Emits
const emit = defineEmits(["update:open"]);
const handleCancel = () => {
  emit("update:open", false);
};
</script>

<style lang="scss" scoped>
.vehicle-detail-modal-container {
  :deep(.ant-modal-content) {
    background: rgba(18, 28, 43, 0.95);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 8px;
    padding: 0px;
  }

  :deep(.ant-modal-header) {
    padding: 10px;
    background: transparent;
    border-bottom: 1px solid rgba(0, 255, 255, 0.2);

    .ant-modal-title {
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
    }
  }

  :deep(.ant-modal-body) {
    padding: 20px;
    background: transparent;
  }

  .basic-info-title {
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 10px;
  }
  :deep(.ant-table-cell):before {
    display: none;
  }
  :deep(.ant-table-cell-scrollbar) {
    box-shadow: none;
  }
}

.vehicle-detail-content {
  color: #ffffff;
  height: calc(100vh - 235px);

  .basic-info-section {
    margin-bottom: 20px;

    .vehicle-header {
      margin-bottom: 20px;

      .vehicle-id {
        display: flex;
        align-items: center;
        gap: 12px;

        .vehicle-number {
          font-size: 16px;
        }

        .status-tag {
          background: #b3261e;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          color: #ffffff;
        }
      }
    }

    .vehicle-info-row {
      display: flex;
      gap: 10px;
      align-items: flex-start;

      .vehicle-image {
        width: 280px;
        height: 180px;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .vehicle-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 14px;

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .label {
            color: rgba(255, 255, 255, 0.7);
          }

          .value {
            color: rgba(255, 255, 255, 0.7);
          }
        }
      }

      .status-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;

        .status-details {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .status-item {
            display: flex;
            align-items: center;
            gap: 8px;

            .label {
              color: rgba(255, 255, 255, 0.7);
            }

            .value {
              color: rgba(255, 255, 255, 0.7);
            }
          }
        }
      }
    }
  }
}
</style>
