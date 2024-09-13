async function getBrowserFingerprint(visited_url = "", events = []) {
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
    const fingerprint = await hashString(data.join(''));

    // Send the fingerprint to the backend
    if(visited_url != ""){
        sendFingerprintToBackend(visited_url, fingerprint, ["page visit",visited_url]);
    }
    if(events.length !== 0){
        sendFingerprintToBackend(document.location.href, fingerprint, events)
    }

    return fingerprint;
}

// function hashString(str) {
//     let hash = 0x0, i, chr;
//     for (i = 0; i < str.length; i++) {
//         chr = str.charCodeAt(i);
//         hash = ((hash << 5) - hash) + str.charCodeAt(i);
//         hash |= 0; // Convert to 32bit integer
//     }
//     return hash.toString();
// }

async function hashString(str) {
    // Encode the input string as a Uint8Array
    const buffer = new TextEncoder().encode(str);

    // Generate SHA-256 hash
    return crypto.subtle.digest('SHA-256', buffer).then(hash => {
        // Convert the hash to a hexadecimal string
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Convert the hash to a base62 alphanumeric string (0-9, a-z, A-Z)
        const base62 = hashHex.split('').map(char => {
            const code = char.charCodeAt(0);
            if (code >= 48 && code <= 57) { // '0'-'9'
                return char;
            } else if (code >= 97 && code <= 102) { // 'a'-'f'
                return String.fromCharCode(97 + (code - 97) % 26); // Convert to 'a'-'z'
            } else {
                return String.fromCharCode(65 + (code - 65) % 26); // Convert to 'A'-'Z'
            }
        }).join('');

        return base62;
    });
}

let hardCoded = {
    company_url: 'facebook',
    fingerprint: 'jsdfhgjedkretetetete0497',
    device: 'Mac',
    device_type: 'laptop',
    ip_address: '162.87.225.123',
    browser: 'chrome',
    url: 'http://127.0.0.1:8000/fingerprint/', // url the user visited
    latlong: 'latlong', // jsonfield
    events: ['button clicked', 'clicked on something'], // jsonfield
    api_key:document.getElementById('analytics')?.dataset.apiKey || '',
  };

function apiCall(visited_url, fingerprint,events, location){
    const detectDeviceType = () => /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
    ? 'Mobile'
    : 'Desktop';

    fetch('https://alphagenstaging.onrender.com/fingerprint/track-visit/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${visited_url}`
        },
        body: JSON.stringify({...hardCoded, fingerprint: fingerprint, device:navigator.platform, url:visited_url, device_type: detectDeviceType(), latlong:{latitude:location.coords.latitude,longitude:location.coords.longitude}, events:events})
    })
    .then(response => response.json())
    .then(data => console.log('Success:', data))
    .catch(error => console.error('Error:', error));
}

async function sendFingerprintToBackend(visited_url, fingerprint, events) {
    navigator.geolocation.getCurrentPosition((e)=>{
        apiCall(visited_url, fingerprint,events, e)
    }, (e)=>{
        apiCall(visited_url, fingerprint,events, e);
    });
}

const observeUrlChange = () => {
    let oldHref = document.location.href;
    const body = document.querySelector("body");
    const observer = new MutationObserver(mutations => {
      if (oldHref !== document.location.href) {
        oldHref = document.location.href;
        /* Changed ! your code here */
        getBrowserFingerprint(oldHref);
      }
    });
    observer.observe(body, { childList: true, subtree: true });
  };
  
  window.onload = observeUrlChange;

  document.addEventListener('click',(e)=>{
   // console.log(e.target, e.type, e.target.textContent.trim());
    if(e.target.tagName.toLowerCase() === "button" || e.target.tagName.toLowerCase() === "a"){
        if (e.target.children.length === 1 && e.target.children[0].tagName.toLowerCase() === 'img') {
            getBrowserFingerprint("", [e.type, e.target.children[0].alt]);
        } else {
            getBrowserFingerprint("", [e.type, e.target.textContent.trim()]);
        }
    } else if(e.target.tagName.toLowerCase() === "input"){
        getBrowserFingerprint("", ["user_input", `Input field: ${e.target.type}`])
    } else if(e.target.tagName.toLowerCase() === "img"){
        getBrowserFingerprint("",[e.type, e.target.alt]);
    }
  })

getBrowserFingerprint(window.location.href);
