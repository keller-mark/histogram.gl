import { vs, fs } from './shaders';
import * as twgl from 'twgl.js';

const TARGET_TEXTURE_WIDTH = 256;
const TARGET_TEXTURE_HEIGHT = 1;

export function createRgbaHistogram(rgbaData, imageWidth, imageHeight) {

    return new Promise((resolve, reject) => {
        // TODO: use OffscreenCanvas when available in firefox.

        // Create canvas.
        const canvas = document.createElement("canvas");
        canvas.width = TARGET_TEXTURE_WIDTH;
        canvas.height = TARGET_TEXTURE_HEIGHT;

        // Get WebGL context.
        const gl = canvas.getContext("webgl");
        const ext = gl.getExtension("OES_texture_float");
        if (!ext) {
            reject(new Error("histogram.gl requires the OES_texture_float WebGL extension."));
        }

        const imageTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, imageTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, imageWidth, imageHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgbaData);

        const tex = imageTexture;
        console.log(tex);

        var histProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
        var pixelIds = [];
        var numIds = imageWidth * imageHeight;

        // Just fill a buffer with an incrementing count. If we wanted to make this
        // generic we'd re-use this buffer and just make it bigger if we were
        // processing a bigger image
        for (var i = 0; i < numIds; ++i) {
            pixelIds.push(i);
        }
        var pixelIdBufferInfo = twgl.createBufferInfoFromArrays(gl, {
            pixelId: { size: 1, data: new Float32Array(pixelIds), },
        });

        // make a 256x1 RGBA floating point texture and attach to a framebuffer
        var sumFbi = twgl.createFramebufferInfo(gl, [
            { type: gl.FLOAT,
            min: gl.NEAREST,
            mag: gl.NEAREST,
            wrap: gl.CLAMP_TO_EDGE,
            },
        ], 256, 1);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            alert("can't render to floating point texture");
        }

        // Render sum of each color

        // we're going to render a gl.POINT for each pixel in the source image
        // That point will be positioned based on the color of the source image
        // we're just going to render vec4(1,1,1,1). This blend function will
        // mean each time we render to a specific point that point will get
        // incremented by 1.
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.enable(gl.BLEND);
        gl.useProgram(histProgramInfo.program);
        twgl.setBuffersAndAttributes(gl, histProgramInfo, pixelIdBufferInfo);
        twgl.bindFramebufferInfo(gl, sumFbi);
        // render each channel separately since we can only position each POINT
        // for one channel at a time.
        for (var channel = 0; channel < 4; ++channel) {
            gl.colorMask(channel === 0, channel === 1, channel === 2, channel === 3);
            twgl.setUniforms(histProgramInfo, {
            u_texture: tex,
            u_colorMult: [
                channel === 0 ? 1 : 0,
                channel === 1 ? 1 : 0,
                channel === 2 ? 1 : 0,
                channel === 3 ? 1 : 0,
            ],
            u_resolution: [imageWidth, imageHeight],
            });
            twgl.drawBufferInfo(gl, gl.POINTS, pixelIdBufferInfo);
        }
        const histogramData = new Float32Array(256 * 1 * 4);
        gl.readPixels(0, 0, 256, 1, gl.RGBA, gl.FLOAT, histogramData);

        resolve(histogramData);


    });
}