/**
 * Jeecg withInstall 兼容
 */
export function withInstall(component, alias) {
  component.install = (app) => {
    const name = component.name || component.displayName
    if (name) {
      app.component(name, component)
    }
    if (alias) {
      app.config.globalProperties[alias] = component
    }
  }
  return component
}

export default { withInstall }
