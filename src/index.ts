const url = 'https://api.random.org/json-rpc/4/invoke';

export class JsonRpcError<DataType = unknown> extends Error {
	code: number;
	data: DataType;

	constructor(code: number, message: string, data: DataType) {
		super(message);

		this.name = 'JsonRpcError';
		this.code = code;
		this.data = data;
	}
}

function composeRequest(method: string, payload: Record<string, string | number | boolean>): Request {
	const body = {
		jsonrpc: "2.0",
		method: method,
		params: payload,
		id: 1,
	};

	return new Request(url, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});
}

export function parseResponse<ResponseType = unknown>(response: unknown): ResponseType {
	const {result, error} = response as {
		jsonrpc: "2.0",
		result: ResponseType,
		error?: {
			code: number,
			message: string,
			data: unknown,
		},
		id: number,
	};

	if (error) {
		throw new JsonRpcError(error.code, error.message, error.data ?? undefined);
	}

	return result;
}

type BaseOptions = {
  apiKey: string;
};

type PregeneratedRandomization = {
  date: `${number}-${number}-${number}`;
} | {
  id: string;
};

type IntegerOptions = BaseOptions & {
  n: number;
  min: number;
  max: number;
  replacement?: boolean;
  base?: 2 | 8 | 10 | 16;
  pregeneratedRandomization?: PregeneratedRandomization;
};

export function composeIntegerRequest(options: IntegerOptions) {
	return composeRequest('generateIntegers', options);
}
