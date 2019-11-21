"use strict"

import { reqAPI, reqBase } from "./request"
import isValidKey from "./lib/validate-api-key"
import { integer } from "./externals"

type supportedBases = 2 | 8 | 10 | 16

/**
 * Random.org API client library for JavaScript.
*/
export default class Rdo {

    private readonly isAuthed: boolean = false

    constructor(private readonly auth: {
        /**
         * A Random.org [API key](https://api.random.org/api-keys).
        */
        apiKey?: string,

        /**
         * A Random.org [credentials object](https://api.random.org/json-rpc/2/authentication#credentials).
        */
        credentials?: {
            /**
             * A string containing the login (username) associated with the client's RANDOM.ORG account.
            */
            login: string,

            /**
             * A string containing the password associated with the client's RANDOM.ORG account.
            */
            password: string
        } | {
            /**
             * The identifier of a session that has already been authenticated.
            */
            sessionId: string
        }
    }) {
        if (this.auth && this.auth.apiKey) {
            if (isValidKey(this.auth.apiKey)) this.isAuthed = true
            else throw new TypeError("API Key must be a valid v4 UUID.")
        }
    }

    /**
     * Generate true random integers within a user-defined range.
    */
    public async integer({
        min,
        max,
        amount = 1,
        unique = false,
        base = 10
    }: {
        /**
         * The lower boundary for the range from which the random numbers will be picked. Must be within the [-1e9,1e9] range.
        */
        min: integer,

        /**
         * The upper boundary for the range from which the random numbers will be picked. Must be within the [-1e9,1e9] range.
        */
        max: integer,

        /**
         * How many random integers you need. Must be within the [1,1e4] range.
        */
        amount?: integer,

        /**
         * Specifies whether the random numbers should be picked with replacement. The default value will cause the numbers to be picked with replacement, i.e., the resulting numbers may contain duplicate values (like a series of dice rolls). If you want the numbers picked to be unique (like raffle tickets drawn from a container), set this value to true.
        */
        unique?: boolean,

        /**
         * Specifies the base that will be used to display the numbers. This affects the JSON types and formatting of the resulting data.
        */
        base?: supportedBases
    }): Promise<number[]> {
        if (this.isAuthed) {
            return await reqAPI("generateIntegers", {
                data: {
                    apiKey: this.auth.apiKey,
                    n: amount,
                    min,
                    max,
                    replacement: !unique,
                    base,
                }
            })
        }
        else {
            if (unique) console.warn("Uniqueness not supported without API key.")
            return await reqBase("integers", {
                data: {
                    num: amount,
                    min,
                    max,
                    col: 1,
                    base,
                },
                convertToNumber: true
            })
        }
    }

    /**
     * This method generates uniform or multiform sequences of true random integers within user-defined ranges. Uniform sequences all have the same general form (length, range, replacement and base) whereas these characteristics can vary for multiform sequences.
    */
    public async sequence({
        min,
        max,
        amount = 1,
        length = 1,
        unique = false,
        base = 10
    }: {
        /**
         * This parameter specifies the lower boundaries of the sequences requested. For uniform sequences, min must be an integer in the [-1000000000,1000000000] range. For multiform sequences, min can be an array with n integers, each specifying the lower boundary of the sequence identified by its index. In this case, each value in min must be within the [-1000000000,1000000000] range.
        */
        min: integer | integer[],

        /**
         * This parameter specifies the upper boundaries of the sequences requested. For uniform sequences, max must be an integer in the [-1000000000,1000000000] range. For multiform sequences, max can be an array with n integers, each specifying the upper boundary of the sequence identified by its index. In this case, each value in max must be within the [-1000000000,1000000000] range.
        */
        max: integer | integer[],

        /**
         * An integer specifying the number of sequences requested. Must be within the [1,1000] range.
        */
        amount?: integer,

        /**
         * This parameter specifies the lengths of the sequences requested. For uniform sequences, length must be an integer in the [1,10000] range. For multiform sequences, length can be an array with n integers, each specifying the length of the sequence identified by its index. In this case, each value in length must be within the [1,10000] range and the total sum of all the lengths must be in the [1,10000] range.
        */
        length?: integer | integer[],

        /**
         * Specifies whether the random numbers should be picked with replacement. The default value will cause the numbers to be picked with replacement, i.e., the resulting numbers may contain duplicate values (like a series of dice rolls). If you want the numbers picked to be unique (like raffle tickets drawn from a container), set this value to true.
        */
        unique?: boolean | boolean[],

        /**
         * Specifies the base that will be used to display the numbers. This affects the JSON types and formatting of the resulting data.
        */
        base?: supportedBases | supportedBases[]
    }) {
        if (this.isAuthed) {
            return await reqAPI("generateIntegerSequences", {
                data: {
                    apiKey: this.auth.apiKey,
                    n: amount,
                    length,
                    min,
                    max,
                    replacement: !unique,
                    base
                }
            })
        } else {
            if (unique) console.warn("Uniqueness not supported without API key.")
            if (base) console.warn("Base not supported without API key.")
            return await reqBase("sequences", {
                data: {
                    min,
                    max,
                    col: amount
                }
            })
        }
    }

    public async quota() {
        if (this.isAuthed) {
            const { status, creationTime, bitsLeft, requestsLeft, totalBits, totalRequests } = await reqAPI("getUsage", {
                data: {
                    apiKey: this.auth.apiKey
                },
                getRandomData: false
            })
            return {
                running: status === "running",
                creationTime: new Date(creationTime),
                bitsLeft,
                requestsLeft,
                totalBits,
                totalRequests
            }
        } else {
            const res = await reqBase("quota", {
                convertToNumber: true
            })
            return res
        }
    }
}

module.exports = Rdo
