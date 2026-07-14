/**
 * Trigger a browser download of a blob with the given filename.
 * @param {Blob} blob - The blob data to download.
 * @param {string} filename - The filename for the download.
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
