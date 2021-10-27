const fs = require('fs');
const { join } = require('path');
const fg = require('fast-glob');

const pkgList = fs
  .readdirSync(join(__dirname, '../'))
  .filter((pkg) => pkg.charAt(0) !== '.');

pkgList.map(async (path) => {
  const baseUrl = `${join(__dirname, '../')}/${path}/src`;
  const lessFiles = await fg(`${baseUrl}/**/*.less`, {
    ignore: ['**/demos/**'],
    deep: 5,
  });
  const importFiles = lessFiles.map((lessPath) => {
    return `@import "../es${lessPath.replace(baseUrl, '')}";`;
  });

  const distPath = `${join(__dirname, '../',  path, 'dist', `${path}.less`)}`;

  fs.writeFileSync(distPath, importFiles.join('\n'));
});
