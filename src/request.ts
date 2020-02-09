import ky from "ky-universal"
import putAfter from "put-after"
import arrayInitial from "array-initial"

/**
 * Ky interface to the Random.org v2 JSON RPC API.
*/
export async function reqAPI(method: string, { data, getRandomData = true, signed = false }: { data?: object, getRandomData?: boolean, signed?: boolean }) {
	const shouldSign = signed && method.startsWith("generate") && (data as any).apiKey
	if (shouldSign) method = putAfter(method, "generate", "Signed")
	const { result, error } = await ky.post("https://api.random.org/json-rpc/2/invoke", {
		json: {
			jsonrpc: "2.0",
			method: method,
			params: data,
			id: 0
		}
	}).json()
	if (error) throw new ReferenceError(error)
	if (shouldSign) {
		return await reqAPI("getResult", {
			data: {
				apiKey: (data as any).apiKey,
				serialNumber: result.random.serialNumber
			},
			getRandomData
		})
	}
	if (getRandomData && !result.random) return undefined
	return getRandomData ? result.random.data : result
}

export async function reqPublic(method: string, { data, convertToNumber }: { data?: object, convertToNumber?: false }): Promise<string[]>
export async function reqPublic(method: string, { data, convertToNumber }: { data?: object, convertToNumber?: true }): Promise<number[]>

/**
 * Ky interface to the Random.org public API.
*/
export async function reqPublic(method: string, { data, convertToNumber = false }: { data?: object, convertToNumber?: boolean }) {
	const result = await ky(method, {
		prefixUrl: "https://www.random.org/",
		searchParams: {
			format: "plain",
			...data,
		},
	}).text()

	const value = arrayInitial(result.split("\n"))

	return convertToNumber ? value.map((val: string) => Number(val)) : value
}
