export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Particle extends Point3D {
  color: string;
  size: number;
  originalX: number;
  originalZ: number;
  angleOffset: number;
  wobbleSpeed: number;
  wobblePhase: number;
}

export interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  baseSize: number;
  phase: number;
  speed: number;
  color: string;
}

export interface SnowFlake {
  x: number;
  y: number;
  z: number;
  radius: number;
  speed: number;
  wind: number;
}