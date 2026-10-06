// Lets `tsc --noEmit` accept the `.vue` imports of the Insights panels (`list-extended-panel`,
// `page-export-panel`). The single-file components themselves are compiled by `directus-extension build`.
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
