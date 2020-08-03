# histogram.gl

```sh
yarn add histogram.gl
# or
npm install histogram.gl --save
```

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