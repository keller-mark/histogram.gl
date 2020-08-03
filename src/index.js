import { rgba, singleChannel } from './shaders';
import { range, createShader, createProgram } from './utils';

const TARGET_TEXTURE_WIDTH = 256;
const TARGET_TEXTURE_HEIGHT = 1;

function getChannelData(imageData, offset = 0) {
    const channelData = new Float32Array(imageData.length / 4);
    for(let i = 0; i < channelData.length; i++) {
      channelData[i] = imageData[i * 4 + offset];
    }
    return channelData;
}

function createHistogram(imageData, imageWidth, imageHeight, isRgba) {
    return new Promise((resolve, reject) => {
        // TODO: use OffscreenCanvas when available in firefox.

        // Create a canvas.
        const canvas = document.createElement("canvas");
        canvas.width = TARGET_TEXTURE_WIDTH;
        canvas.height = TARGET_TEXTURE_HEIGHT;

        // Get the WebGL context.
        const gl = canvas.getContext("webgl");

        // TODO: check these against the supported extensions to throw better warnings.
        const exts = ["OES_texture_float", "EXT_float_blend", "EXT_color_buffer_float", "WEBGL_color_buffer_float"];

        exts.forEach((extName) => {
            let ext = gl.getExtension(extName);
            if (!ext) {
                console.warn(`histogram.gl did not find the ${extName} WebGL extension.`);
            }
        });

        // Create an array of pixel indices.
        const pixelIds = Float32Array.from(range(imageWidth * imageHeight));

        // Convert the input image to a texture.
        const imageTexture = gl.createTexture();
        const imageTextureFormat = (isRgba ? gl.RGBA : gl.LUMINANCE);
        gl.bindTexture(gl.TEXTURE_2D, imageTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, imageTextureFormat, imageWidth, imageHeight, 0, imageTextureFormat, gl.UNSIGNED_BYTE, imageData);

        // Create GLSL shaders, upload the GLSL source, compile the shaders.
        const shaderSources = (isRgba ? rgba : singleChannel);
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, shaderSources.vs);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, shaderSources.fs);

        // Link the two shaders into a program.
        const program = createProgram(gl, vertexShader, fragmentShader);
        
        // Create the pixelIds buffer from the pixelIds array.
        const pixelIdsBuffer = gl.createBuffer();
        // Bind the buffer for pixel indices.
        gl.bindBuffer(gl.ARRAY_BUFFER, pixelIdsBuffer);
        // Pass the data to the bound buffer.
        gl.bufferData(gl.ARRAY_BUFFER, pixelIds, gl.STATIC_DRAW);

        // Create target texture that the framebuffer will render into.
        const targetTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, targetTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TARGET_TEXTURE_WIDTH, TARGET_TEXTURE_HEIGHT, 0, gl.RGBA, gl.FLOAT, null);


        // Create and bind a framebuffer.
        const targetFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);

        const attachmentPoint = gl.COLOR_ATTACHMENT0;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, 0);


        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            reject(new Error("can't render to floating point texture"));
        }

        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.useProgram(program);
        

        // Look up where the vertex data needs to go.
        const pixelIdsAttributeLocation = gl.getAttribLocation(program, "a_pixel_id");
        // Turn on the attribute.
        gl.enableVertexAttribArray(pixelIdsAttributeLocation);
        // Tell the attribute how to get data out of the buffer (ARRAY_BUFFER).
        gl.vertexAttribPointer(pixelIdsAttributeLocation, 1, gl.FLOAT, false, 0, 0);

        // With our framebuffer bound, anytime we call gl.clear, gl.drawArrays, or gl.drawElements,
        // WebGL will render to our texture instead of the canvas.
        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
        // Tell WebGL how to convert from clip space to pixels.
        // It's extremely important to remember to call gl.viewport
        // and set it to the size of the thing your rendering to.
        // In this case the first time we're rendering to the texture
        // so we set the viewport to cover the texture.
        gl.viewport(0, 0, TARGET_TEXTURE_WIDTH, TARGET_TEXTURE_HEIGHT);
        // Clear the framebuffer.
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Render each channel separately since each POINT
        // can only be positioned for one channel at a time.
        let unit = 0;
        // Only render for one channel if not RGBA input.
        const numChannels = (isRgba ? 4 : 1);
        for (let channel = 0; channel < numChannels; ++channel) {
            gl.colorMask(channel === 0, channel === 1, channel === 2, channel === 3);
            
            // Define and store the uniform data.
            const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
            gl.uniform2fv(resolutionLocation, [imageWidth, imageHeight]);

            if(isRgba) {
                const colorMultLocation = gl.getUniformLocation(program, "u_color_mult");
                gl.uniform4fv(colorMultLocation, [
                    channel === 0 ? 1 : 0,
                    channel === 1 ? 1 : 0,
                    channel === 2 ? 1 : 0,
                    channel === 3 ? 1 : 0,
                ]);
            }

            const imageTextureLocation = gl.getUniformLocation(program, "u_texture");
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, imageTexture);
            gl.uniform1i(imageTextureLocation, unit++);

            // Draw.
            gl.drawArrays(gl.POINTS, 0, pixelIds.length);

            // Flush the buffer to be sure everything is rendered to the texture.
            gl.flush();
        }

        // Reference: https://github.com/tensorflow/tfjs/blob/5e28965/tfjs-backend-webgl/src/gpgpu_util.ts#L304
        let histogramData = new Float32Array(TARGET_TEXTURE_WIDTH * TARGET_TEXTURE_HEIGHT * 4);
        gl.readPixels(0, 0, TARGET_TEXTURE_WIDTH, TARGET_TEXTURE_HEIGHT, gl.RGBA, gl.FLOAT, histogramData);

        if(!isRgba) {
            histogramData = getChannelData(histogramData, 0);
        }

        resolve(histogramData);
    });
}

/**
 * Compute histogram values for a 4-channel (RGBA) image.
 * @param {Uint8Array} rgbaData The image data.
 * @param {number} imageWidth Image width (between 0 and 4096).
 * @param {number} imageHeight Image height (between 0 and 4096).
 * @returns {Float32Array} A 1024-element histogram array where
 * channel results are interleaved [r0, g0, b0, a0, r1, g1, b1, a1, ...]
 */
export function createRgbaHistogram(rgbaData, imageWidth, imageHeight) {
    return createHistogram(rgbaData, imageWidth, imageHeight, true);
}

/**
 * Compute histogram values for a single-channel image.
 * @param {Uint8Array} channelData The channel data.
 * @param {number} imageWidth Image width (between 0 and 4096).
 * @param {number} imageHeight Image height (between 0 and 4096).
 * @returns {Float32Array} A 256-element histogram array.
 */
export function createSingleChannelHistogram(channelData, imageWidth, imageHeight) {
    return createHistogram(channelData, imageWidth, imageHeight, false);
}