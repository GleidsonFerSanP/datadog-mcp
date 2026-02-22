export interface WebviewMessage {
  command: string;
  data?: any;
}

export interface SaveCredentialsMessage extends WebviewMessage {
  command: 'saveCredentials';
  data: {
    apiKey: string;
    appKey: string;
    site: string;
    defaultTimeRange: string;
    maxResults: number;
  };
}

export interface TestConnectionMessage extends WebviewMessage {
  command: 'testConnection';
}

export interface ClearCredentialsMessage extends WebviewMessage {
  command: 'clearCredentials';
}

export interface LoadSettingsMessage extends WebviewMessage {
  command: 'loadSettings';
}

export interface SettingsLoadedMessage extends WebviewMessage {
  command: 'settingsLoaded';
  data: {
    hasCredentials: boolean;
    site: string;
    defaultTimeRange: string;
    maxResults: number;
  };
}

export interface ConnectionResultMessage extends WebviewMessage {
  command: 'connectionResult';
  data: {
    success: boolean;
    message: string;
  };
}
