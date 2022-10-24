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
import type { LngLat } from './types';

/**
 * Custom layer that renders a simple circle.
 *
 * @alpha
 */
export class GeoCircleLayer implements CustomLayerInterface {
  /** ID of the layer. */
  id: string;
  /** Radius in meters of the circle. */
  radiusInMeters: number;
  /** Center of the circle. */
  center: LngLat;
  /** Number of triangles to represent a circle. */
  numTriangles: number;

  /** Shader program. */
  private program: WebGLProgram | null = null;
  /** Position attribute index. */
  private aPos: GLint | undefined = undefined;
  /** Buffer. */
  private buffer: WebGLBuffer | null = null;

  constructor() {
    this.id = 'geo-circle';
    this.radiusInMeters = 50;
    this.center = {
      lng: 139.7671,
      lat: 35.6812,
    }; // Tokyo Station
    this.numTriangles = 32;
  }

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
    `;
    const fragmentSource = `
      void main() {
        /* premultiplies the alpha to the RGB components. */
        gl_FragColor = vec4(0.25, 0.25, 0.5, 0.5);
      }
    `;
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
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    // we can assume BLEND is enabled and the blendFunc is
    // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, this.numTriangles + 2);
  }
}
