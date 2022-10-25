/**
 * Provides a Mapbox custom layer that renders a simple circle.
 *
 * @remarks
 *
 * A circle is represented with the center and radius in meters (not pixels).
 *
 * @packageDocumentation
 */

import {
  type CustomLayerInterface,
  type Map,
  MercatorCoordinate,
} from 'mapbox-gl';

import { loadShader } from './private/load-shader';
import type { LngLat, RGBA } from './types';

/**
 * Default number of triangles to approximate a circle.
 *
 * @alpha
 */
export const DEFAULT_NUM_TRIANGLES = 32;

/**
 * Custom layer that renders a simple circle.
 *
 * @alpha
 */
export class GeoCircleLayer implements CustomLayerInterface {
  /** Shader program. */
  private program: WebGLProgram | null = null;
  /** Position attribute index. */
  private aPos: GLint | undefined = undefined;
  /** Buffer. */
  private buffer: WebGLBuffer | null = null;

  /**
   * Initializes a layer.
   *
   * @remarks
   *
   * Premultiply alpha to the red, gree, and blue components of `fill`.
   *
   * @param id -
   *
   *   ID of the layer.
   *
   * @param radiusInMeters -
   *
   *   Radius of the circle in meters.
   *
   * @param center -
   *
   *   Center of the circle.
   *   At Tokyo Station `{lng:139.7671, lat:35.6812}` by default.
   *
   * @param fill -
   *
   *   Fill color of the circle.
   *   Opaque white by default.
   *
   * @param numTriangles -
   *
   *   Number of triangles to approximate a circle.
   *   `32` by default.
   */
  constructor(
    public readonly id: string,
    public radiusInMeters: number,
    public center: LngLat = { lng: 139.7671, lat: 35.6812 },
    public fill: RGBA = { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 },
    public numTriangles: number = DEFAULT_NUM_TRIANGLES,
  ) {}

  /** Type is always "custom". */
  get type(): 'custom' {
    return 'custom';
  }

  onAdd(map: Map, gl: WebGLRenderingContext) {
    const vertexSource = `
      uniform mat4 u_matrix;
      attribute vec2 a_pos;
      void main() {
        gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
      }
    `.trim();
    const fragmentSource = `
      uniform lowp vec4 u_fill;
      void main() {
        /* premultiplies the alpha to the RGB components. */
        gl_FragColor = u_fill;
      }
    `.trim();
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (program == null) {
      throw new Error('failed to create a WebGL program');
    }
    this.program = program;
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
    const aPos = gl.getAttribLocation(program, 'a_pos');
    this.aPos = aPos;
    const center = MercatorCoordinate.fromLngLat(this.center);
    const radius =
      this.radiusInMeters * center.meterInMercatorCoordinateUnits();
    const points = [center.x, center.y];
    for (let i = 0; i < this.numTriangles; ++i) {
      const angle = 2 * Math.PI * (i / this.numTriangles);
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      points.push(x);
      points.push(y);
    }
    points.push(center.x + radius);
    points.push(center.y);
    const buffer = gl.createBuffer();
    this.buffer = buffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(points),
      gl.DYNAMIC_DRAW,
    );
  }

  render(gl: WebGLRenderingContext, matrix: number[]) {
    const program = this.program;
    const aPos = this.aPos;
    const buffer = this.buffer;
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
    gl.uniform4fv(
      gl.getUniformLocation(program, 'u_fill'),
      [this.fill.red, this.fill.green, this.fill.blue, this.fill.alpha],
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    // we can assume BLEND is enabled and the blendFunc is
    // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, this.numTriangles + 2);
  }
}
