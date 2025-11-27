declare module '@capacitor/share' {
  export interface ShareOptions {
    title?: string;
    text?: string;
    url?: string;
    dialogTitle?: string;
    files?: string[];
  }
  export interface ShareResult {
    activityType?: string;
  }
  export interface SharePlugin {
    share(options: ShareOptions): Promise<ShareResult>;
  }
  const Share: SharePlugin;
  export { Share };
}

declare module '@capacitor/core' {
  export interface PluginRegistry {
    [pluginName: string]: any;
  }
  export interface CapacitorGlobal {
    isNativePlatform(): boolean;
    platform: string;
    Plugins: PluginRegistry;
  }
  const Capacitor: CapacitorGlobal;
  export { Capacitor };
}

declare module '@capacitor/filesystem' {
  export interface WriteFileOptions {
    path: string;
    data: string;
    directory?: Directory;
    encoding?: Encoding;
    recursive?: boolean;
  }
  export interface WriteFileResult {
    uri: string;
  }
  export enum Directory {
    Documents = 'DOCUMENTS',
    Data = 'DATA',
    Cache = 'CACHE',
    External = 'EXTERNAL',
    ExternalStorage = 'EXTERNAL_STORAGE',
  }
  export enum Encoding {
    UTF8 = 'utf8',
    ASCII = 'ascii',
    UTF16 = 'utf16',
  }
  export interface FilesystemPlugin {
    writeFile(options: WriteFileOptions): Promise<WriteFileResult>;
  }
  const Filesystem: FilesystemPlugin;
  export { Filesystem };
}