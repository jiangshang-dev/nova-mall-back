/**
 * 全局注册 Jeecg 风格组件（与 JeecgBoot registerGlobComp 对齐）
 */
import { Icon } from '/@/components/Icon'
import AIcon from '/@/components/jeecg/AIcon.vue'
import { Button, JUploadButton } from '/@/components/Button'
import { PageWrapper, PageFooter } from '/@/components/Page'
import { BasicModal } from '/@/components/Modal'
import JImageUpload from '/@/components/Form/src/jeecg/components/JImageUpload.vue'
import { Space } from 'ant-design-vue'

const compList = [Icon, AIcon, JUploadButton, PageWrapper, PageFooter, BasicModal, JImageUpload]

export function registerGlobComp(app) {
  compList.forEach((comp) => {
    const name = comp.name || comp.displayName
    if (name) {
      app.component(name, comp)
    }
  })

  app.component('ASpaceCompact', Space.Compact)
  app.use(Button)

  app.component('PageWrapper', PageWrapper)
  app.component('BasicButton', Button)
  app.component('AButton', Button)
  app.component('BasicModal', BasicModal)
  app.component('JImageUpload', JImageUpload)
}
