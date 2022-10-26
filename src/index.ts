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
 * Default radius of a circle.
 *
 * @alpha
 */
export const DEFAULT_RADIUS_IN_METERS = 50;

/**
 * Default center of a circle.
 *
 * @alpha
 */
export const DEFAULT_CENTER = { lng: 139.7671, lat: 35.6812 } as const;

/**
 * Default fill color of a circle.
 *
 * @alpha
 */
export const DEFAULT_FILL = {
  red: 1.0,
  green: 1.0,
  blue: 1.0,
  alpha: 1.0,
} as const;

/**
 * Default number of triangles to approximate a circle.
 *
 * @alpha
 */
export const DEFAULT_NUM_TRIANGLES = 32;

/**
 * Constructor properties for `GeoCircleLayer`.
 *
 * @alpha
 */
export interface GeoCircleLayerProperties {
  /** Radius of the circle in meters. */
  radiusInMeters?: number;
  /** Center of the circle. */
  center?: LngLat;
  /** Fill color of the circle. */
  fill?: RGBA;
  /** Number of triangles to approximate the circle. */
  numTriangles?: number;
}

/**
 * Custom layer that renders a simple circle.
 *
 * @alpha
 */
export class GeoCircleLayer implements CustomLayerInterface {
  /** Radius of the circle. */
  private _radiusInMeters: number;
  /** Center of the circle. */
  private _center: LngLat;
  /** Fill color of the circle. */
  private _fill: RGBA;
  /** Number of triangles to approximate the circle. */
  private _numTriangles: number;

  /** Current map instance. */
  private map: Map | null = null;
  /** Shader program. */
  private program: WebGLProgram | null = null;
  /** Position attribute index. */
  private aPos: GLint | undefined = undefined;
  /** Buffer. */
  private buffer: WebGLBuffer | null = null;
  /** Whether the buffer needs refresh. */
  private isDirty: boolean = true;

  /**
   * Initializes a layer.
   *
   * @remarks
   *
   * You may omit all or part of `props`.
   * The following are default values for the properties,
   * - `radiusInMeters`: `50`
   * - `center`: `{ lng: 139.7671, lat: 35.6812 }` (Tokyo Station)
   * - `fill`: `{ red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 }` (white)
   * - `numTriangles`: `32`
   *
   * Premultiply the alpha to the red, gree, and blue components of `fill`.
   *
   * @param id -
   *
   *   ID of the layer.
   *
   * @param props -
   *
   *   Optional properties of the circle.
   */
  constructor(
    public readonly id: string,
    props?: GeoCircleLayerProperties,
  ) {
    this._radiusInMeters = props?.radiusInMeters ?? DEFAULT_RADIUS_IN_METERS;
    this._center = props?.center ?? DEFAULT_CENTER;
    this._fill = props?.fill ?? DEFAULT_FILL;
    this._numTriangles = props?.numTriangles ?? DEFAULT_NUM_TRIANGLES;
  }

  /** Type is always "custom". */
  get type(): 'custom' {
    return 'custom';
  }

  /**
   * Radius in meters of the circle.
   *
   * @remarks
   *
   * Updating this property will trigger repaint of the map.
   */
  get radiusInMeters(): number {
    return this._radiusInMeters;
  }
  set radiusInMeters(radiusInMeters: number) {
    this._radiusInMeters = radiusInMeters;
    this.triggerRepaint();
  }

  /**
   * Center of the circle.
   *
   * @remarks
   *
   * Updating this property will trigger repaint of the map.
   */
  get center(): LngLat {
    return this._center;
  }
  set center(center: LngLat) {
    this._center = center;
    this.triggerRepaint();
  }

  /**
   * Fill color of the circle.
   *
   * @remarks
   *
   * Updating this property will trigger repaint of the map.
   */
  get fill(): RGBA {
    return this._fill;
  }
  set fill(fill: RGBA) {
    this._fill = fill;
    // no need to recalculate the circle
    this.map?.triggerRepaint();
  }

  /** Number of triangles to approximate the circle. */
  get numTriangles(): number {
    return this._numTriangles;
  }

  /** Requests repaint. */
  private triggerRepaint() {
    this.isDirty = true;
    this.map?.triggerRepaint();
  }

  onAdd(map: Map, gl: WebGLRenderingContext) {
    this.map = map;
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
    const program = gl.createProgram()!;
      // everything should work even if program is null
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
    const buffer = gl.createBuffer();
    this.buffer = buffer;
  }

  prerender(gl: WebGLRenderingContext) {
    // refreshes the buffer if necessary
    if (this.isDirty) {
      const buffer = this.buffer;
      if (buffer == null) {
        console.error('buffer is not ready');
        return;
      }
      this.isDirty = false;
      const center = MercatorCoordinate.fromLngLat(this._center);
      const radius =
        this._radiusInMeters * center.meterInMercatorCoordinateUnits();
      const points = [center.x, center.y];
      for (let i = 0; i < this._numTriangles; ++i) {
        const angle = 2 * Math.PI * (i / this._numTriangles);
        const x = center.x + radius * Math.cos(angle);
        const y = center.y + radius * Math.sin(angle);
        points.push(x);
        points.push(y);
      }
      points.push(center.x + radius);
      points.push(center.y);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(points),
        gl.DYNAMIC_DRAW,
      );
    }
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
      [this._fill.red, this._fill.green, this._fill.blue, this._fill.alpha],
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    // we can assume BLEND is enabled and the blendFunc is
    // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, this._numTriangles + 2);
  }
}
