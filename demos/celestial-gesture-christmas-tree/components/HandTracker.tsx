
import React, { useRef, useEffect } from 'react';
import { HandData } from '../types';

interface HandTrackerProps {
  onHandUpdate: (data: HandData) => void;
  onActive: (active: boolean) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onHandUpdate, onActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const hands = new (window as any).Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    hands.onResults((results: any) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Simple gesture heuristic
        // FIST: Finger tips are close to the palm
        // OPEN: Finger tips are far
        const dist = (p1: any, p2: any) => Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
        
        const wrist = landmarks[0];
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];

        const avgFingerDist = (dist(indexTip, wrist) + dist(middleTip, wrist) + dist(ringTip, wrist) + dist(pinkyTip, wrist)) / 4;
        
        let gesture: HandData['gesture'] = 'NONE';
        if (avgFingerDist < 0.25) gesture = 'FIST';
        else if (avgFingerDist > 0.45) gesture = 'OPEN';
        
        // Grab detect (Thumb and Index Tip distance)
        const pinchDist = dist(thumbTip, indexTip);
        if (pinchDist < 0.05) gesture = 'GRAB';

        // Calculate rotation based on index base and wrist
        const indexBase = landmarks[5];
        const angleY = Math.atan2(indexBase.x - wrist.x, indexBase.y - wrist.y);

        onHandUpdate({
          gesture,
          rotation: { x: landmarks[0].z, y: angleY, z: 0 },
          position: { x: landmarks[0].x, y: landmarks[0].y },
          isDetected: true
        });
      } else {
        onHandUpdate({
          gesture: 'NONE',
          rotation: { x: 0, y: 0, z: 0 },
          position: { x: 0.5, y: 0.5 },
          isDetected: false
        });
      }
    });

    const camera = new (window as any).Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current! });
      },
      width: 640,
      height: 480
    });

    camera.start();
    onActive(true);

    return () => {
      camera.stop();
      hands.close();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover scale-x-[-1]"
      autoPlay
      playsInline
      muted
    />
  );
};

export default HandTracker;
