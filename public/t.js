(function() {
  'use strict';

  var _apiBase = '';
  var _debug = false;

  function log() {
    if (_debug && window.console) {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[ClickGuard]');
      console.log.apply(console, args);
    }
  }

  function logError() {
    if (window.console) {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[ClickGuard Error]');
      console.error.apply(console, args);
    }
  }

  function getSid() {
    var sid = '';

    if (typeof document.currentScript !== 'undefined' && document.currentScript) {
      var el = document.currentScript;
      var src = el.src || '';

      sid = el.getAttribute('data-sid') || '';

      if (!sid && src) {
        try {
          var url = new URL(src);
          sid = url.searchParams.get('sid') || '';
          _apiBase = url.origin;
        } catch (e) {
          var match = src.match(/[?&]sid=([^&#]*)/);
          if (match) sid = match[1];
          var originMatch = src.match(/^(https?:\/\/[^\/]+)/);
          if (originMatch) _apiBase = originMatch[1];
        }
      }

      if (!_apiBase && src) {
        try {
          _apiBase = new URL(src).origin;
        } catch (e) {
          var om = src.match(/^(https?:\/\/[^\/]+)/);
          if (om) _apiBase = om[1];
        }
      }

      var apiAttr = el.getAttribute('data-api');
      if (apiAttr) _apiBase = apiAttr;

      if (sid) {
        log('Found SID via currentScript:', sid);
        return sid;
      }
    }

    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var s = scripts[i];

      var dataSid = s.getAttribute('data-sid');
      if (dataSid) {
        var sSrc = s.src || '';
        if (sSrc) {
          try {
            _apiBase = new URL(sSrc).origin;
          } catch (e) {
            var om2 = sSrc.match(/^(https?:\/\/[^\/]+)/);
            if (om2) _apiBase = om2[1];
          }
        }
        var apiAttr2 = s.getAttribute('data-api');
        if (apiAttr2) _apiBase = apiAttr2;
        log('Found SID via data-sid attribute:', dataSid);
        return dataSid;
      }

      var scriptSrc = s.src;
      if (scriptSrc && (scriptSrc.indexOf('/t.js') !== -1 || scriptSrc.indexOf('clickguard') !== -1)) {
        try {
          var u = new URL(scriptSrc);
          _apiBase = u.origin;
          sid = u.searchParams.get('sid') || '';
        } catch (e) {
          var m = scriptSrc.match(/[?&]sid=([^&#]*)/);
          if (m) sid = m[1];
          var om3 = scriptSrc.match(/^(https?:\/\/[^\/]+)/);
          if (om3) _apiBase = om3[1];
        }
        if (sid) {
          log('Found SID via script src scan:', sid);
          return sid;
        }
      }
    }

    if (window._clickguard_sid) {
      sid = window._clickguard_sid;
      if (window._clickguard_api) _apiBase = window._clickguard_api;
      log('Found SID via window._clickguard_sid:', sid);
      return sid;
    }

    logError('Could not find site ID. Make sure the script tag has data-sid attribute or sid query parameter.');
    return '';
  }

  function createFingerprint() {
    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';
      ctx.textBaseline = 'top';
      ctx.font = '14px "Arial"';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Browser Fingerprint', 2, 15);

      var fpString = navigator.userAgent +
        navigator.language +
        new Date().getTimezoneOffset() +
        canvas.toDataURL();

      var hash = 0;
      for (var i = 0; i < fpString.length; i++) {
        var char = fpString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    } catch (e) {
      return 'fp-error';
    }
  }

  function isHeadless() {
    if (navigator.webdriver) return true;
    if (!navigator.plugins || navigator.plugins.length === 0) return true;
    if (navigator.userAgent.indexOf('HeadlessChrome') !== -1) return true;
    return false;
  }

  function getTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      return 'Unknown';
    }
  }

  var checkDebug = (function() {
    try {
      if (typeof URLSearchParams !== 'undefined') {
        var params = new URLSearchParams(window.location.search);
        return params.get('clickguard_debug') === '1' || params.get('clickguard_debug') === 'true';
      }
    } catch (e) {}
    return false;
  })();
  _debug = checkDebug;

  var state = {
    sid: getSid(),
    ua: navigator.userAgent,
    sw: window.innerWidth || screen.width,
    sh: window.innerHeight || screen.height,
    lang: navigator.language || (navigator.userLanguage || ''),
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

  if (!state.sid) {
    logError('No site ID found - tracking disabled. Check your installation snippet.');
    return;
  }

  if (!_apiBase && window._clickguard_api) {
    _apiBase = window._clickguard_api;
    log('Using window._clickguard_api:', _apiBase);
  }

  if (!_apiBase) {
    var allScripts = document.getElementsByTagName('script');
    for (var j = allScripts.length - 1; j >= 0; j--) {
      var sSrc = allScripts[j].src || '';
      if (sSrc && (sSrc.indexOf('/t.js') !== -1 || sSrc.indexOf('clickguard') !== -1)) {
        try {
          _apiBase = new URL(sSrc).origin;
        } catch (e) {
          var om = sSrc.match(/^(https?:\/\/[^\/]+)/);
          if (om) _apiBase = om[1];
        }
        if (_apiBase) break;
      }
    }
  }

  if (!_apiBase) {
    logError('No API base URL found - tracking disabled. Set data-api attribute on the script tag or define window._clickguard_api.');
    return;
  }

  log('Initialized with SID:', state.sid, 'API:', _apiBase);

  var mouseMoveCount = 0;
  document.addEventListener('mousemove', function() {
    mouseMoveCount++;
    state.mm = mouseMoveCount;
  }, { passive: true });

  document.addEventListener('click', function() {
    state.cc++;
  }, { passive: true });

  function updateTimeOnPage() {
    state.top = Math.floor((Date.now() - state.startTime) / 1000);
  }

  function buildPayload() {
    return {
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
  }

  function sendTrackingData() {
    updateTimeOnPage();
    var trackUrl = _apiBase + '/api/clickguard/track';
    var body = JSON.stringify(buildPayload());

    log('Sending tracking data to:', trackUrl);

    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([body], { type: 'text/plain' });
        var sent = navigator.sendBeacon(trackUrl, blob);
        if (sent) {
          log('Beacon sent successfully');
          return;
        }
      } catch (e) {
        log('Beacon failed, falling back to fetch');
      }
    }

    if (typeof fetch !== 'undefined') {
      fetch(trackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: body,
        mode: 'cors',
        keepalive: true,
        credentials: 'omit'
      }).then(function(res) {
        log('Fetch response:', res.status);
        if (!res.ok) {
          return res.text().then(function(t) {
            logError('Server responded with', res.status, t);
          });
        }
      }).catch(function(err) {
        logError('Fetch failed:', err.message || err);
      });
    } else {
      var img = new Image();
      img.src = trackUrl + '?data=' + encodeURIComponent(body) + '&t=' + Date.now();
    }
  }

  function init() {
    setTimeout(sendTrackingData, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  setInterval(function() {
    sendTrackingData();
  }, 30000);

  window.addEventListener('beforeunload', function() {
    updateTimeOnPage();
    var body = JSON.stringify(buildPayload());
    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([body], { type: 'text/plain' });
        navigator.sendBeacon(_apiBase + '/api/clickguard/track', blob);
      } catch (e) {}
    }
  });

  window._clickguard_status = {
    active: true,
    sid: state.sid,
    api: _apiBase,
    version: '2.0'
  };

  log('Click Guard v2.0 loaded successfully');

})();
