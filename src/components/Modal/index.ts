import { withInstall } from '/@/utils'
import basicModal from './src/NovaBasicModal.vue'

/** 业务统一弹框：默认「确定 / 取消」，支持 v-model:open */
export const BasicModal = withInstall(basicModal)
export default BasicModal
