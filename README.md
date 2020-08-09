[![npm](https://img.shields.io/npm/v/histogram.gl)](https://www.npmjs.com/package/histogram.gl)
[![npm bundle size](https://img.shields.io/bundlephobia/min/histogram.gl)](https://unpkg.com/browse/histogram.gl/)

# histogram.gl

```sh
yarn add histogram.gl
# or
npm install histogram.gl --save
```

Demo: https://keller-mark.github.io/histogram.gl/

Example:

```js
import { createRgbaHistogram, createSingleChannelHistogram } from 'histogram.gl';

createRgbaHistogram(imageData, imageWidth, imageHeight)
    .then((histogramData) => {
        console.log(histogramData);
    });

createSingleChannelHistogram(channelData, imageWidth, imageHeight)
    .then((histogramData) => {
        console.log(histogramData);
    });
```

0 dependencies.

Inspired by
- https://github.com/hubmapconsortium/vitessce-image-viewer
- https://webglfundamentals.org/webgl/lessons/webgl-image-processing.html#comment-2619624947
- https://jsfiddle.net/greggman/9amgpndt/
