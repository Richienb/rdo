import atob from "atob"
import Blob from "cross-blob"
import forRange from "for-range"

/**
 * Convert a Base64-encoded blob object to a blob.
 * @param b64Data The Base64-encoded blob data.
 * @param contentType The content type of the blob.
 * @param sliceSize The slice size.
 * @private
*/
export default function b64ToBlob(b64Data: string, contentType: string = '', sliceSize: number = 512) {
    const byteCharacters = atob(b64Data)
    const byteArrays = []

    forRange({
        min: 0,
        max: byteCharacters.length - 1,
        step: sliceSize,
    }, (offset) => {
        const slice = byteCharacters.slice(offset, offset + sliceSize)

        const byteNumbers = new Array(slice.length)
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i)
        }

        const byteArray = new Uint8Array(byteNumbers)

        byteArrays.push(byteArray)
    })

    return new Blob(byteArrays, { type: contentType })
}
