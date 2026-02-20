import ky from 'ky';

// TODO: Allow providing additional ky options
async function request(method: string, options: { params?: Record<string, string | number>, parseNumber: true }): Promise<number[]>
async function request(method: string, options: { params?: Record<string, string | number>, parseNumber: false }): Promise<string[]>
async function request(method: string, options: { params?: Record<string, string | number>, parseNumber?: boolean }): Promise<number[] | string[]>
async function request(method: string, { params, parseNumber = false }: { params?: Record<string, string | number>, parseNumber?: boolean }) {
	const response = await ky(method, {
		prefixUrl: "https://www.random.org/",
		searchParams: {
			format: "plain",
			...params,
		},
	}).text()

	const result = response.split("\n").slice(0, -1)

	if (parseNumber) {
		return result.map((val: string) => Number(val))
	}

	return result
}

export async function randomIntegers(options: { num: number, min: number, max: number, base?: 10, rnd?: 'new' | string | 'today' | 'yesterday'}): Promise<number[]>
export async function randomIntegers(options: { num: number, min: number, max: number, base?: 2 | 8 | 16, rnd?: 'new' | string | 'today' | 'yesterday'}): Promise<string[]>
export async function randomIntegers(options: { num: number, min: number, max: number, base?: 2 | 8 | 10 | 16, rnd?: 'new' | string | 'today' | 'yesterday'}): Promise<number[] | string[]> {
	options  = {
		base: 10,
		rnd: 'new',
		...options,
	};

	return request("integers", {
		params: options,
		parseNumber: options.base == 10,
	});
}

export async function randomSequence(options: { min: number, max: number, rnd?: 'new' | string | 'today' | 'yesterday' }): Promise<number[]> {
	options = {
		rnd: 'new',
		...options,
	};

	return await request("sequence", {
		params: options,
		parseNumber: true,
	});
}

export async function randomStrings(options: {
	num: number,
	len: number,
	digits?: 'on' | 'off',
	upperalpha?: 'on' | 'off',
	loweralpha?: 'on' | 'off',
	unique?: 'on' | 'off',
	format?: 'html' | 'plain',
	rnd?: 'new' | string
}): Promise<string[]> {
	options = {
		digits: 'off',
		upperalpha: 'off',
		loweralpha: 'off',
		unique: 'off',
		format: 'plain',
		rnd: 'new',
		...options,
	};

	return request("strings", {
		params: options,
		parseNumber: false,
	});
}

export async function getQuota(ip?: string): Promise<number> {
	const result = await request("quota", {
		params: {ip},
		parseNumber: true,
	});

	return result[0];
}
