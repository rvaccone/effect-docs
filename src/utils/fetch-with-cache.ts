import { LocalStorage } from "@raycast/api";

export const ONE_HOUR_MS = 3600000;

type CacheEntry<T> = {
	data: T;
	timestamp: number;
};

export async function fetchWithCache<T>(
	url: string,
	cacheKey: string,
	cacheTtl: number,
	parse: (raw: string) => T,
): Promise<T> {
	const cachedJson = await LocalStorage.getItem<string>(cacheKey);
	if (cachedJson) {
		try {
			const cached = JSON.parse(cachedJson) as CacheEntry<T>;
			if (Date.now() - cached.timestamp < cacheTtl) return cached.data;

			void refresh(url, cacheKey, parse).catch(() => undefined);
			return cached.data;
		} catch {
			// Ignore malformed cache entries and refresh from the source.
		}
	}

	return refresh(url, cacheKey, parse);
}

async function refresh<T>(url: string, cacheKey: string, parse: (raw: string) => T): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status}`);
	}

	const data = parse(await response.text());
	await LocalStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));

	return data;
}
