import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function safeImport(moduleName, humanName) {
  try {
    return await import(moduleName);
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') {
      console.warn(`[vite] Optional dependency "${moduleName}" (${humanName}) not found; continuing without it.`);
      return null;
    }
    throw error;
  }
}

export default defineConfig(async () => {
  let basicSsl;
  try {
    ({ default: basicSsl } = await import('@vitejs/plugin-basic-ssl'));
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND') {
      throw error;
    }
    console.warn("[vite] '@vitejs/plugin-basic-ssl' not found, starting without HTTPS support.");
  }

  const routerModule = await safeImport('unplugin-vue-router/vite', 'file-based routing');
  const autoImportModule = await safeImport('unplugin-auto-import/vite', 'auto-imports');
  const componentsModule = await safeImport('unplugin-vue-components/vite', 'component auto-registration');
  const componentsResolversModule = componentsModule
    ? await safeImport('unplugin-vue-components/resolvers', 'component resolvers')
    : null;
  const unoCssModule = await safeImport('unocss/vite', 'UnoCSS');
  const vueDevToolsModule = await safeImport('vite-plugin-vue-devtools', 'Vue DevTools');
  const vueI18nModule = await safeImport('@intlify/unplugin-vue-i18n/vite', 'Vue I18n pre-compiler');

  const routerPlugin = routerModule?.default?.({
    routesFolder: "src/views",
    logs: true,
    exclude: ["**/components/**", "**/test**.vue", "**/**Modal.vue"],
    importMode: "async",
    dts: "src/typed-router.d.ts",
  });

  const autoImportPlugin = autoImportModule?.default?.({
    imports: ['vue', 'vue-router', 'vue-i18n'],
    dts: 'src/auto-imports.d.ts',
  });

  const { ArcoResolver } = componentsResolversModule ?? {};
  const componentsPlugin = componentsModule?.default?.({
    dirs: ["src/components"],
    resolvers: ArcoResolver
      ? [
          ArcoResolver({
            importStyle: false,
          }),
        ]
      : [],
  });

  const unoCssPlugin = unoCssModule?.default?.();
  const vueDevToolsPlugin = vueDevToolsModule?.default?.();
  const vueI18nPlugin = vueI18nModule?.default?.({
    module: 'vue-i18n',
    include: path.resolve(__dirname, './src/locales/**'),
  });

  const plugins = [
    routerPlugin && { ...routerPlugin, enforce: "pre" },
    vue(),
    vueDevToolsPlugin,
    basicSsl && basicSsl(),
    unoCssPlugin,
    autoImportPlugin,
    componentsPlugin,
    vueI18nPlugin,
  ].filter(Boolean);

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@views': path.resolve(__dirname, 'src/views'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@api': path.resolve(__dirname, 'src/api'),
        '@stores': path.resolve(__dirname, 'src/stores')
      }
    },
    server: {
      port: 3000,
      open: true,
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/styles/variables.scss" as vars;'
        }
      }
    },
  };
})
