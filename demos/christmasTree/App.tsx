import React from 'react';
import TreeCanvas from './components/TreeCanvas';
import Snowfall from './components/Snowfall';
import AudioPlayer from './components/AudioPlayer';

const App: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden font-sans">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Content */}
      <main className="relative w-full h-full flex items-center justify-center z-10">
        
        {/* The Generative Tree */}
        <TreeCanvas />
        
        {/* Snow Effect */}
        <Snowfall />

        {/* Text/Greeting Overlay (Optional aesthetics) */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center pointer-events-none opacity-80 z-30">
          <h1 className="text-white text-4xl md:text-6xl font-['Mountains_of_Christmas'] font-bold tracking-wider drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
            Merry Christmas
          </h1>
          <p className="text-blue-200 mt-2 text-lg font-light tracking-widest font-['Nunito'] uppercase text-xs md:text-sm">
            May your days be merry & bright
          </p>
        </div>

      </main>

      {/* Audio Controls */}
      <AudioPlayer />
    </div>
  );
};

export default App;