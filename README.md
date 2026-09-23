# Nova Mall Back

> Nova Mall **运营管理后台** · Vue 3 + Vite + Ant Design Vue

<p align="center">
  <a href="https://github.com/jiangshang-dev/nova-mall-back/stargazers"><img src="https://img.shields.io/github/stars/jiangshang-dev/nova-mall-back?style=for-the-badge&logo=github" alt="Stars"/></a>
  <a href="https://github.com/jiangshang-dev/nova-mall-back/network/members"><img src="https://img.shields.io/github/forks/jiangshang-dev/nova-mall-back?style=for-the-badge" alt="Forks"/></a>
  <img src="https://img.shields.io/badge/Vue-3.5-brightgreen?style=for-the-badge&logo=vuedotjs" alt="Vue"/>
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite" alt="Vite"/>
  <img src="https://img.shields.io/badge/Pinia-2-yellow?style=for-the-badge" alt="Pinia"/>
</p>

<p align="center">
  <a href="https://github.com/jiangshang-dev/nova-mall">后端 API</a> ·
  <a href="https://github.com/jiangshang-dev/nova-mall-views">商城前台</a> ·
  <b>管理后台（本仓库）</b>
</p>

---

## ⭐ 开源约定

> **请先 Star，再 Clone。**  
> 未点星禁止 Clone（君子协议，开源江湖规矩）。

完整跑通请 Star 三仓库：

| 仓库 | 角色 |
|------|------|
| [nova-mall](https://github.com/jiangshang-dev/nova-mall) | 后端（必须） |
| [nova-mall-views](https://github.com/jiangshang-dev/nova-mall-views) | 商城前台 |
| [nova-mall-back](https://github.com/jiangshang-dev/nova-mall-back) | 本仓库 · 后台 |

```bash
# 1. 点亮 Star
# 2. Clone
git clone https://github.com/jiangshang-dev/nova-mall-back.git
```

---

## 简介

面向运营 / 客服的管理端，基于后端 RBAC 动态菜单与按钮权限，覆盖商品、订单、会员、店铺与人工客服工作台。

### 已实现能力

- 登录鉴权、Token 失效处理  
- 动态路由菜单 / `perms` 按钮权限  
- 系统：用户、角色、菜单、操作日志  
- 商品：分类树、商品列表 / 编辑（Markdown 详情）、评价管理  
- 订单：列表筛选、发货、货到付款核销  
- 店铺：配送城市、运费模板（一小时达 / 隔天达 / 三天内）  
- 客服工作台：排队接入、实时会话、展示会员 IP  

---

## 技术栈

- Vue 3.5 + Vue Router + Pinia  
- Vite 6  
- Ant Design Vue 4  
- Vditor（商品详情 Markdown）  
- Axios  

---

## 快速开始

### 前置条件

1. 后端已启动：[nova-mall](https://github.com/jiangshang-dev/nova-mall) → `http://localhost:8082`  
2. Node.js 18+  

### 安装与运行

```bash
npm install
npm run dev
```

- 本地地址：http://localhost:3100  
- 接口代理默认指向 `http://localhost:8082`  

### 演示账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 超级管理员 | `admin` / `admin@nova.com` | `admin123` |

登录后菜单由后端权限数据动态生成；客服工作台需具备 `cs:desk` 权限。

---

## 目录结构（简）

```
src/
├── api/           # 后端接口
├── views/         # 业务页面（system / goods / order / cs / shop …）
├── layouts/       # BasicLayout
├── router/        # 静态路由 + 动态菜单注入
├── store/         # Pinia（用户 / 权限）
└── components/    # 通用与 Jeecg 风格组件适配
```

---

## 常见问题

**Q: 登录成功但菜单为空？**  
A: 确认后端角色已绑定菜单权限，且使用 `clientType=admin` 登录。

**Q: 客服收不到会员消息？**  
A: 检查 WebSocket 是否连到后端 `8082`，防火墙 / 代理是否放行 `/ws`。

更多后端与支付说明：  
https://github.com/jiangshang-dev/nova-mall

---

## License

建议与主工程统一为 [MIT](https://opensource.org/licenses/MIT)。  
若觉得有用，请 **Star** 支持，感谢！

<p align="center">
  <sub>Part of <a href="https://github.com/jiangshang-dev/nova-mall">Nova Mall</a></sub>
</p>
