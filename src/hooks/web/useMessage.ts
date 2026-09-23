import { message, Modal, notification } from 'ant-design-vue'

export function useMessage() {
  return {
    createMessage: message,
    createConfirm: Modal.confirm,
    notification,
    createSuccessModal: (options) => Modal.success(options),
    createErrorModal: (options) => Modal.error(options),
    createInfoModal: (options) => Modal.info(options),
    createWarningModal: (options) => Modal.warning(options),
  }
}
