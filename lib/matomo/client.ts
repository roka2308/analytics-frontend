import "server-only";

const MATOMO_BASE_URL = process.env.MATOMO_BASE_URL;
const MATOMO_API_TOKEN = process.env.MATOMO_API_TOKEN;

export interface MatomoRequestParams {
  method: string;
  idSite?: number;
  period?: string;
  date?: string;
  [key: string]: string | number | boolean | undefined;
}

export async function matomoRequest<T>(params: MatomoRequestParams): Promise<T> {
  if (!MATOMO_BASE_URL || !MATOMO_API_TOKEN) {
    throw new Error(
      "MATOMO_BASE_URL und MATOMO_API_TOKEN müssen in .env.local gesetzt sein"
    );
  }

  const searchParams = new URLSearchParams({
    module: "API",
    format: "JSON",
    token_auth: MATOMO_API_TOKEN,
    ...Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ),
  });

  const url = `${MATOMO_BASE_URL}/index.php?${searchParams.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("Matomo-Anfrage hat das Timeout überschritten (10s)");
    }
    throw new Error(`Matomo nicht erreichbar: ${String(error)}`);
  }

  if (!response.ok) {
    throw new Error(`Matomo API Fehler: ${response.status} ${response.statusText}`);
  }

  const data: unknown = await response.json();

  if (
    data !== null &&
    typeof data === "object" &&
    "result" in data &&
    (data as Record<string, unknown>).result === "error"
  ) {
    const msg = (data as Record<string, unknown>).message ?? "Unbekannter Fehler";
    throw new Error(`Matomo API Fehler: ${String(msg)}`);
  }

  return data as T;
}
