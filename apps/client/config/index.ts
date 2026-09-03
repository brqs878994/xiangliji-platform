import { defineConfig, type UserConfigExport } from '@tarojs/cli';

const config: UserConfigExport = {
  projectName: 'xiangliji-client',
  date: '2026-09-02',
  designWidth: 750,
  deviceRatio: {
    640: 2.34,
    750: 1,
    828: 1.81,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: {
    type: 'webpack5',
    prebundle: { enable: false },
  },
  mini: {},
  h5: {
    publicPath: '/',
    devServer: {
      hot: false,
    },
  },
};

export default defineConfig((merge) => merge({}, config));
