import { multiplyAlpha } from '../src/index'

describe('multiplyAlpha', () => {
  it('should return (0, 0, 0, 0) for (0, 0, 0, 0)', () => {
    expect(multiplyAlpha({
      red: 0,
      green: 0,
      blue: 0,
      alpha: 0,
    })).toEqual({
      red: 0,
      green: 0,
      blue: 0,
      alpha: 0,
    });
  })

  it('should return (1, 1, 1, 1) for (1, 1, 1, 1)', () => {
    expect(multiplyAlpha({
      red: 1,
      green: 1,
      blue: 1,
      alpha: 1,
    })).toEqual({
      red: 1,
      green: 1,
      blue: 1,
      alpha: 1,
    });
  })

  it('should return (0.5, 0.5, 0.5, 0.5) for (1, 1, 1, 0.5)', () => {
    expect(multiplyAlpha({
      red: 1,
      green: 1,
      blue: 1,
      alpha: 0.5,
    })).toEqual({
      red: 0.5,
      green: 0.5,
      blue: 0.5,
      alpha: 0.5,
    });
  })

  it('should return (0.25, 0.125, 0.0625, 0.25) for (1, 0.5, 0.25, 0.25)', () => {
    expect(multiplyAlpha({
      red: 1,
      green: 0.5,
      blue: 0.25,
      alpha: 0.25,
    })).toEqual({
      red: 0.25,
      green: 0.125,
      blue: 0.0625,
      alpha: 0.25,
    });
  })
})
