<script setup>
import { Button, Result } from 'ant-design-vue'
import { useRouter } from 'vue-router'

definePage({
  name: '404',
  meta: {
    title: '页面未找到',
    level: 2
  }
})

const router = useRouter()

function onBack() {
  if (window.history.state && window.history.state.back) {
    history.back()
  }
  else {
    router.replace('/')
  }
}
</script>

<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <Result
        status="404"
        title="404"
        sub-title="抱歉，您访问的页面不存在"
      >
        <template #extra>
          <div class="action-buttons">
            <Button type="primary" @click="router.push('/')">
              返回首页
            </Button>
            <Button @click="onBack">
              返回上一页
            </Button>
          </div>
        </template>
      </Result>

      <div class="illustration">
        <div class="planet">
          <div class="crater crater-1" />
          <div class="crater crater-2" />
          <div class="crater crater-3" />
          <div class="crater crater-4" />
          <div class="crater crater-5" />
        </div>
        <div class="astronaut">
          <div class="astronaut-body" />
          <div class="astronaut-helmet" />
          <div class="astronaut-arm-left" />
          <div class="astronaut-arm-right" />
          <div class="astronaut-leg-left" />
          <div class="astronaut-leg-right" />
        </div>
        <div class="stars">
          <div class="star star-1" />
          <div class="star star-2" />
          <div class="star star-3" />
          <div class="star star-4" />
          <div class="star star-5" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e9f1ff 100%);
  // padding: 20px;
}

.not-found-content {
  max-width: 800px;
  width: 100%;
  text-align: center;
  // background: white;
  // border-radius: 12px;
  // box-shadow: 0 10px 30px rgba(0, 0, 20, 0.08);
  // padding: 40px;
  position: relative;
  overflow: hidden;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
}

// 动画和装饰元素
.illustration {
  position: relative;
  height: 180px;
  margin-top: 40px;
}

.planet {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #6a98f0 0%, #4677ce 100%);
  border-radius: 50%;
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 0 20px rgba(70, 119, 206, 0.4);
  overflow: hidden;
  animation: float 6s ease-in-out infinite;
}

.crater {
  position: absolute;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
}

.crater-1 {
  width: 30px;
  height: 30px;
  top: 20px;
  left: 25px;
}

.crater-2 {
  width: 24px;
  height: 24px;
  top: 50px;
  right: 15px;
}

.crater-3 {
  width: 18px;
  height: 18px;
  bottom: 20px;
  left: 30px;
}

.crater-4 {
  width: 12px;
  height: 12px;
  top: 80px;
  left: 20px;
}

.crater-5 {
  width: 10px;
  height: 10px;
  bottom: 45px;
  right: 30px;
}

.astronaut {
  position: absolute;
  bottom: 100px;
  left: 55%;
  animation: float-astronaut 5s ease-in-out infinite;
}

.astronaut-body {
  width: 40px;
  height: 60px;
  background: #f5f5f5;
  border-radius: 20px;
  position: relative;
}

.astronaut-helmet {
  width: 36px;
  height: 36px;
  background: #ffffff;
  border-radius: 50%;
  position: absolute;
  top: -20px;
  left: 2px;
  box-shadow: 0 0 0 5px #e6e6e6;
}

.astronaut-arm-left, .astronaut-arm-right {
  width: 10px;
  height: 30px;
  background: #f5f5f5;
  position: absolute;
  border-radius: 5px;
}

.astronaut-arm-left {
  transform: rotate(20deg);
  left: -8px;
  top: 10px;
}

.astronaut-arm-right {
  transform: rotate(-20deg);
  right: -8px;
  top: 10px;
}

.astronaut-leg-left, .astronaut-leg-right {
  width: 12px;
  height: 25px;
  background: #f5f5f5;
  position: absolute;
  border-radius: 5px;
  bottom: -20px;
}

.astronaut-leg-left {
  left: 6px;
}

.astronaut-leg-right {
  right: 6px;
}

.stars {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.star {
  position: absolute;
  background: #ffffff;
  border-radius: 50%;
  animation: twinkle 2s infinite;
}

.star-1 {
  width: 6px;
  height: 6px;
  top: 20%;
  left: 20%;
  animation-delay: 0.5s;
}

.star-2 {
  width: 4px;
  height: 4px;
  top: 30%;
  right: 30%;
  animation-delay: 1s;
}

.star-3 {
  width: 5px;
  height: 5px;
  bottom: 40%;
  left: 40%;
  animation-delay: 1.5s;
}

.star-4 {
  width: 3px;
  height: 3px;
  bottom: 20%;
  right: 20%;
  animation-delay: 2s;
}

.star-5 {
  width: 4px;
  height: 4px;
  top: 50%;
  left: 60%;
  animation-delay: 0.8s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(-50%);
  }
  50% {
    transform: translateY(-10px) translateX(-50%);
  }
}

@keyframes float-astronaut {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

@keyframes twinkle {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

// 响应式调整
@media (max-width: 768px) {
  .not-found-content {
    padding: 20px;
  }

  .illustration {
    height: 150px;
  }

  .planet {
    width: 100px;
    height: 100px;
  }
}
</style>
