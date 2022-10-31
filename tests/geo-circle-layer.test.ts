import { jest } from '@jest/globals';
import type { Map } from 'mapbox-gl';

import {
  DEFAULT_CENTER,
  DEFAULT_FILL,
  DEFAULT_NUM_TRIANGLES,
  DEFAULT_RADIUS_IN_METERS,
  GeoCircleLayer,
} from '../src/index';

describe('GeoCircleLayer', () => {
  it('new GeoCircleLayer("test-layer") should create a GeoCircleLayer with id="test-layer" and the default parameters', () => {
    const id = 'test-layer';
    const layer = new GeoCircleLayer(id);
    expect(layer.id).toBe(id);
    expect(layer.radiusInMeters).toBe(DEFAULT_RADIUS_IN_METERS);
    expect(layer.center).toEqual(DEFAULT_CENTER);
    expect(layer.fill).toEqual(DEFAULT_FILL);
    expect(layer.numTriangles).toBe(DEFAULT_NUM_TRIANGLES);
  });

  it('new GeoCircleLayer("another-circle") should create a GeoCircleLayer with id="another-circle"', () => {
    const id = 'another-circle';
    const layer = new GeoCircleLayer(id);
    expect(layer.id).toBe(id);
  });

  it('new GeoCircleLayer("test-layer", {center: (N40.4418, W80.0128)}) should create a GeoCircleLayer with id="test-layer", the specified center, and the other parameters default', () => {
    const id = 'test-layer';
    const center = { lng: 40.4418, lat: -80.0128 };
    const layer = new GeoCircleLayer(id, { center });
    expect(layer.id).toBe(id);
    expect(layer.radiusInMeters).toBe(DEFAULT_RADIUS_IN_METERS);
    expect(layer.center).toEqual(center);
    expect(layer.fill).toEqual(DEFAULT_FILL);
    expect(layer.numTriangles).toBe(DEFAULT_NUM_TRIANGLES);
  });

  it('new GeoCircleLayer("test-layer", {radiusInMeters: 1000}) should create a GeoCircleLayer with id="test-layer", radiusInMeters=1000, and the other parameters default', () => {
    const id = 'test-layer';
    const radiusInMeters = 1000;
    const layer = new GeoCircleLayer(id, { radiusInMeters });
    expect(layer.id).toBe(id);
    expect(layer.center).toEqual(DEFAULT_CENTER);
    expect(layer.radiusInMeters).toBe(radiusInMeters);
    expect(layer.fill).toEqual(DEFAULT_FILL);
    expect(layer.numTriangles).toBe(DEFAULT_NUM_TRIANGLES);
  });

  // extreme case
  it('new GeoCircleLayer("test-layer", {radiusInMeters: 0}) should create a GeoCircleLayer with radiusInMeters=0', () => {
    const radiusInMeters = 0;
    const layer = new GeoCircleLayer('test-layer', { radiusInMeters });
    expect(layer.radiusInMeters).toBe(radiusInMeters);
  });

  it('new GeoCircleLayer("test-layer", {fill: (0.25, 0.25, 0.5, 0.5)}) should create a GeoCircleLayer with id="test-layer", the specified fill, and the other parameters default', () => {
    const id = 'test-layer';
    const fill = { red: 0.25, green: 0.25, blue: 0.5, alpha: 0.5 };
    const layer = new GeoCircleLayer(id, { fill });
    expect(layer.id).toBe(id);
    expect(layer.center).toEqual(DEFAULT_CENTER);
    expect(layer.radiusInMeters).toBe(DEFAULT_RADIUS_IN_METERS);
    expect(layer.fill).toEqual(fill);
    expect(layer.numTriangles).toBe(DEFAULT_NUM_TRIANGLES);
  });

  it('new GeoCircleLayer("test-layer", {numTriangles: 3}) should create a GeoCircleLayer with id="test-layer", numTriangles=3, and the other parameters default', () => {
    const id = 'test-layer';
    const numTriangles = 3;
    const layer = new GeoCircleLayer(id, { numTriangles });
    expect(layer.id).toBe(id);
    expect(layer.center).toEqual(DEFAULT_CENTER);
    expect(layer.radiusInMeters).toBe(DEFAULT_RADIUS_IN_METERS);
    expect(layer.fill).toEqual(DEFAULT_FILL);
    expect(layer.numTriangles).toBe(numTriangles);
  });

  it('new GeoCircleLayer("test-layer", {radiusInMeters: -1}) should throw RangeError', () => {
    expect(() => {
      new GeoCircleLayer('test-layer', { radiusInMeters: -1 });
    }).toThrow(RangeError);
  });

  it('new GeoCircleLayer("test-layer", {numTriangles: 2}) should throw RangeError', () => {
    expect(() => {
      new GeoCircleLayer('test-layer', { numTriangles: 2 });
    }).toThrow(RangeError);
  });

  describe('with GeoCircleLayer that has the default parameters and is added to a map', () => {
    let layer: GeoCircleLayer;
    // every test initializes triggerRepaint and fakeMap
    let triggerRepaint: jest.Mocked<Map['triggerRepaint']>;
    let fakeMap: any;
    // fake WebGL provies minimum methods
    const fakeGl = {
      createShader: () => ({}), // non-null
      shaderSource: () => {},
      compileShader: () => {},
      getShaderParameter: () => true, // never fails
      createProgram: () => ({}), // non-null
      attachShader: () => {},
      linkProgram: () => {},
      getProgramParameter: () => true, // never fails
      getProgramInfoLog: () => 'fake WebGL context',
      getAttribLocation: () => 1,
      createBuffer: () => ({}), // non-null
    } as any;

    beforeEach(() => {
      layer = new GeoCircleLayer('test-layer');
      triggerRepaint = jest.fn<Map['triggerRepaint']>();
      fakeMap = {
        triggerRepaint,
        on: () => {},
        off: () => {},
      };
      layer.onAdd(fakeMap as Map, fakeGl as WebGLRenderingContext);
    });

    it('updating center should be possible and trigger repaint', () => {
      const center = { lng: 47.3698, lat: -8.5389 };
      layer.center = center;
      expect(layer.center).toEqual(center);
      expect(triggerRepaint).toHaveBeenCalled();
    });

    it('updating radiusInMeters should be possible and trigger repaint', () => {
      const radiusInMeters = 200;
      layer.radiusInMeters = radiusInMeters;
      expect(layer.radiusInMeters).toBe(radiusInMeters);
      expect(triggerRepaint).toHaveBeenCalled();
    });

    it('updating fill should be possible and trigger repaint', () => {
      const fill = { red: 0.5, green: 0.25, blue: 0.25, alpha: 0.5 };
      layer.fill = fill;
      expect(layer.fill).toEqual(fill);
      expect(triggerRepaint).toHaveBeenCalled();
    });

    it('updating numTriangles should be possible and trigger repaint', () => {
      const numTriangles = 16;
      layer.numTriangles = numTriangles;
      expect(layer.numTriangles).toBe(numTriangles);
      expect(triggerRepaint).toHaveBeenCalled();
    });

    it('attempt to update radiusInMeters with -1 should throw RangeError without triggering repaint', () => {
      expect(() => { layer.radiusInMeters = -1}).toThrow(RangeError);
      expect(layer.radiusInMeters).toBe(DEFAULT_RADIUS_IN_METERS);
      expect(triggerRepaint).not.toHaveBeenCalled();
    });

    it('attempt to update numTriangles with 2 should throw RangeError without triggering repaint', () => {
      expect(() => { layer.numTriangles = 2 }).toThrow(RangeError);
      expect(layer.numTriangles).toBe(DEFAULT_NUM_TRIANGLES);
      expect(triggerRepaint).not.toHaveBeenCalled();
    });
  });
});
