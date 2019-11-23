/**
 * Convert a UTC timestamp to a JS Date object.
 * @param timestamp The timestamp to convert.
*/
export default function timestampToDate(timestamp: number) {
    return new Date(timestamp * 1000)
}
