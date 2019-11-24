import ky from "ky-universal"
import _ from "lodash"
import putAfter from "put-after"

/**
 * Ky interface to the Random.org v2 JSON RPC API.
*/
export async function reqAPI(method: string, { data, getRandomData = true, signed = false }: { data?: object, getRandomData?: boolean, signed?: boolean }) {
    const shouldSign = signed && method.startsWith("generate") && (data as any).apiKey
    if (shouldSign) method = putAfter(method, "generate", "Signed")
    const res = await ky.post("https://api.random.org/json-rpc/2/invoke", {
        json: {
            jsonrpc: "2.0",
            method: method,
            params: data,
            id: 0
        }
    });
    const { result, error } = await res.json();
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

export async function reqBase(method: string, { data, convertToNumber }: { data?: object, convertToNumber?: false }): Promise<string[]>
export async function reqBase(method: string, { data, convertToNumber }: { data?: object, convertToNumber?: true }): Promise<number[]>

/**
 * Ky interface to the Random.org public API.
*/
export async function reqBase(method: string, { data, convertToNumber = false }: { data?: object, convertToNumber?: boolean }) {
    const res = await ky(method, {
        prefixUrl: "https://www.random.org/",
        searchParams: {
            format: "plain",
            ...data,
        },
    });
    let result = await res.text();
    return _.chain(result)
        .split("\n")
        .initial()
        .thru((val) => {
            if (convertToNumber) return _.map(val, val => +val)
            return val
        })
        .value();
}
