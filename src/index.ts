import {
  type CustomLayerInterface,
  type Map,
  MercatorCoordinate,
} from 'mapbox-gl';

/**
 * Returns a layer that renders a circle on a given map.
 *
 * @alpha
 */
export function createGeoCircleLayer(): CustomLayerInterface {
  const RADIUS_IN_METERS = 50.0;
  const NUM_TRIANGLES = 32;
  let program: WebGLProgram | null;
  let aPos: GLint | undefined;
  let buffer: WebGLBuffer | null;
  return {
    id: 'geo-circle',
    type: 'custom',
    onAdd: (map: Map, gl: WebGLRenderingContext) => {
      const vertexSource = `
        uniform mat4 u_matrix;
        attribute vec2 a_pos;
        void main() {
          gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
        }
      `;
      const fragmentSource = `
        void main() {
          /* premultiplies the alpha to the RGB components. */
          gl_FragColor = vec4(0.25, 0.25, 0.5, 0.5);
        }
      `;
      const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram();
      if (program == null) {
        throw new Error('failed to create a WebGL program');
      }
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(
          'failed to link a program',
          gl.getProgramInfoLog(program),
        );
        throw new Error(
          `failed to link a program: ${gl.getProgramInfoLog(program)}`,
        );
      }
      aPos = gl.getAttribLocation(program, 'a_pos');
      const center = MercatorCoordinate.fromLngLat({
        lng: 139.7671,
        lat: 35.6812,
      });
      const radius = RADIUS_IN_METERS * center.meterInMercatorCoordinateUnits();
      const points = [center.x, center.y];
      for (let i = 0; i < NUM_TRIANGLES; ++i) {
        const angle = 2 * Math.PI * (i / NUM_TRIANGLES);
        const x = center.x + radius * Math.cos(angle);
        const y = center.y + radius * Math.sin(angle);
        points.push(x);
        points.push(y);
      }
      points.push(center.x + radius);
      points.push(center.y);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(points),
        gl.DYNAMIC_DRAW,
      );
    },
    render: (gl: WebGLRenderingContext, matrix: number[]) => {
      if (program == null || aPos == null || buffer == null) {
        console.error('shader is not ready');
        return;
      }
      gl.useProgram(program);
      gl.uniformMatrix4fv(
        gl.getUniformLocation(program, 'u_matrix'),
        false,
        matrix,
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      // we can assume BLEND is enabled and the blendFunc is
      // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, NUM_TRIANGLES + 2);
    },
  };
}

// Loads a vertex or fragment shader.
function loadShader(
  gl: WebGLRenderingContext,
  type: GLenum,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (shader == null) {
    throw new Error('failed to create a WebGL shader');
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('failed to load a shader', gl.getShaderInfoLog(shader));
    throw new Error(`failed to load a shader: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}
