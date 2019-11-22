"use strict"

import englishChars from "english-chars"
import _ from "lodash"

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
             * The login (username) associated with the client's RANDOM.ORG account.
            */
            login: string,

            /**
             * The password associated with the client's RANDOM.ORG account.
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

    private mustBeAuthed(): void {
        if (!this.isAuthed) throw new ReferenceError("API key required to use this function!")
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
        } else {
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
         * The lower boundaries of the sequences requested. For uniform sequences, min must be an integer in the [-1000000000,1000000000] range. For multiform sequences, min can be an array with n integers, each specifying the lower boundary of the sequence identified by its index. In this case, each value in min must be within the [-1000000000,1000000000] range.
        */
        min: integer | integer[],

        /**
         * The upper boundaries of the sequences requested. For uniform sequences, max must be an integer in the [-1000000000,1000000000] range. For multiform sequences, max can be an array with n integers, each specifying the upper boundary of the sequence identified by its index. In this case, each value in max must be within the [-1000000000,1000000000] range.
        */
        max: integer | integer[],

        /**
         * The number of sequences requested. Must be within the [1,1000] range.
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
        this.mustBeAuthed()

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
    }

    public async string({
        amount = 1,
        length = 1,
        characters = englishChars.all,
        unique = false
    }: {
        /**
         * How many random strings you need. Must be within the [1,10000] range.
        */
        amount?: integer,

        /**
         * The length of each string. Must be within the [1,32] range. All strings will be of the same length
        */
        length?: integer,

        /**
         * A set of characters that are allowed to occur in the random strings. The maximum number of characters is 128.
        */
        characters?: string | string[]

        /**
         * Specifies whether the random strings should be picked with replacement. The default (false) will cause the strings to be picked with replacement, i.e., the resulting list of strings may contain duplicates (like a series of dice rolls). If you want the strings to be unique (like raffle tickets drawn from a container), set this value to true.
        */
        unique?: boolean,
    } = {}) {
        if (_.isArray(characters)) characters = characters.join("")
        if (this.isAuthed) {
            return await reqAPI("generateStrings", {
                data: {
                    apiKey: this.auth.apiKey,
                    n: amount,
                    length,
                    characters,
                    replacement: !unique
                }
            })
        } else {
            return await reqBase("strings", {
                data: {
                    num: amount,
                    len: length,
                    digits: characters.includes(englishChars.digits) ? "on" : "off",
                    upperalpha: characters.includes(englishChars.uppercase) ? "on" : "off",
                    loweralpha: characters.includes(englishChars.lowercase) ? "on" : "off",
                    unique: unique ? "on" : "off",
                }
            })
        }
    }

    public async quota(): Promise<integer | {
        /**
         * If the API key is running. An API key must be running for it to be able to serve requests.
        */
        running: boolean,

        /**
         * The timestamp in [ISO 8601](http://en.wikipedia.org/wiki/ISO_8601) format at which the API key was created.
        */
        creationTime: Date,

        /**
         * The (estimated) number of remaining true random bits available to the client.
        */
        bitsLeft: integer,

        /**
         * The (estimated) number of remaining API requests available to the client.
        */
        requestsLeft: integer,

        /**
         * The number of bits used by this API key since it was created.
        */
        totalBits: integer,

        /**
         * The number of requests used by this API key since it was created.
        */
        totalRequests: integer
    }> {
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
            return res[0]
        }
    }
}

module.exports = Rdo
