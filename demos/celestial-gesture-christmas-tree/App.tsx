
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TreeState, HandData, PhotoItem } from './types';
import ThreeScene from './components/ThreeScene';
import HandTracker from './components/HandTracker';
import { Camera, Upload, MousePointer2, Hand, Maximize2 } from 'lucide-react';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.CLOSED);
  const [handData, setHandData] = useState<HandData>({
    gesture: 'NONE',
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0.5, y: 0.5 },
    isDetected: false
  });
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Fix: Explicitly type 'file' as 'File' to avoid 'unknown' inference error in URL.createObjectURL
      const newPhotos: PhotoItem[] = Array.from(files).map((file: File) => ({
        id: Math.random().toString(36).substring(2, 11),
        url: URL.createObjectURL(file)
      }));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  useEffect(() => {
    // Gesture Mapping Logic
    if (!handData.isDetected) return;

    if (handData.gesture === 'FIST' && treeState !== TreeState.CLOSED) {
      setTreeState(TreeState.CLOSED);
    } else if (handData.gesture === 'OPEN' && treeState === TreeState.CLOSED) {
      setTreeState(TreeState.SCATTERED);
    } else if (handData.gesture === 'GRAB' && treeState === TreeState.SCATTERED) {
      setTreeState(TreeState.ZOOMED);
    }
    // Added treeState to dependencies to ensure effect has access to current state
  }, [handData.gesture, handData.isDetected, treeState]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans text-white">
      {/* 3D Experience */}
      <ThreeScene 
        treeState={treeState} 
        handData={handData} 
        photos={photos} 
      />

      {/* Hand Tracker Feed (Hidden/Overlay) */}
      <div className={`absolute top-4 right-4 w-48 h-36 border-2 border-yellow-500/30 rounded-lg overflow-hidden transition-opacity duration-500 ${isCameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <HandTracker onHandUpdate={setHandData} onActive={setIsCameraActive} />
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] px-2 py-1 text-center">
          {handData.isDetected ? `Gesture: ${handData.gesture}` : 'Detecting Hands...'}
        </div>
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
        <header className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-4xl font-black tracking-tighter glow-text italic">
              CELESTIAL <span className="text-yellow-500">GLOW</span>
            </h1>
            <p className="text-sm opacity-60 uppercase tracking-widest mt-1">Experimental Gesture-Driven 3D Tree</p>
          </div>
          
          <div className="flex gap-4">
             <label className="cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full flex items-center gap-2 transition-all">
               <Upload size={18} />
               <span>Add Photos</span>
               <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
             </label>
             <button 
                onClick={() => setTreeState(TreeState.CLOSED)}
                className={`px-4 py-2 rounded-full border border-white/20 backdrop-blur-md transition-all ${treeState === TreeState.CLOSED ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-white/10'}`}
             >
               Reset Tree
             </button>
          </div>
        </header>

        <footer className="flex justify-between items-end pointer-events-auto">
          <div className="space-y-4 max-w-sm">
            <div className="bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl">
              <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-4">Gesture Guide</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-900/40 flex items-center justify-center border border-red-500/30"><Maximize2 size={16}/></div>
                  <span><strong className="text-red-400">Open Palm</strong> to Scatter the tree</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-900/40 flex items-center justify-center border border-green-500/30"><Hand size={16}/></div>
                  <span><strong className="text-green-400">Fist</strong> to Assemble the tree</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-900/40 flex items-center justify-center border border-yellow-500/30"><MousePointer2 size={16}/></div>
                  <span><strong className="text-yellow-400">Grab (Pinch)</strong> to Focus a photo</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-right opacity-40 text-xs">
            <p>GEMINI 3 PRO PREVIEW & THREE.JS</p>
            <p>© 2024 CREATIVE TECH LAB</p>
          </div>
        </footer>
      </div>

      {!isCameraActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center p-10 border border-white/10 rounded-3xl bg-neutral-900/50 max-w-md shadow-2xl">
            <Camera className="mx-auto mb-6 text-yellow-500" size={64} />
            <h2 className="text-2xl font-bold mb-4 italic">Initialize Vision Tracking</h2>
            <p className="text-sm opacity-60 mb-8 leading-relaxed">
              We need access to your camera to detect hand gestures. All processing happens locally on your device.
            </p>
            <button 
               onClick={() => setIsCameraActive(true)}
               className="w-full py-4 bg-yellow-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-yellow-400 transition-colors"
            >
              Start Experience
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
