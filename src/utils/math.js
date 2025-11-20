// Math utility functions

export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function normalizeAngle(angle) {
  while (angle > Math.PI * 2) angle -= Math.PI * 2;
  while (angle < 0) angle += Math.PI * 2;
  return angle;
}

export function lerp(start, end, t) {
  return start + (end - start) * t;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

export function circleIntersects(x1, y1, r1, x2, y2, r2) {
  return distance(x1, y1, x2, y2) < r1 + r2;
}

export function pointInCircle(px, py, cx, cy, radius) {
  return distance(px, py, cx, cy) < radius;
}

export function polarToCartesian(centerX, centerY, radius, angleInRadians) {
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}
