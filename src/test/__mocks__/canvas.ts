// Mock for native canvas module to avoid libuuid.so errors in test environment
export default {};
export const createCanvas = () => ({});
export const createImageData = () => ({});
export const loadImage = () => Promise.resolve({});
