import atob from "atob";
import Blob from "cross-blob";

/**
 * Convert a Base64-encoded blob object to a blob.
 * @param b64Data The Base64-encoded blob data.
 * @param contentType The content type of the blob.
 * @param sliceSize The slice size.
*/
export default function b64ToBlob(b64Data: string, contentType: string = '', sliceSize: number = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
};
