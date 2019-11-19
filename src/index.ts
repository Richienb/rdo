"use strict"

const ky = require("ky-universal")
const kyAPI = ky.create({
    prefixUrl: 'https://api.random.org/json-rpc/2/invoke/'
})
const kyBase = ky.create({
    prefixUrl: 'https://www.random.org/'
})
const _ = require("lodash")
const toBluebird = require("to-bluebird")

/**
 * Random.org API client library for JavaScript.
*/
export default class Rdo {

    /**
     * The delay to the next request.
    */
    private delay: number = 0

    constructor(public auth: {
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
    }) { }

    public integer({ min, max, amount = 1, unique = false, base = 10 }: {
        /**
         * The lower boundary for the range from which the random numbers will be picked. Must be within the [-1e9,1e9] range.
        */
        min: number,

        /**
         * The upper boundary for the range from which the random numbers will be picked. Must be within the [-1e9,1e9] range.
        */
        max: number,

        /**
         * How many random integers you need. Must be within the [1,1e4] range.
        */
        amount?: number,

        /**
         * Specifies whether the random numbers should be picked with replacement. The default value will cause the numbers to be picked with replacement, i.e., the resulting numbers may contain duplicate values (like a series of dice rolls). If you want the numbers picked to be unique (like raffle tickets drawn from a container), set this value to true.
        */
        unique?: boolean,

        /**
         * Specifies the base that will be used to display the numbers. This affects the JSON types and formatting of the resulting data.
        */
        base?: 2 | 8 | 10 | 16
    }) {
        if (this.auth && this.auth.apiKey) {
            return toBluebird(kyAPI("generateIntegers", {
                json: {
                    apiKey: this.auth.apiKey,
                    n: amount,
                    min,
                    max,
                    replacement: !unique,
                    base,
                },
            }))
                .json()
                .then(({ random }) => random.data)
        }
        else {
            if (unique) console.warn("Uniqueness not supported without API key.")
            return toBluebird(kyBase("integers", {
                searchParams: {
                    num: amount,
                    min,
                    max,
                    col: amount,
                    base,
                    format: "plain",
                }
            }))
                .then((res: any) => res.text())
                .then((res: string) => res.split("\n"))
                .then((res: string[]) => res.map(val => +val))
                .then((res: number[]) => _.initial(res))
        }
    }
}

module.exports = Rdo
