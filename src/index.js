import { vs, fs } from './shaders';
import { range, createShader, createProgram } from './utils';
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

        const exts = ["OES_texture_float", "EXT_float_blend", "EXT_color_buffer_float", "WEBGL_color_buffer_float"];

        exts.forEach((extName) => {
            let ext = gl.getExtension(extName);
            if (!ext) {
                console.warn(`histogram.gl did not find the ${extName} WebGL extension.`);
            }
        });

        const pixelIds = Float32Array.from(range(imageWidth * imageHeight));

        const imageTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, imageTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, imageWidth, imageHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgbaData);

        // Create GLSL shaders, upload the GLSL source, compile the shaders.
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vs);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fs);

        // Link the two shaders into a program.
        const program = createProgram(gl, vertexShader, fragmentShader);
        
        // Create the pixelIds buffer from the pixelIds array.
        const pixelIdsBuffer = gl.createBuffer();
        // Bind the buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, pixelIdsBuffer);
        // Pass the data to the bound buffer.
        gl.bufferData(gl.ARRAY_BUFFER, pixelIds, gl.STATIC_DRAW);

        // Create texture to render to.
        const targetTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, targetTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TARGET_TEXTURE_WIDTH, TARGET_TEXTURE_HEIGHT, 0, gl.RGBA, gl.FLOAT, null);


        // Create frame buffer target.
        const targetFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);

        const attachmentPoint = gl.COLOR_ATTACHMENT0;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, 0);


        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            reject(new Error("can't render to floating point texture"));
        }

        // Render sum of each color

        // we're going to render a gl.POINT for each pixel in the source image
        // That point will be positioned based on the color of the source image
        // we're just going to render vec4(1,1,1,1). This blend function will
        // mean each time we render to a specific point that point will get
        // incremented by 1.
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.useProgram(program);
        

        // Look up where the vertex data needs to go.
        const pixelIdsAttributeLocation = gl.getAttribLocation(program, "pixelId");
        // Turn on the attribute.
        gl.enableVertexAttribArray(pixelIdsAttributeLocation);
        // Tell the attribute how to get data out of the buffer (ARRAY_BUFFER).
        gl.vertexAttribPointer(pixelIdsAttributeLocation, 1, gl.FLOAT, false, 0, 0);


        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
        gl.viewport(0, 0, TARGET_TEXTURE_WIDTH, TARGET_TEXTURE_HEIGHT);

        gl.clear(gl.COLOR_BUFFER_BIT);

        // render each channel separately since we can only position each POINT
        // for one channel at a time.
        let unit = 0;
        for (var channel = 0; channel < 4; ++channel) {
            gl.colorMask(channel === 0, channel === 1, channel === 2, channel === 3);
            
            const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
            gl.uniform2fv(resolutionLocation, [imageWidth, imageHeight]);

            const colorMultLocation = gl.getUniformLocation(program, "u_colorMult");
            gl.uniform4fv(colorMultLocation, [
                channel === 0 ? 1 : 0,
                channel === 1 ? 1 : 0,
                channel === 2 ? 1 : 0,
                channel === 3 ? 1 : 0,
            ]);

            const imageTextureLocation = gl.getUniformLocation(program, "u_texture");
            
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, imageTexture);
            gl.uniform1i(imageTextureLocation, unit++);

            gl.drawArrays(gl.POINTS, 0, pixelIds.length);
            // Flush the buffer just to be sure everything is rendered to the texture.
            gl.flush();
        }

        const histogramData = new Float32Array(TARGET_TEXTURE_WIDTH * TARGET_TEXTURE_HEIGHT * 4);
        gl.readPixels(0, 0, TARGET_TEXTURE_WIDTH, TARGET_TEXTURE_HEIGHT, gl.RGBA, gl.FLOAT, histogramData);
        resolve(histogramData);
    });
}