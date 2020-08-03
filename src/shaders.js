export const rgba = {
    vs: `
    attribute float a_pixel_id;
    
    uniform vec2 u_resolution;
    uniform sampler2D u_texture;
    uniform vec4 u_color_mult;
    
    void main() {
        // Compute the pixel (x, y) for the source image based on a pixel index.
        vec2 pixel = vec2(mod(a_pixel_id, u_resolution.x), floor(a_pixel_id / u_resolution.x));
        
        // Compute center of the pixel.
        vec2 uv = (pixel + 0.5) / u_resolution;
        
        // Get the color but zero out 3 of the 4 channels.
        vec4 color = texture2D(u_texture, uv) * u_color_mult;
        
        // Add the channels.
        float color_sum = color.r + color.g + color.b + color.a;
        
        // Set the position to somewhere in the 256x1 target texture.
        gl_Position = vec4((color_sum * 255.0 + 0.5) / 256.0 * 2.0 - 1.0, 0.5, 0, 1);
        gl_PointSize = 1.0;
    }
    `,
    fs: `
    precision highp float;
    
    void main() {
        gl_FragColor = vec4(1);
    }
    `,
};

export const singleChannel = {
    vs: `
    attribute float a_pixel_id;
    
    uniform vec2 u_resolution;
    uniform sampler2D u_texture;
    
    void main() {
        // Compute the pixel (x, y) for the source image based on a pixel index.
        vec2 pixel = vec2(mod(a_pixel_id, u_resolution.x), floor(a_pixel_id / u_resolution.x));
        
        // Compute center of the pixel.
        vec2 uv = (pixel + 0.5) / u_resolution;
        
        // Get the color of interest.
        float color = texture2D(u_texture, uv).r;
        
        // Set the position to somewhere in the 256x1 target texture.
        gl_Position = vec4((color * 255.0 + 0.5) / 256.0 * 2.0 - 1.0, 0.5, 0, 1);
        gl_PointSize = 1.0;
    }
    `,
    fs: `
    precision highp float;
    
    void main() {
        gl_FragColor = vec4(1);
    }
    `,
};