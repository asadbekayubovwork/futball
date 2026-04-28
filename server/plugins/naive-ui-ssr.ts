export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:html', (html, { event }) => {
    const collect = (event.context as any).__naiveUiCollect
    if (typeof collect === 'function') {
      html.head.push(collect())
    }
  })
})
