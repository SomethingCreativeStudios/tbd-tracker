export interface TorrentDownloadingModel {
  path: string;
  hash: string;
  name: string;
  url: string;
  fileName: string;
  id: string;
  intervalId: NodeJS.Timer;
}

export interface TorrentQueuedModel {
  path: string;
  url: string;
  fileName: string;
  id: string;
}

export interface DownloadedEvent {
  name: string;
  files: any[];
  error?: string;
}

export interface MetadataEvent {
  hash: string;
  value: {
    name: string;
    id: string;
  };
}

export interface FinishedEvent {
  hash: string;
  name: string;
  id: string;
}

export interface DownloadingEvent {
  hash: string;
  value: {
    name: string;
    justDownloaded: number;
    totalDownloaded: number;
    speed: number;
    progress: number;
    timeLeft: string;
    ratio: string;
    id: string;
  };
}

export interface InitDownloadingEVent {
  hash: string;
  value: {
    name: string;
    id: string;
    url: string;
    queued: boolean;
  };
}

export interface QueuedEvent {
  url: string;
  fileName: string;
}

export interface ErrorEvent {
  hash: string;
  value: string;
}

export enum DownloadingEvents {
  INIT_DOWNLOAD = 'start-downloading',
  DOWNLOADING = 'downloading',
  QUEUED = 'torrent-queued',
  METADATA = 'metadata',
  FINISHED = 'downloaded',
  ERROR = 'error',
}

export interface DownloadingPayload {
  hash: string;
  value: {
    name: string;
    url: string;
    queued: boolean;
  };
}

export interface QueuedPayload {
  url: string;
  fileName: string;
}

export interface TorrentEvents {
  onDone: (id: string) => void;
}

export enum MediaType {
  MOVIE = 'movie',
  TV_SHOW = 'tv-show',
}

export interface DirectDownloadMessage {
  type: MediaType;
  url: string;
  fileName: string;
  downloadPath: string;
}
