import { useEffect, useRef, useState } from 'react';
import { guideRect } from '../vision/sampling.js';
import { sampleVideoFrame, describeCameraError } from '../lib/capture.js';

/**
 * Live camera preview with a 3x3 guide. The guide square is 70% of the shorter
 * side of the frame; the same rectangle is used for sampling, so what the user
 * sees inside the guide is exactly what gets read.
 */
export default function CameraCapture({ onCapture, disabled }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | starting | ready | error
  const [error, setError] = useState('');
  const [frame, setFrame] = useState(null);

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const start = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setError('This browser does not support camera access. Upload photos instead.');
      return;
    }
    setStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      setFrame({ w: video.videoWidth, h: video.videoHeight });
      setStatus('ready');
    } catch (err) {
      stop();
      setStatus('error');
      setError(describeCameraError(err));
    }
  };

  useEffect(() => stop, []);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || status !== 'ready') return;
    onCapture(sampleVideoFrame(video));
  };

  const guide = frame ? guideRect(frame.w, frame.h) : null;

  return (
    <div className="space-y-3">
      <div
        className="relative mx-auto w-full overflow-hidden rounded-xl bg-slate-900"
        style={frame ? { aspectRatio: `${frame.w} / ${frame.h}` } : { aspectRatio: '4 / 3' }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          aria-label="Live camera preview"
          className={`h-full w-full object-contain ${status === 'ready' ? '' : 'opacity-0'}`}
        />
        {status === 'ready' && guide && (
          <div
            className="pointer-events-none absolute grid grid-cols-3 grid-rows-3 border-2 border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.35)]"
            style={{
              left: `${(guide.x / frame.w) * 100}%`,
              top: `${(guide.y / frame.h) * 100}%`,
              width: `${(guide.size / frame.w) * 100}%`,
              height: `${(guide.size / frame.h) * 100}%`,
            }}
            aria-hidden="true"
          >
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="border border-white/50" />
            ))}
          </div>
        )}
        {status !== 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-200">
            {status === 'starting' ? (
              <>
                <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-white" aria-hidden="true" />
                <p className="text-sm">Starting camera… allow access if your browser asks.</p>
              </>
            ) : (
              <>
                <p className="max-w-xs text-sm">
                  {status === 'error' ? error : 'Enable the camera to scan a face. Your images stay in this browser.'}
                </p>
                <button
                  type="button"
                  onClick={start}
                  disabled={disabled}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-50"
                >
                  {status === 'error' ? 'Try again' : 'Enable camera'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {status === 'ready' && (
        <button
          type="button"
          onClick={handleCapture}
          disabled={disabled}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
        >
          Capture this face
        </button>
      )}
      {status === 'error' && error && <p role="alert" className="sr-only">{error}</p>}
    </div>
  );
}
