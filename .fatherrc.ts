
const type = process.env.BUILD_TYPE;

let config = {};

if (type === 'lib') {
  config = {
    cjs: { type: 'babel', lazy: true },
    esm: false,
  };
}

if (type === 'es') {
  config = {
    cjs: false,
    esm: {
      type: 'babel',
    },
    extraBabelPlugins: [
      ['babel-plugin-import', { libraryName: 'antd', libraryDirectory: 'es', style: true }, 'antd'], // 增量引入antd组件样式
      // ['babel-plugin-import', { libraryName: '@ant-design', libraryDirectory: 'pro-descriptions/es', style: true }, 'antd-pro-descriptions'],
      [require('./scripts/replaceLib')],
    ],
  };
}

export default config;
