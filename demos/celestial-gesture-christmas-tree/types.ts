
export enum TreeState {
  CLOSED = 'CLOSED',
  SCATTERED = 'SCATTERED',
  ZOOMED = 'ZOOMED'
}

export interface HandData {
  gesture: 'FIST' | 'OPEN' | 'GRAB' | 'NONE';
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number };
  isDetected: boolean;
}

export interface PhotoItem {
  id: string;
  url: string;
  texture?: any;
}
