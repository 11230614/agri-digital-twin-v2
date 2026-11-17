import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
// Runtime workers/resources are copied from this project's locked dependency.
for (const name of ['Workers', 'ThirdParty', 'Assets', 'Widgets']) {
  const destination = resolve('public/cesium', name);
  await mkdir(destination, { recursive: true });
  await cp(resolve('node_modules/cesium/Build/Cesium', name), destination, { recursive: true });
}
