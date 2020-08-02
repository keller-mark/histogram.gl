import { vs, fs } from './shaders';
import * as twgl from 'twgl.js';

export function createHistogram() {

    return new Promise((resolve, reject) => {

        var canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 120;
        var gl = canvas.getContext("webgl");
        var ext = gl.getExtension("OES_texture_float");
        if (!ext) {
            alert("requires OES_texture_float");
        }

        twgl.createTexture(gl, {
            //src: "https://i.imgur.com/9Y3sd8S.png",
            src: "https://farm1.staticflickr.com/293/18414763798_cb8ebded43_m_d.jpg",
            // required link: https://www.flickr.com/photos/greggman/18414763798/in/album-72157653822314919/
            min: gl.NEAREST,
            mag: gl.NEAREST,
            wrap: gl.CLAMP_TO_EDGE,
            crossOrigin: "",
        }, function(err, tex, img) {

            console.log(err, tex, img);

            var histProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
            var pixelIds = [];
            var numIds = img.width * img.height;

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
                u_resolution: [img.width, img.height],
                });
                twgl.drawBufferInfo(gl, gl.POINTS, pixelIdBufferInfo);
            }
            const histogramData = new Float32Array(256 * 1 * 4);
            gl.readPixels(0, 0, 256, 1, gl.RGBA, gl.FLOAT, histogramData);

            resolve(histogramData);

        });

    });
}