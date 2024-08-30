function getBrowserFingerprint(apiKey) {
    const navigatorInfo = window.navigator;
    const screenInfo = window.screen;
    const timezone = new Date().getTimezoneOffset();
    const data = [
        navigatorInfo.userAgent,
        navigatorInfo.language,
        screenInfo.width,
        screenInfo.height,
        screenInfo.colorDepth,
        timezone,
        // More components can be added here
    ];

    // Use Canvas Fingerprinting
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '16px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('BrowserFingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('BrowserFingerprint', 4, 17);
    const canvasData = canvas.toDataURL();

    // Use WebGL Fingerprinting
    const webglCanvas = document.createElement('canvas');
    const webgl = webglCanvas.getContext('webgl');
    const debugInfo = webgl.getExtension('WEBGL_debug_renderer_info');
    const renderer = webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    const vendor = webgl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const webglData = `${renderer}~${vendor}`;

    // Combine data into a single string
    data.push(canvasData);
    data.push(webglData);

    // Hash the data
    const fingerprint = hashString(data.join(''));

    // Send the fingerprint to the backend
    sendFingerprintToBackend(apiKey, fingerprint);

    return fingerprint;
}

// function hashString(str) {
//     let hash = 0, i, chr;
//     for (i = 0; i < str.length; i++) {
//         chr = str.charCodeAt(i);
//         hash = ((hash << 5) - hash) + str.charCodeAt(i);
//         hash |= 0; // Convert to 32bit integer
//     }
//     return hash;
// }

function hashString(str) {
    // Generate SHA-256 hash of the input string
    const hash = crypto.createHash('sha256').update(str).digest('hex');

    // Convert the hash to a base62 alphanumeric string (0-9, a-z, A-Z)
    const base62 = hash.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 48 && code <= 57) { // '0'-'9'
            return char;
        } else if (code >= 97 && code <= 102) { // 'a'-'f' (for hex chars)
            return String.fromCharCode(97 + (code - 97) % 26); // Convert to 'a'-'z'
        } else {
            return String.fromCharCode(65 + (code - 65) % 26); // Convert to 'A'-'Z'
        }
    }).join('');

    return base62;
}

const successCallback = (position) => {
    console.log(position);
};
  
const errorCallback = (error) => {
    console.log(error);
};
  

function sendFingerprintToBackend(apiKey, fingerprint) {
    let location = navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
    const d = new Date();
let time = d.getTime();
const detectDeviceType = () =>
    /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
      ? 'Mobile'
      : 'Desktop';
  // 'Mobile' or 'Desktop'
    fetch('https://your-backend-endpoint.com/fingerprint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ fingerprint: fingerprint, apiKey:apiKey, time:d, device_type: detectDeviceType(), latlong:location })
    })
    .then(response => response.json())
    .then(data => console.log('Success:', data))
    .catch(error => console.error('Error:', error));
}
