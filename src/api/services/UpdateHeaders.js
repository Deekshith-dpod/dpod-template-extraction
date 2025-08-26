const UpdateHeaders = async (updatekey) => {
    if (updatekey === null || updatekey === undefined) {
        return {
            hashHex: null,
            etagRandomNumber: null
        };
    }
    const etagRandomNumber = parseInt(Math.floor(Math.random() * 9000000000) + 1000000000);
    const etag = updatekey + etagRandomNumber;
    const etagStr = etag.toString();
    const data = new TextEncoder().encode(etagStr);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return {
        hashHex, etagRandomNumber
    }
}

export default UpdateHeaders;



