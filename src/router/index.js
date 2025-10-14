import { createRouter, createWebHashHistory } from "vue-router";
import { handleHotUpdate, routes } from "vue-router/auto-routes";

// 白名单路由
const whiteList = ["/login"];

const router = createRouter({
  history: createWebHashHistory(),
  // 自动生成的路由配置
  routes: [
    {
      path: "/",
      redirect: "/smart-map",
    },
    {
      path: "/coastline-detail",
      name: "CoastlineDetail",
      component: () => import("@/views/coastline-detail/index.vue"),
    },
    ...routes,
  ],
  // routes: [
  //   {
  //     path: '/login',
  //     name: 'Login',
  //     component: () => import('@/views/login.vue')
  //   },
  //   {
  //     path: '/',
  //     name: 'Home',
  //     component: () => import('@/views/home.vue'),
  //     meta: { requiresAuth: true }
  //   }
  // ]
});
// if (import.meta.hot) {
//   handleHotUpdate(router);
// }
// router.beforeEach((to, from, next) => {
//   const token = localStorage.getItem("token");
//   // 如果用户已登录且尝试访问登录页面，则重定向到首页
//   if (token && to.path === "/login") {
//     next({ path: "/" });
//     return;
//   }

//   // 检查路由是否需要认证
//   if (to.matched.some((record) => record.meta.requiresAuth)) {
//     // 检查用户是否已登录
//     if (!token) {
//       next({
//         path: "/login",
//         query: { redirect: to.fullPath },
//       });
//     } else {
//       next();
//     }
//   } else {
//     // 如果是白名单页面，直接通过
//     if (whiteList.includes(to.path)) {
//       next();
//     } else {
//       // 其他情况，检查登录状态
//       if (token) {
//         next();
//       } else {
//         next("/login");
//       }
//     }
//   }
// });

export default router;
