(function() {
  'use strict';

  var _apiBase = '';

  function getSid() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src;
      if (src && src.indexOf('t.js') !== -1) {
        var url = new URL(src);
        _apiBase = url.origin;
        return url.searchParams.get('sid') || '';
      }
    }
    return '';
  }

  // Create fingerprint hash from browser attributes
  function createFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Browser Fingerprint', 2, 15);
    
    const fpString = navigator.userAgent +
      navigator.language +
      new Date().getTimezoneOffset() +
      canvas.toDataURL();
    
    let hash = 0;
    for (let i = 0; i < fpString.length; i++) {
      const char = fpString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  // Detect headless browser
  function isHeadless() {
    // Check for webdriver property
    if (navigator.webdriver) return true;
    
    // Check for plugins (headless browsers typically have none)
    if (!navigator.plugins || navigator.plugins.length === 0) {
      return true;
    }
    
    // Check for chrome remote debugging protocol
    if (navigator.userAgent.includes('HeadlessChrome')) return true;
    
    return false;
  }

  // Get timezone
  function getTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      return 'Unknown';
    }
  }

  // Initialize tracking state
  const state = {
    sid: getSid(),
    ua: navigator.userAgent,
    sw: window.innerWidth || screen.width,
    sh: window.innerHeight || screen.height,
    lang: navigator.language || navigator.userLanguage,
    tz: getTimezone(),
    ref: document.referrer,
    url: window.location.href,
    fp: createFingerprint(),
    mm: 0,
    cc: 0,
    top: 0,
    hb: isHeadless(),
    startTime: Date.now()
  };

  // Track mouse movements
  let mouseMoveTimeout;
  document.addEventListener('mousemove', function() {
    state.mm++;
    clearTimeout(mouseMoveTimeout);
    mouseMoveTimeout = setTimeout(function() {
      // Reset counter after inactivity
    }, 1000);
  }, { passive: true });

  // Track clicks
  document.addEventListener('click', function() {
    state.cc++;
  }, { passive: true });

  // Update time on page
  function updateTimeOnPage() {
    state.top = Math.floor((Date.now() - state.startTime) / 1000);
  }

  // Send tracking data
  function sendTrackingData() {
    updateTimeOnPage();
    
    const payload = {
      sid: state.sid,
      ua: state.ua,
      sw: state.sw,
      sh: state.sh,
      lang: state.lang,
      tz: state.tz,
      ref: state.ref,
      url: state.url,
      fp: state.fp,
      mm: state.mm,
      cc: state.cc,
      top: state.top,
      hb: state.hb
    };

    var trackUrl = _apiBase + '/api/clickguard/track';

    if (navigator.sendBeacon) {
      var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(trackUrl, blob);
    } else if (typeof fetch !== 'undefined') {
      fetch(trackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function() {});
    } else {
      var img = new Image();
      img.src = trackUrl + '?data=' + encodeURIComponent(JSON.stringify(payload));
    }
  }

  // Send initial ping on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(sendTrackingData, 100);
    });
  } else {
    setTimeout(sendTrackingData, 100);
  }

  // Send periodic updates every 30 seconds
  setInterval(function() {
    sendTrackingData();
  }, 30000);

  // Send beacon on unload
  window.addEventListener('beforeunload', function() {
    updateTimeOnPage();
    const payload = {
      sid: state.sid,
      ua: state.ua,
      sw: state.sw,
      sh: state.sh,
      lang: state.lang,
      tz: state.tz,
      ref: state.ref,
      url: state.url,
      fp: state.fp,
      mm: state.mm,
      cc: state.cc,
      top: state.top,
      hb: state.hb
    };
    
    if (navigator.sendBeacon) {
      var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(_apiBase + '/api/clickguard/track', blob);
    }
  });

})();
