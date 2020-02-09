"use strict"

import englishChars from "english-chars"
import md5 from "md5"

import { base64StringToBlob as b64ToBlob } from "cross-blob-util"
import { reqAPI, reqPublic } from "./request"
import isUUID from "is-uuid"

type supportedBases = 2 | 8 | 10 | 16

interface DrawData {
    /**
     * The numeric ID for the drawing assigned by RANDOM.ORG. This value is null for drawings of type "test".
    */
	drawID: number

    /**
     * The textual description associated with the drawing (e.g., ‘Prize Draw for two U2 concert tickets’).
    */
	title: string

    /**
     * This value determines whether the record of the drawing held by RANDOM.ORG will be viewable by anyone (public), only to the owner of the drawing (private) or whether the record will allow identifer-based lookups (entrantAccessible). If the value for recordType is set to test, no record of the result is generated and no charge is made for the drawing. Drawings of type test are mainly useful for development purposes.
    */
	recordType?: "public" | "private" | "entrantAccessible" | "test"

    /**
     * This parameter allows the client to specify what type each entry is. Possible values are opaque and email. Future values will include twitterUser and facebookUser. If the value opaque is given, no special behaviour is performed by the drawing's record in regard to entry lookup or presentation. This is the correct value for ticket numbers, customer numbers, etc.
    */
	entryType?: "opaque" | "email"

    /**
     * A numeric value that indicates the ranking of the first winner picked as displayed in the record. Please see the description for the holdDraw method for further details.
    */
	winnerStart?: number

    /**
     * A value that indicates how the winners for the drawing were selected. Possible values are replace, remove and exclude. Please see the description for the holdDraw method for further details.
    */
	winnerHandling?: "remove" | "replace" | "exclude"

    /**
     * A boolean value that indicates whether the record of the drawing shows the entries (true) or not (false). The amount of information shown depends on the drawing's recordType. Please see the description for the holdDraw method for further details.
    */
	showEntries?: boolean

    /**
     * A boolean value that indicates whether the record of the drawing shows the number of winners (true) or not (false). The value is only meaningful for drawings with a recordType that is entrantAccessible. Please see the description for the holdDraw method for further details.
    */
	showWinners?: boolean

    /**
     * Possible values are completed, withheld and test. The value indicates the status of the drawing. If there was sufficient credit in the client's account, the status will be completed. It may be withheld if insufficient credit was available in the client's account in which the account must be topped up for the result to be revealed. For drawings of type test, this value is test.
    */
	status: "completed" | "withheld" | "test"

    /**
     * The numeric ID associated with the RANDOM.ORG account that held the drawing.
    */
	ownerID: number

    /**
     * The name associated with the RANDOM.ORG account that held the drawing (e.g., ‘Gorgeous Flowers LLC’).
    */
	ownerName: string

    /**
     * The time zone currently associated with the owner's account. This allows the client to display the completionTime in that time zone, if desired.
    */
	ownerTimeZone: string

    /**
     * The serial number of the drawing within the owner's account. The drawNumber for the first drawing held with a given account is 1, the drawNumber of the second is 2, and so on and so forth.
    */
	drawNumber: number

    /**
     * The number of entries counted by RANDOM.ORG.
    */
	entryCount: number

    /**
     * The list of entries. This will be null unless the client authenticates itself (using the credentials parameter) as the owner of the drawing or as a delegate acting on the owner's behalf; or unless the drawing is public and was held with a showEntries value of true. A maximum of maxEntries (from the request) entries are returned.
    */
	entries: string[] | null

    /**
     * The number of winning entries selected by RANDOM.ORG. This value will be null if showWinners was set to false when the drawing was held, except if the credentials supplied are those of the drawing's owner.
    */
	winnerCount: number | null

    /**
     * An array with the winning entries ordered by winning number (1st winner, 2nd winner, etc.). It is subject to the same access constraints as the entries array. The value of winners will be null if the drawing's status is withheld, meaning that the winners have been picked but that the drawing's owner must add credit to their account to reveal the result.
    */
	winners: string[] | null

    /**
     * An ISO 8601 time stamp indicating the time at which the drawing was completed.
    */
	completionTime: Date

    /**
     * The URL at which the official record of the drawing can be found. If the drawing's recordType is private, the client must be logged in to view the record. This value is null for drawings of type test.
    */
	recordURL: string | null
}

interface GiveawayData {
    /**
     * An alphanumeric verification code that identifies your giveaway. You can publish this to users, such that they can use it to verify the giveaway result. You can also compute the URL for your giveaway's verification page as follows: https://giveaways.random.org/verify/giveawayKey
    */
	giveawayKey: string

    /**
     * A numeric user ID that identifies the owner of the giveaway.
    */
	ownerID: number

    /**
     * The textual description of the giveaway. This will be identical to the value supplied in the description parameter.
    */
	description: string

    /**
     * The list of entries in this giveaway. This will be identical to the value supplied in the entries parameter.
    */
	entries: string[]

    /**
     * The total number of rounds in this giveaway. This will be identical to the value supplied in the rounds parameter.
    */
	rounds: number

    /**
     * The result of the rounds held so far, represented as an array of arrays with indices into the entries array. The first array contains the result of the first round, the second array of the second round, and so forth. If not all rounds have been run yet, the length of the roundsHeld array will be less than rounds.
    */
	roundsHeld: number

    /**
     * A UTC timestamp showing the exact time at which the giveaway was created.
    */
	created: Date

    /**
     * A UTC timestamp showing the exact time at which the giveaway was completed. If the giveaway has not yet been completed (i.e., its last round has not been run yet), then the value of completed will be null.
    */
	completed: Date

    /**
     * A timestamp UTC showing the exact time at which the giveaway will expire. This is normally one month after the created property.
    */
	expires: Date
}

interface GiveawayDataCurr extends GiveawayData {
    /**
    * A timestamp UTC showing the exact time at which the request was completed by the service. The client can use it to display a timestamp.
    */
	completionTime: Date
}

/**
 * Random.org API client library for JavaScript.
*/
export default class Rdo {

    /**
     * If authenticated via an API key.
    */
	private readonly isAuthed: boolean = false

    /**
     * If authenticated via credentials.
    */
	private readonly hasCreds: boolean = false

	constructor(private readonly conf: {
        /**
         * A Random.org [API key](https://api.random.org/api-keys).
        */
		apiKey?: string

        /**
         * Sign the reponses from the Random.org API when using an API key.
        */
		signed?: boolean

        /**
         * A Random.org [credentials object](https://api.random.org/json-rpc/2/authentication#credentials).
        */
		credentials?: {
            /**
             * The login (username) associated with the client's RANDOM.ORG account.
            */
			login: string

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
	} = {}) {
		if (this.conf) {
			if (this.conf.apiKey) {
				if (isUUID.v4(this.conf.apiKey)) this.isAuthed = true
				else throw new TypeError("API Key must be a valid v4 UUID.")
			}
			if (this.conf.credentials) {
				this.hasCreds = ((this.conf.credentials as any).login && (this.conf.credentials as any).password) || (this.conf.credentials as any).sessionId
			}
		}
	}

    /**
     * Throw an error if not authenticated via an API key.
    */
	private mustBeAuthed(): void {
		if (!this.isAuthed) throw new ReferenceError("An API key is required to use this function!")
	}

    /**
     * Throw an error if not authenticated via some credentials.
    */
	private mustHaveCreds(): void {
		if (!this.hasCreds) throw new ReferenceError("Credentials must be provided to use this function!")
	}

    /**
     * Generate true random integers within a user-defined range.
    */
	public async integer({
		min,
		max,
		amount = 1,
		unique = false,
		base = 10,
	}: {
        /**
         * The lower boundary for the range from which the random numbers will be picked. Must be within the [-1e9,1e9] range.
        */
		min: number

        /**
         * The upper boundary for the range from which the random numbers will be picked. Must be within the [-1e9,1e9] range.
        */
		max: number

        /**
         * How many random integers you need. Must be within the [1,1e4] range.
        */
		amount?: number

        /**
         * Specifies whether the random numbers should be picked with replacement. The default value will cause the numbers to be picked with replacement, i.e., the resulting numbers may contain duplicate values (like a series of dice rolls). If you want the numbers picked to be unique (like raffle tickets drawn from a container), set this value to true. This option is only supported when using an API key.
        */
		unique?: boolean

        /**
         * Specifies the base that will be used to display the numbers. This affects the JSON types and formatting of the resulting data.
        */
		base?: supportedBases
	}): Promise<number[]> {
		if (this.isAuthed) {
			return await reqAPI("generateIntegers", {
				data: {
					apiKey: this.conf.apiKey,
					n: amount,
					min,
					max,
					replacement: !unique,
					base,
				},
				signed: this.conf.signed
			})
		} else {
			return await reqPublic("integers", {
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
     * Generate true random [decimal fractions](http://en.wikipedia.org/wiki/Decimal#Decimal_fractions) from a uniform distribution across the [0,1] interval with a user-defined number of [decimal places](http://en.wikipedia.org/wiki/Arithmetic_precision).
    */
	public async decimal({
		amount = 1,
		places = 14,
		unique = false,
	}: {
        /**
         * How many random decimal fractions you need. Must be within the [1,10000] range.
        */
		amount?: number

        /**
         * The number of decimal places to use. Must be within the [1,14] range.
        */
		places?: number

        /**
         * Specifies whether the random numbers should be picked with replacement. The default (false) will cause the numbers to be picked with replacement, i.e., the resulting numbers may contain duplicate values (like a series of dice rolls). If you want the numbers picked to be unique (like raffle tickets drawn from a container), set this value to true.
        */
		unique?: boolean
	} = {}): Promise<number[]> {
		this.mustBeAuthed()

		return await reqAPI("generateDecimalFractions", {
			data: {
				apiKey: this.conf.apiKey,
				n: amount,
				decimalPlaces: places,
				replacement: !unique
			},
			signed: this.conf.signed
		})
	}

    /**
     * Generate uniform or multiform sequences of true random integers within user-defined ranges. Uniform sequences all have the same general form (length, range, replacement and base) whereas these characteristics can vary for multiform sequences.
    */
	public async sequence({
		min,
		max,
		amount = 1,
		length = 1,
		unique = false,
		base = 10,
	}: {
        /**
         * The lower boundaries of the sequences requested. For uniform sequences, min must be an integer in the [-1000000000,1000000000] range. For multiform sequences, min can be an array with n integers, each specifying the lower boundary of the sequence identified by its index. In this case, each value in min must be within the [-1000000000,1000000000] range.
        */
		min: number | number[]

        /**
         * The upper boundaries of the sequences requested. For uniform sequences, max must be an integer in the [-1000000000,1000000000] range. For multiform sequences, max can be an array with n integers, each specifying the upper boundary of the sequence identified by its index. In this case, each value in max must be within the [-1000000000,1000000000] range.
        */
		max: number | number[]

        /**
         * The number of sequences requested. Must be within the [1,1000] range.
        */
		amount?: number

        /**
         * This parameter specifies the lengths of the sequences requested. For uniform sequences, length must be an integer in the [1,10000] range. For multiform sequences, length can be an array with n integers, each specifying the length of the sequence identified by its index. In this case, each value in length must be within the [1,10000] range and the total sum of all the lengths must be in the [1,10000] range.
        */
		length?: number | number[]

        /**
         * Specifies whether the random numbers should be picked with replacement. The default value will cause the numbers to be picked with replacement, i.e., the resulting numbers may contain duplicate values (like a series of dice rolls). If you want the numbers picked to be unique (like raffle tickets drawn from a container), set this value to true.
        */
		unique?: boolean | boolean[]

        /**
         * Specifies the base that will be used to display the numbers. This affects the JSON types and formatting of the resulting data.
        */
		base?: supportedBases | supportedBases[]
	}): Promise<number[][]> {
		this.mustBeAuthed()

		return await reqAPI("generateIntegerSequences", {
			data: {
				apiKey: this.conf.apiKey,
				n: amount,
				length,
				min,
				max,
				replacement: !unique,
				base
			},
			signed: this.conf.signed
		})
	}

    /**
     * Generate true random numbers from a [Gaussian distribution](http://en.wikipedia.org/wiki/Normal_distribution) (also known as a normal distribution). The form uses a [Box-Muller Transform](http://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform) to generate the Gaussian distribution from uniformly distributed numbers.
    */
	public async gaussian({
		amount = 1,
		mean,
		standardDeviation,
		significantDigits,
	}: {
        /**
         * How many random numbers you need. Must be within the [1,10000] range.
        */
		amount?: number

        /**
         * The distribution's mean. Must be within the [-1000000,1000000] range.
        */
		mean: number

        /**
         * The distribution's standard deviation. Must be within the [-1000000,1000000] range.
        */
		standardDeviation: number

        /**
         * The number of significant digits to use. Must be within the [2,14] range.
        */
		significantDigits: number
	}) {
		this.mustBeAuthed()

		return await reqAPI("generateGaussians", {
			data: {
				apiKey: this.conf.apiKey,
				n: amount,
				mean,
				standardDeviation,
				significantDigits
			},
			signed: this.conf.signed
		})
	}

    /**
     * This method generates true random strings.
    */
	public async string({
		amount = 1,
		length = 1,
		characters = englishChars.all,
		unique = false,
	}: {
        /**
         * How many random strings you need. Must be within the [1,10000] range.
        */
		amount?: number

        /**
         * The length of each string. Must be within the [1,32] range. All strings will be of the same length
        */
		length?: number

        /**
         * A set of characters that are allowed to occur in the random strings. The maximum number of characters is 128.
        */
		characters?: string | string[]

        /**
         * Specifies whether the random strings should be picked with replacement. The default (false) will cause the strings to be picked with replacement, i.e., the resulting list of strings may contain duplicates (like a series of dice rolls). If you want the strings to be unique (like raffle tickets drawn from a container), set this value to true.
        */
		unique?: boolean
	} = {}): Promise<string[]> {
		if (Array.isArray(characters)) characters = characters.join("")
		if (this.isAuthed) {
			return await reqAPI("generateStrings", {
				data: {
					apiKey: this.conf.apiKey,
					n: amount,
					length,
					characters,
					replacement: !unique
				},
				signed: this.conf.signed
			})
		} else {
			return await reqPublic("strings", {
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

    /**
     * Generate version 4 true random [Universally Unique IDentifiers](http://en.wikipedia.org/wiki/Universally_unique_identifier) (UUIDs) in accordance with section 4.4 of [RFC 4122](http://www.ietf.org/rfc/rfc4122.txt).
    */
	public async uuid({
		amount = 1,
	}: {
        /**
         * How many random UUIDs you need. Must be within the [1,1000] range.
        */
		amount?: number
	} = {}): Promise<string[]> {
		this.mustBeAuthed()

		return await reqAPI("generateUUIDs", {
			data: {
				apiKey: this.conf.apiKey,
				n: amount
			},
			signed: this.conf.signed
		})
	}

    /**
     * Generates [Binary Large OBjects](http://en.wikipedia.org/wiki/Binary_large_object) (BLOBs) containing true random data.
    */
	public async blob({
		amount = 1,
		size = 8,
	}: {
        /**
         * How many random blobs you need. Must be within the [1,100] range.
        */
		amount?: number

        /**
         * The size of each blob, measured in bits. Must be within the [1,1048576] range and must be divisible by 8.
        */
		size?: number
	} = {}): Promise<Blob[]> {
		this.mustBeAuthed()

		const data = await reqAPI("generateBlobs", {
			data: {
				apiKey: this.conf.apiKey,
				n: amount,
				size,
				format: "base64"
			},
			signed: this.conf.signed
		})

		return data.map((val: string) => b64ToBlob(val))
	}

	public async quota(): Promise<number | {
        /**
         * If the API key is running. An API key must be running for it to be able to serve requests.
        */
		running: boolean

        /**
         * The timestamp in [ISO 8601](http://en.wikipedia.org/wiki/ISO_8601) format at which the API key was created.
        */
		creationTime: Date

        /**
         * The (estimated) number of remaining true random bits available to the client.
        */
		bitsLeft: number

        /**
         * The (estimated) number of remaining API requests available to the client.
        */
		requestsLeft: number

        /**
         * The number of bits used by this API key since it was created.
        */
		totalBits: number

        /**
         * The number of requests used by this API key since it was created.
        */
		totalRequests: number
	}> {
		if (this.isAuthed) {
			const { status, creationTime, bitsLeft, requestsLeft, totalBits, totalRequests } = await reqAPI("getUsage", {
				data: {
					apiKey: this.conf.apiKey
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
			const res = await reqPublic("quota", {
				convertToNumber: true
			})
			return res[0]
		}
	}

    /**
     * The Third-Party Draw Service allows clients to hold ‘drawings’ (US English) or ‘draws’ (UK, Irish and Australian English) in which a number of winners are selected from a pool of entries.
    */
	public readonly draw = {
        /**
         * Hold a drawing in one single operation. All information required for the drawing is passed as parameters. For this reason, the client must have collected all the entries from which the winner(s) will be selected before the method is invoked. Once the invocation is made, it is not possible to add entries or to delete or modify the drawing.
        */
		hold: async function hold({
			title,
			recordType = "public",
			entries,
			winnerCount = 1,
			entryType = "opaque",
			identicalEntriesPermitted = false,
			winnerStart = 1,
			winnerHandling = "remove",
			showEntries = true,
			showWinners = true,
			delegationKey = null,
		}: {
            /**
             * The textual description that will be associated with the drawing (e.g., ‘Prize Draw for two U2 concert tickets’). The length of the title must be in the [1,192] range.*/
			title: string

            /**
             * This value determines whether the record of the drawing held by RANDOM.ORG will be viewable by anyone (public), only to the owner of the drawing (private) or whether the record will allow identifer-based lookups (entrantAccessible). If the value for recordType is set to test, no record of the result is generated and no charge is made for the drawing. Drawings of type test are mainly useful for development purposes.
            */
			recordType?: "public" | "private" | "entrantAccessible" | "test"

            /**
             * An array containing the entries from which the winner(s) will be drawn. The number of entries must be in the [2,3000000] range.
            */
			entries: string[]

            /**
             * The number of winning entries requested. The value must be in the [1,50000] range.
            */
			winnerCount?: number

            /**
             * This parameter allows the client to specify what type each entry is. Possible values are opaque and email. Future values will include twitterUser and facebookUser. If the value opaque is given, no special behaviour is performed by the drawing's record in regard to entry lookup or presentation. This is the correct value for ticket numbers, customer numbers, etc.
            */
			entryType?: "opaque" | "email"

            /**
             * This parameter is used to specify whether the entries array is allowed to contain identical identifiers. If identicalEntriesPermitted is set to false, RANDOM.ORG will check the entries array for duplicates and return an error response in case duplicates are found.
            */
			identicalEntriesPermitted?: boolean

            /**
             * This parameter specifies the ranking that the first winner picked will receive in the record. Effectively, it allows the client to number the winners from a different starting point than the default 1st winner, 2nd winner, etc. This is useful if different ranges of winners for the same campaign are being selected using several drawings, or if an additional drawing is being held to replace an ineligible winner from a previous drawing.
            */
			winnerStart?: number

            /**
             * If the drawing has a winnerCount value that is greater than 1, then winnerHandling controls how those winners are selected. If winnerHandling is set to replace, an entry which has been selected as winner is inserted back (i.e., replaced) into the pool of elegible entries and can hence be selected as winner again. If winnerHandling is set to remove, the winning entry is removed from the pool of legible entries; however, if the entry appeared multiple times in the entries array (and identicalEntriesPermitted is set to true), those other entries still remain in the pool of elegible entries and can be selected as winner in subsequent selections. If winnerHandling is set to exclude, all occurrences of the winning entry are eliminated from the pool of elegible entries, essentially allowing each winner to win only once, regardless of the number of times the corresponding entry occurred in the entries array. If the drawing has a winnerCount value of 1, then winnerHandling has no effect.
            */
			winnerHandling?: "remove" | "replace" | "exclude"

            /**
             * This value specifies whether the record of the drawing should show the number of entries (true) or not (false). For drawings where the recordType is public, a showEntries value of true will create a record that shows the number of entries as well as the entire list of entries, whereas a value of false will create a record that shows neither of these fields. (In both cases, the record will show the number of winners as well as the actual winning identifiers.) For drawings where the recordType is entrantAccessible, a showEntries value of true will create a record that shows the number of entries and allows that entry list to be queried as is normal behaviour for entrantAccessible drawings, whereas a value of false will not show the number of entries but will still allow the entry list to be queried. The showEntries value has no effect for drawings where the recordType is private.
            */
			showEntries?: boolean

            /**
             * This value only has effect for drawings where the recordType is entrantAccessible. For those drawings, the parameter specifies whether the record of the drawing should show the number of winners (true) or not (false). The parameter also affects how the record of the drawing will behave. For a drawing where showWinners was set to true when the drawing was held, the record will show the winning rank for entries when queried (e.g., ‘The entry had 6 chances and was picked as 2nd winner’). For a drawing where showWinners was set to false, the record will show whether an entry was picked as winner but not show the rank (e.g., ‘The entry had 6 chances and was picked as a winner’).
            */
			showWinners?: boolean

            /**
             * A UUID that indicates that the caller is acting on behalf of another party. The delegationKey indicates who that other party is.
            */
			delegationKey?: string
		}): Promise<{
            /**
             * The numeric ID for the drawing assigned by RANDOM.ORG. This value is null for drawings of type "test".
            */
			drawID: number

            /**
             * Possible values are completed, withheld and test. The value indicates the status of the drawing. If there was sufficient credit in the client's account, the status will be completed. It may be withheld if insufficient credit was available in the client's account in which the account must be topped up for the result to be revealed. For drawings of type test, this value is test.
            */
			status: "completed" | "withheld" | "test"

            /**
             * The number of entries counted by RANDOM.ORG.
            */
			entryCount: number

            /**
             * A JSON array with the winning entries ordered by winner number. The client should consider the first element the first winner, the second element the second winner, and so on; subject to the value given for the winnerStart parameter in the request. The value for winners is null if the drawing's status is withheld, meaning that the winning entries have been picked but that the client must add credit to their account to reveal the result.
            */
			winners: string[] | null

            /**
             * An ISO 8601 time stamp indicating the time at which the drawing was completed.
            */
			completionTime: Date

            /**
             * The URL at which the official record of the drawing can be found. If the drawing's recordType is private, the client must be logged in to view the record. This value is null for drawings of type test.
            */
			recordURL: string | null
		}> {
			this.mustHaveCreds()

			const { drawId, status, entryCount, winners, completionTime, recordUrl } = await reqAPI("holdDraw", {
				data: {
					credentials: this.conf.credentials,
					title,
					recordType,
					entries,
					entriesDigest: md5(JSON.stringify(entries)),
					winnerCount,
					entryType,
					identicalEntriesPermitted,
					winnerStart,
					winnerHandling,
					showEntries,
					showWinners,
					delegationKey
				},
				getRandomData: false
			})

			if (entryCount !== entries.length) throw new ReferenceError("Processed entries do not equal provided entries!")

			return {
				drawID: drawId,
				status,
				entryCount,
				winners,
				completionTime: new Date(completionTime),
				recordURL: recordUrl
			}
		},

        /**
         * Obtain information about a completed drawing, subject to access control of the drawing's privacy settings.
        */
		get: async function get({
			drawID,
			maxEntries = 3000000,
			delegationKey = null,
		}: {
            /**
             * The numeric ID for the drawing assigned by RANDOM.ORG.
            */
			drawID: number

            /**
             * A cap on the number of entries that the client wishes to have included in the response. The response's entries array will contain no more than maxEntries values. Any entries returned will be the first in the entry list.
            */
			maxEntries?: number

            /**
             * A UUID that indicates that the caller is a delegate acting on behalf of another party. The delegationKey indicates who that other party is. If the caller includes a different value from null for the delegationKey in the request, it must also include its own credentials. (The delegator's credentials are not required.)
            */
			delegationKey?: string
		}): Promise<DrawData> {
			const {
				drawId, title, recordType, entryType, winnerStart, winnerHandling, showEntries, showWinners, status, ownerId, ownerName, ownerTimeZone, drawNumber, entryCount, entries, winnerCount, winners, completionTime, recordUrl
			} = await reqAPI("getDraw", {
				data: {
					drawId: drawID,
					maxEntries,
					credentials: this.hasCreds ? this.conf.credentials : null,
					delegationKey,
				},
				getRandomData: false
			})

			return {
				drawID: drawId,
				title,
				recordType,
				entryType,
				winnerStart,
				winnerHandling,
				showEntries,
				showWinners,
				status,
				ownerID: ownerId,
				ownerName,
				ownerTimeZone,
				drawNumber,
				entryCount,
				entries,
				winnerCount,
				winners,
				completionTime: new Date(completionTime),
				recordURL: recordUrl
			}
		},

        /**
         * This method lets a RANDOM.ORG account holder list all the drawings in their account. Your client must set the method property of its JSON-RPC request object to listDraws.
        */
		list: async function list({
			delegationKey = null,
		}: {
            /**
             * A UUID that indicates that the caller is acting on behalf of another party. The delegationKey indicates who that other party is.
            */
			delegationKey?: string
		} = {}): Promise<DrawData[]> {
			this.mustHaveCreds()

			const res = await reqAPI("listDraws", {
				data: {
					credentials: this.conf.credentials,
					delegationKey
				},
				getRandomData: false
			})

			return res.map(({
				drawId, title, recordType, entryType, winnerStart, winnerHandling, showEntries, showWinners, status, ownerId, ownerName, ownerTimeZone, drawNumber, entryCount, entries, winnerCount, winners, completionTime, recordUrl
			}) => ({
				drawID: drawId,
				title,
				recordType,
				entryType,
				winnerStart,
				winnerHandling,
				showEntries,
				showWinners,
				status,
				ownerID: ownerId,
				ownerName,
				ownerTimeZone,
				drawNumber,
				entryCount,
				entries,
				winnerCount,
				winners,
				completionTime: new Date(completionTime),
				recordURL: recordUrl
			}))

		},
	}

    /**
     * This API gives clients access to RANDOM.ORG's Multi-Round Giveaway Service. Ideally suited to video streaming in real-time, the service randomizes your list of up to 3,000 participants in up to 30 rounds. The client first creates the giveaway and then runs the rounds one at a time. In the final round, the service generates a verification code, valid for one month, which proves your giveaway wasn't rigged.
    */
	public readonly giveaway = {
        /**
         * This method creates a new giveaway but does not yet run the rounds.
        */
		begin: async function begin({
			description,
			entries,
			rounds,
			delegationKey = null,
		}: {
            /**
             * The textual title that will be associated with the giveaway (e.g., ‘1954 Bowman Gum baseball card of Vern Bickford’). The length of the description must be in the [1,192] range.
            */
			description: string

            /**
             * An array containing the entries to be randomized. The number of entries must be in the [2,3000] range.
            */
			entries: string[]

            /**
             * How many rounds there will be in this giveaway. The number of rounds must be in the [2,30] range. After it has been created, the giveaway will not be considered completed until the client has invoked the cont method for all the rounds.
            */
			rounds: number


            /**
             * A UUID that indicates that the caller is acting on behalf of another party. The delegationKey indicates who that other party is.
            */
			delegationKey?: string
		}): Promise<GiveawayDataCurr> {
			this.mustHaveCreds()

			const { giveawayKey, ownerId, roundsHeld, created, completed, expires, completionTime } = await reqAPI("beginGiveaway", {
				data: {
					credentials: this.conf.credentials,
					description,
					entries,
					entriesDigest: md5(JSON.stringify(entries)),
					rounds,
					delegationKey
				},
				getRandomData: false
			})

			return {
				giveawayKey,
				ownerID: ownerId,
				description,
				entries,
				rounds,
				roundsHeld,
				created: new Date(created),
				completed: new Date(completed),
				expires: new Date(expires),
				completionTime: new Date(completionTime)
			}
		},

        /**
         * This method runs a single round of a giveaway previously created with the begin method.
        */
		cont: async function cont({
			giveawayKey,
			delegationKey = null,
		}: {
            /**
             * An alphanumeric verification code that identifies your giveaway. Must have been returned as the result of a previous request to beginGiveaway.
            */
			giveawayKey: string

            /**
             * A UUID that indicates that the caller is acting on behalf of another party. The delegationKey indicates who that other party is.
            */
			delegationKey?: string
		}): Promise<GiveawayDataCurr> {
			this.mustHaveCreds()

			const { ownerId, description, entries, rounds, roundsHeld, created, completed, expires, completionTime } = await reqAPI("continueGiveaway", {
				data: {
					credentials: this.conf.credentials,
					giveawayKey,
					delegationKey
				},
				getRandomData: false
			})

			return {
				giveawayKey,
				ownerID: ownerId,
				description,
				entries,
				rounds,
				roundsHeld,
				created: new Date(created),
				completed: new Date(completed),
				expires: new Date(expires),
				completionTime: new Date(completionTime)
			}
		},

        /**
         * This method obtains the details of a giveaway. The giveaway must have been created with the being method and can be either in completed or not completed state. The records of giveaways are public, so no authentication is required to use this method.
        */
		get: async function get({
			giveawayKey,
		}: {
            /**
             * A key (i.e., verification code) that identifies the giveaway in question.
            */
			giveawayKey: string
		}): Promise<GiveawayData> {
			const { ownerId, description, entries, rounds, roundsHeld, created, completed, expires } = await reqAPI("getGiveaway", {
				data: {
					giveawayKey,
				},
				getRandomData: false
			})

			return {
				giveawayKey,
				ownerID: ownerId,
				description,
				entries,
				rounds,
				roundsHeld,
				created: new Date(created),
				completed: new Date(completed),
				expires: new Date(expires),
			}
		},

        /**
         * This method lists all non-expired giveaways for a given RANDOM.ORG account.
        */
		list: async function list({
			delegationKey = null,
		}: {
            /**
             * A UUID that indicates that the caller is acting on behalf of another party. The delegationKey indicates who that other party is.
            */
			delegationKey?: string
		} = {}): Promise<GiveawayData[]> {
			this.mustHaveCreds()

			const res = await reqAPI("getGiveaway", {
				data: {
					credentials: this.conf.credentials,
					delegationKey,
				},
				getRandomData: false
			})

			return res.map(({ giveawayKey, ownerId, description, entries, rounds, roundsHeld, created, completed, expires }) => ({
				giveawayKey,
				ownerID: ownerId,
				description,
				entries,
				rounds,
				roundsHeld,
				created: new Date(created),
				completed: new Date(completed),
				expires: new Date(expires),
			}))
		}
	}

    /**
     * The methods described here allows RANDOM.ORG account holders to delegate use of services to other RANDOM.ORG account holders.
     * A ‘delegation’ is a relationship between two RANDOM.ORG accounts in which one (the delegator) gives another (the delegate) access to use a particular service (e.g., the Third-Party Draw Service) on behalf of the delegator. The delegator can later remove the delegation if it wishes.
    */
	public readonly delegation = {
        /**
         * Create a delegation of a particular service between two RANDOM.ORG account holders.
        */
		async add({
			serviceID,
			delegateID,
			notifyDelegate = true,
		}: {
            /**
             * Numeric ID of the service to be delegated.
            */
			serviceID: number

            /**
             * Numeric ID of the delegate.
            */
			delegateID: number

            /**
             * This value specify whether the delegate should be notified about the creation of the delegation. If the value is set to true, RANDOM.ORG will attempt to issue a notification. No error message is reported to the delegator if the notification fails or if no method for notification is configured for the delegate in question.
            */
			notifyDelegate?: boolean
		}): Promise<{
            /**
             * UUID identifying this delegation.
            */
			delegationKey: string
		}> {
			this.mustHaveCreds()

			return await this.reqAPI("addDelegation", {
				data: {
					credentials: this.conf.credentials,
					serviceId: serviceID,
					delegateId: delegateID,
					notifyDelegate,
				},
				getRandomData: false
			})
		},

        /**
         * Allow a delegator to remove a delegation, effectively revoking rights previously granted with the add method.
        */
		async remove({
			delegationKey,
			notifyDelegate = true,
		}: {
            /**
             * UUID identifying this delegation.
            */
			delegationKey: string

            /**
             * This value specify whether the delegate should be notified about the creation of the delegation. If the value is set to true, RANDOM.ORG will attempt to issue a notification. No error message is reported to the delegator if the notification fails or if no method for notification is configured for the delegate in question.
            */
			notifyDelegate?: boolean
		}): Promise<boolean> {
			this.mustHaveCreds()

			const res = await this.reqAPI("removeDelegation", {
				data: {
					credentials: this.conf.credentials,
					delegationKey,
					notifyDelegate,
				},
				getRandomData: false
			})

			return res === {}
		},

        /**
         * List all delegations in which the user acts as delegator or delegate.
        */
		async list(): Promise<Array<{
            /**
             * The numeric identifier of the delegated service.
            */
			serviceID: number

            /**
             * The numeric identifier of the delegator.
            */
			delegatorID: number

            /**
             * The numeric identifier of the delegate.
            */
			delegateID: number

            /**
             * UUID identifying this delegation.
            */
			delegationKey: string
		}>> {
			this.mustHaveCreds()

			const { delegations } = await reqAPI("listDelegations", {
				data: {
					credentials: this.conf.credentials
				},
				getRandomData: false
			})

			return delegations.map(delegations, ({
				serviceId,
				delegatorId,
				delegateId,
				delegationKey
			}) => ({
				serviceID: serviceId,
				delegatorID: delegatorId,
				delegateID: delegateId,
				delegationKey
			}))
		},

        /**
         * Register a handler that will be used to deliver notifications about the creation and deletion of delegations in which the account holder is delegate.
        */
		handler: {
            /**
             * Register a handler that will be used to deliver notifications about the creation and deletion of delegations in which the account holder is delegate.
            */
			async set({
				handlerURL,
				handlerSecret,
			}: {
                /**
                 * A URL that will be be used to deliver notifications in the form of JSON-RPC 2.0 requests. The URL must use HTTPS. The program residing at the URL must be able to handle the notifications described below.
                */
				handlerURL: string

                /**
                 * A shared secret chosen by the caller. RANDOM.ORG will pass this secret back to the caller in all notifications. This allows the caller to verify the authenticity of the notifications.
                */
				handlerSecret: string
			}): Promise<boolean> {
				this.mustHaveCreds()

				const res = await reqAPI("setNotificationHandler", {
					data: {
						credentials: this.conf.credentials,
						handlerUrl: handlerURL,
						handlerSecret,
					},
					getRandomData: false
				})

				return res === {}
			},

            /**
             * Remove the handler that is being used to deliver notifications about the creation and deletion of delegations in which the account holder is delegate.
            */
			async remove() {
				this.mustHaveCreds()

				const res = await reqAPI("setNotificationHandler", {
					data: {
						credentials: this.conf.credentials,
						handlerUrl: null,
						handlerSecret: null,
					},
					getRandomData: false
				})

				return res === {}
			},

		}
	}
}

module.exports = Rdo
