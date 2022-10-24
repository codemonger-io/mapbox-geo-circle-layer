/**
 * Loads a vertex or fragment shader.
 *
 * @param gl -
 *
 *   WebGL context.
 *
 * @param type -
 *
 *   Must be `gl.VERTEX_SHADER` or `gl.FRAGMENT_SHADER`.
 *
 * @param source -
 *
 *   Shader source code to be compiled.
 *
 * @return
 *
 *   Compiled shader.
 *
 * @throws Error
 *
 *   If it fails to create a shader, or fails to compile `source`.
 *
 * @internal
 */
export function loadShader(
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
