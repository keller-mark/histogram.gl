import { createRgbaHistogram } from '../index';
import './index.scss';

// const imageUrl = "https://gist.githubusercontent.com/mbostock/9511ae067889eefa5537eedcbbf87dab/raw/944b6e5fe8dd535d6381b93d88bf4a854dac53d4/mona-lisa.jpg";
const imageUrl = "https://farm1.staticflickr.com/293/18414763798_cb8ebded43_m_d.jpg";

// Reference: https://observablehq.com/@mbostock/image-histogram/2
function getImageData(image, width = image.naturalWidth, height = image.naturalHeight) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height).data;
    return imageData;
}

function getChannelData(imageData, offset = 0) {
    const channelData = new Uint8Array(imageData.length / 4);
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

    const pre = document.createElement("pre");
    pre.innerHTML = histogramData;
    document.querySelector("#root").appendChild(pre);


    const canvas = document.createElement("canvas");
    document.querySelector("#root").appendChild(canvas);

    canvas.width = 400;
    canvas.height = 200;

    const ctx = canvas.getContext("2d");

    const redHistogramData = Array.from(getChannelData(histogramData, 2));
    const redMax = Math.max(...redHistogramData);
    console.log(redHistogramData);
    console.log(redMax);

    redHistogramData.forEach((d, i) => {
        const height = (d / redMax) * canvas.height;
        const x = i / 256 * canvas.width;
        ctx.beginPath();
        ctx.rect(x, canvas.height - height, 1 / 256 * canvas.width, canvas.height);
        ctx.fillStyle = "green";
        ctx.opacity = 0.5;
        ctx.fill();
    });
});

