import { defineAsyncComponent, h } from 'vue'
import { Spin } from 'ant-design-vue'

export function createAsyncComponent(loader, options = {}) {
  const { loading = false, delay = 100, timeout = 30000 } = options
  return defineAsyncComponent({
    loader,
    delay,
    timeout,
    loadingComponent: loading
      ? {
          render() {
            return h('div', { style: 'padding:40px;text-align:center' }, [h(Spin)])
          },
        }
      : undefined,
  })
}
