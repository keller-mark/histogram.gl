import { createRgbaHistogram } from '../index';
import './index.scss';

const imageUrl = "https://gist.githubusercontent.com/mbostock/9511ae067889eefa5537eedcbbf87dab/raw/944b6e5fe8dd535d6381b93d88bf4a854dac53d4/mona-lisa.jpg";

// Reference: https://observablehq.com/@mbostock/image-histogram/2
function getImageData(image, width = image.naturalWidth, height = image.naturalHeight) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height).data;
    return Uint8Array.from(imageData);
}

function getChannelData(imageData, offset = 0, float = false) {
    const channelData = (float ? new Float32Array(imageData.length / 4) : new Uint8Array(imageData.length / 4));
    for(let i = 0; i < channelData.length; i++) {
      channelData[i] = imageData[i * 4 + offset];
    }
    return channelData;
}


new Promise((resolve, reject) => {
    const image = new Image;
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.crossOrigin = "anonymous";
    image.src = imageUrl;
})
.then((image) => {
    console.log(image);
    // Get the image data Uint8ClampedArray from the image object.
    const imageData = getImageData(image);
    // Get the red channel.
    const channelData = getChannelData(imageData, 0);
    return createRgbaHistogram(imageData, image.naturalWidth, image.naturalHeight);
})
.then((histogramData) => {
    console.log("Histogram Data");
    console.log(histogramData);

    const mlImage = document.createElement("img");
    mlImage.crossOrigin = true;
    mlImage.src = imageUrl;
    mlImage.width = 200;
    document.querySelector("#root").appendChild(mlImage);

    const header = document.createElement("h2");
    header.innerHTML = "histogram.gl result";
    document.querySelector("#root").appendChild(header);


    const canvas = document.createElement("canvas");
    document.querySelector("#root").appendChild(canvas);

    canvas.width = 400;
    canvas.height = 200;

    const ctx = canvas.getContext("2d");
    // Turn transparency on
    ctx.globalAlpha = 0.4;

    const channels = ["red", "green", "blue"];

    channels.forEach((channel, channelOffset) => {
        const channelHistogramData = Array.from(getChannelData(histogramData, channelOffset, true));
        const channelHistogramMax = Math.max(...channelHistogramData);

        channelHistogramData.forEach((d, i) => {
            const height = (d / channelHistogramMax) * canvas.height;
            const x = i / 256 * canvas.width;
            ctx.beginPath();
            ctx.rect(x, canvas.height - height, 1 / 256 * canvas.width, canvas.height);
            ctx.fillStyle = channel;
            ctx.fill();
        });
    });

    const header2 = document.createElement("h2");
    header2.innerHTML = "ground truth";
    document.querySelector("#root").appendChild(header2);

    const gtImage = document.createElement("img");
    gtImage.crossOrigin = true;
    gtImage.src = "https://raw.githubusercontent.com/keller-mark/histogram.gl/master/screenshot.png";
    document.querySelector("#root").appendChild(gtImage);

    
});

