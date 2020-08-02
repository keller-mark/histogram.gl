
// Reference: https://github.com/lodash/lodash/blob/86a852fe763935bb64c12589df5391fd7d3bb14d/.internal/baseRange.js#L12
function baseRange(start, end, step, fromRight) {
    let index = -1
    let length = Math.max(Math.ceil((end - start) / (step || 1)), 0)
    const result = new Array(length)
  
    while (length--) {
      result[fromRight ? length : ++index] = start
      start += step
    }
    return result
}

// Reference: https://github.com/lodash/lodash/blob/86a852fe763935bb64c12589df5391fd7d3bb14d/toFinite.js#L28
function toFinite(value) {
    if (!value) {
      return value === 0 ? value : 0
    }
    return value === value ? value : 0
}

export function range(start, end, step) {
    // Ensure the sign of `-0` is preserved.
    start = toFinite(start)
    if (end === undefined) {
      end = start
      start = 0
    } else {
      end = toFinite(end)
    }
    step = step === undefined ? (start < end ? 1 : -1) : toFinite(step)
    return baseRange(start, end, step, false)
}

// Reference: https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html
export function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
  
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

// Reference: https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html
export function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }
  
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}