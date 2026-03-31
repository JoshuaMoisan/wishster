export type SpotifyTrackSearchItem = {
  id: string;
  uri: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; release_date?: string };
  duration_ms: number;
};

export type SpotifyWebPlaybackPlayer = {
  addListener: (event: string, cb: (arg: unknown) => void) => void;
  removeListener: (event: string, cb?: (arg: unknown) => void) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  getCurrentState: () => Promise<SpotifyPlaybackState | null>;
  setName: (name: string) => void;
  getVolume: () => Promise<number>;
  setVolume: (v: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  previousTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
  activateElement: () => Promise<void>;
};

export type SpotifyPlaybackState = {
  paused: boolean;
  position: number;
  duration: number;
  track_window: { current_track: { uri: string } | null };
};

declare global {
  interface Window {
    Spotify?: {
      Player: new (opts: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyWebPlaybackPlayer;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}
