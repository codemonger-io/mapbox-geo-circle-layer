// mapbox-gl v3.x requires TextDecoder which is not provided by jsdom
// see https://stackoverflow.com/a/68468204
const { TextDecoder } = require('node:util');
global.TextDecoder = TextDecoder;
