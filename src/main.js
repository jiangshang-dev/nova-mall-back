import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import router from './router'
import { setupAuthDirective } from './directives/auth'
import { registerGlobComp } from './plugins/registerGlobComp'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Antd)
registerGlobComp(app)
setupAuthDirective(app)
app.mount('#app')
