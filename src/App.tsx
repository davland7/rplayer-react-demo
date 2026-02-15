import { useCallback, useEffect, useRef, useState } from 'react';
import RPlayer from '@davland7/rplayer';
import Hls from 'hls.js';

function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<RPlayer | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [streamUrl, setStreamUrl] = useState('');
  const [forceHlsJs, setForceHlsJs] = useState(false);
  const [buttonState, setButtonState] = useState<'play' | 'loading' | 'pause'>('play');
  const [nativeHls] = useState(() => {
    const audio = document.createElement('audio');
    return audio.canPlayType('application/vnd.apple.mpegurl') !== '';
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use HLS.js when forced OR when native HLS is not available
  const isHlsStream = RPlayer.isHls(streamUrl);
  const shouldUseHlsJs = (forceHlsJs || !nativeHls) && Hls.isSupported() && isHlsStream;

  // Initialise RPlayer once
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const player = new RPlayer();
    player.attachMedia(audio);
    playerRef.current = player;

    const onPlay = () => setButtonState('pause');
    const onPause = () => setButtonState('play');
    const onWaiting = () => setButtonState('loading');
    const onCanPlay = () => setButtonState(audio.paused ? 'play' : 'pause');
    const onError = () => {
      if (audio.error?.code === 4 && (audio.src === '' || audio.src === globalThis.location.href)) {
        return;
      }

      if (audio.error) {
        setErrorMessage(`Audio error: ${audio.error.message || 'Unknown error'}`);
        console.error('Audio error:', audio.error);
        setButtonState('play');
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      hlsRef.current?.destroy();
    };
  }, []);

  // Load (or reload) the stream source
  const loadStream = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl) return;

    // Tear down previous HLS.js instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (shouldUseHlsJs) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(audio);
      hlsRef.current = hls;
    } else {
      audio.src = streamUrl;
    }
  }, [streamUrl, shouldUseHlsJs]);

  // Reload when URL or HLS.js toggle changes (stop current playback first)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playerRef.current) return;

    audio.pause();
    setButtonState('play');
    loadStream();
  }, [loadStream]);

  const handleTogglePlay = () => {
    const player = playerRef.current;
    if (!player) return;

    try {
      const result = player.togglePlay() as Promise<void> | undefined;
      result?.catch((err: Error) => {
        console.warn('Playback blocked:', err);
        setButtonState('play');
      });
    } catch (err) {
      console.warn('Playback error:', err);
      setButtonState('play');
    }
  };

  const getHlsLabel = () => {
    if (!isHlsStream) {
      return 'HLS.js (not an HLS stream)';
    }
    if (nativeHls) {
      return 'Force HLS.js (native HLS available)';
    }
    return 'HLS.js (auto — no native HLS)';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 text-neutral-900 p-4">
      <main role="main" className="p-4 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2 text-center">
          RPlayer Demo
        </h1>
        <p className="text-neutral-600 mb-6 text-center text-sm">
          Minimal Audio Stream Controller
        </p>
        <audio ref={audioRef} preload="none"></audio>
        {/* Stream URL */}
        <div className="mb-4">
          <label
            htmlFor="streamUrl"
            className="block text-sm font-medium text-neutral-800 mb-2"
          >
            Stream URL
          </label>
          <input
            id="streamUrl"
            type="url"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-neutral-900 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            placeholder="https://example.com/stream.m3u8"
          />
          <a
            href="https://davland7.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-1 text-xs text-neutral-900 border-b border-neutral-900 pb-[1px] hover:border-transparent transition-colors"
          >
            Find a stream URL to test
          </a>
        </div>

        {/* HLS.js toggle */}
        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            id="useHlsJs"
            checked={shouldUseHlsJs}
            disabled={!isHlsStream || !nativeHls}
            onChange={(e) => setForceHlsJs(e.target.checked)}
            className="w-4 h-4 text-neutral-900 bg-white border-neutral-900 rounded focus:ring-neutral-900 disabled:opacity-50"
          />
          <label htmlFor="useHlsJs" className="ml-2 text-sm text-neutral-800">
            {getHlsLabel()}
          </label>
        </div>
        <button
          onClick={handleTogglePlay}
          disabled={buttonState === "loading"}
          className="
            w-full px-4 py-2 not-first:bg-neutral-200 text-neutral-900 border border-neutral-400 rounded hover:bg-neutral-300 hover:cursor-pointer active:bg-neutral-400 active:scale-[0.99] transition font-normal text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buttonState === "play" && "Play"}
          {buttonState === "loading" && "Loading..."}
          {buttonState === "pause" && "Pause"}
        </button>

        {/* Console Info */}
        <div className="mt-6 p-4 bg-neutral-900 text-neutral-100 rounded-lg text-xs font-mono border border-neutral-800 shadow-inner space-y-1">
          <p>
            <span className="text-green-400">›</span> Native HLS:{" "}
            {nativeHls ? "true" : "false"}
          </p>
          <p>
            <span className="text-green-400">›</span> HLS.js:{" "}
            {Hls.isSupported() ? "true" : "false"}
            {shouldUseHlsJs && (
              <span className="ml-1 text-blue-400">(active)</span>
            )}
          </p>
          <p>
            <span className="text-green-400">›</span> iOS:{" "}
            {RPlayer.isIos() ? "true" : "false"}
          </p>
        </div>
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg border border-red-300">
            {errorMessage}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;