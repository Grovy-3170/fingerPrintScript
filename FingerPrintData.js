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

function hashString(str) {
    let hash = 0, i, chr;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function sendFingerprintToBackend(apiKey, fingerprint) {
    fetch('https://your-backend-endpoint.com/fingerprint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ fingerprint: fingerprint, apiKey:apiKey })
    })
    .then(response => response.json())
    .then(data => console.log('Success:', data))
    .catch(error => console.error('Error:', error));
}
