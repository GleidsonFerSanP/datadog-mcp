export interface DatadogCredentials {
  apiKey: string;
  appKey: string;
  site: string;
}

const siteUrlMap: Record<string, string> = {
  'datadoghq.com': 'https://api.datadoghq.com',
  'datadoghq.eu': 'https://api.datadoghq.eu',
  'us3.datadoghq.com': 'https://api.us3.datadoghq.com',
  'us5.datadoghq.com': 'https://api.us5.datadoghq.com',
  'ap1.datadoghq.com': 'https://api.ap1.datadoghq.com',
  'ddog-gov.com': 'https://api.ddog-gov.com',
};

export function getBaseUrl(site: string): string {
  return siteUrlMap[site] ?? 'https://api.datadoghq.com';
}

export async function validateCredentials(credentials: DatadogCredentials): Promise<boolean> {
  const baseUrl = getBaseUrl(credentials.site);
  try {
    const response = await fetch(`${baseUrl}/api/v1/validate`, {
      method: 'GET',
      headers: {
        'DD-API-KEY': credentials.apiKey,
        'DD-APPLICATION-KEY': credentials.appKey,
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
