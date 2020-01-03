import isUUID from "is-uuid"

/**
 * Check if a Random.org API key is valid.
 * @param key The key to validate.
 * @private
*/
export default function isValidKey(key: string): boolean {
    return isUUID.v4(key)
}

module.exports = isValidKey
