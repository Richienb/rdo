type Base = 2 | 8 | 10 | 16;
type Rnd = 'new' | `id.${string}` | `${number}-${number}-${number}`;

type IntegerOptions = {
	num: number;
	min: number;
	max: number;
	base?: Base;
	rnd?: Rnd;
};

type SequenceOptions = {
	min: number;
	max: number;
	rnd?: Rnd;
};

type StringOptions = {
	num: number;
	len: number;
	digits?: boolean;
	upperalpha?: boolean;
	loweralpha?: boolean;
	unique?: boolean;
	rnd?: Rnd;
};

type QuotaOptions = {
	ip?: string;
};

function composeRequest(method: string, payload: Record<string, string | number | boolean>): Request {
	const url = `https://www.random.org/${method}/`;

	const params = new URLSearchParams({
		format: 'plain',
	});

	for (const [key, value] of Object.entries(payload)) {
		if (value !== undefined) {
			const normalized = typeof value === 'boolean'
				? (value ? 'on' : 'off')
				: value;

			params.append(key, normalized.toString());
		}
	}

	return new Request(`${url}?${params.toString()}`);
}

/**
@example
```
import {composeIntegerRequest, parseNumericalResponse} from 'rdo/public';

const response = await fetch(composeIntegerRequest({
	num: 5,
	min: 1,
	max: 3,
}))

const result = parseNumericalResponse(await response.text());
//=> [3, 1, 3, 2, 1]
```
*/
export function composeIntegerRequest(options: IntegerOptions): Request {
	return composeRequest('integers', { base: 10, col: 1, ...options });
}

/**
@example
```
import {composeSequenceRequest, parseNumericalResponse} from 'rdo/public';

const response = await fetch(composeSequenceRequest({
	min: 1,
	max: 5,
}))

const result = parseNumericalResponse(await response.text());
//=> [4, 5, 2, 3, 1]
```
*/
export function composeSequenceRequest(options: SequenceOptions): Request {
	return composeRequest('sequences', { col: 1, ...options });
}

/**
@example
```
import {composeStringRequest, parseTextResponse} from 'rdo/public';

const response = await fetch(composeStringRequest({
	num: 1,
	len: 5,
	loweralpha: true,
}));

const result = parseTextResponse(await response.text());
//=> ['giwnx']
```
*/
export function composeStringRequest(options: StringOptions): Request {
	return composeRequest('strings', options);
}

/**
@example
```
import {composeQuotaRequest, parseQuotaResponse} from 'rdo/public';

const response = await fetch(composeQuotaRequest())

const result = parseQuotaResponse(await response.text());
//=> 974610
```
*/
export function composeQuotaRequest(options: QuotaOptions = {}): Request {
	return composeRequest('quota', options);
}

export function parseTextResponse(response: string): string[] {
	const parsed = response.split('\n');

	parsed.pop();

	return parsed;
}

export function parseNumericalResponse(response: string): number[] {
	const parsedText = parseTextResponse(response);

	return parsedText.map(value => Number(value));
}

export function parseQuotaResponse(response: string): number {
	return Number.parseInt(response)
}
