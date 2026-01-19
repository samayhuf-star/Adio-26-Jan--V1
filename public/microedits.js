(function() {
  'use strict';

  const MICROEDITS_VERSION = '1.0.0';
  
  const script = document.currentScript;
  const siteId = script?.getAttribute('data-site-id');
  const token = script?.getAttribute('data-token');
  
  if (!siteId || !token) {
    console.warn('[MicroEdits] Missing site-id or token. Please check your installation.');
    return;
  }

  const appliedStyles = [];
  let styleElement = null;

  function initStyleElement() {
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'microedits-custom-styles';
      styleElement.setAttribute('data-microedits', 'true');
      document.head.appendChild(styleElement);
    }
    return styleElement;
  }

  function applyCSS(css) {
    const style = initStyleElement();
    appliedStyles.push(css);
    style.textContent = appliedStyles.join('\n');
    console.log('[MicroEdits] Applied CSS changes');
  }

  function removeCSS(index) {
    if (index >= 0 && index < appliedStyles.length) {
      appliedStyles.splice(index, 1);
      if (styleElement) {
        styleElement.textContent = appliedStyles.join('\n');
      }
      console.log('[MicroEdits] Removed CSS at index', index);
    }
  }

  function clearAllCSS() {
    appliedStyles.length = 0;
    if (styleElement) {
      styleElement.textContent = '';
    }
    console.log('[MicroEdits] Cleared all custom CSS');
  }

  function getAllAppliedCSS() {
    return appliedStyles.join('\n');
  }

  function discoverSections() {
    const sections = [];
    
    const sectionElements = document.querySelectorAll('section, [role="region"], header, footer, nav, main, aside, article');
    sectionElements.forEach((el, index) => {
      const id = el.id || el.getAttribute('data-section') || `section-${index}`;
      const tagName = el.tagName.toLowerCase();
      const classList = Array.from(el.classList).slice(0, 3).join(' ');
      
      sections.push({
        id,
        tagName,
        classList,
        selector: el.id ? `#${el.id}` : (classList ? `.${classList.split(' ')[0]}` : `${tagName}:nth-of-type(${index + 1})`)
      });
    });

    return sections;
  }

  function getPageInfo() {
    return {
      url: window.location.href,
      title: document.title,
      sections: discoverSections(),
      hasStylesheet: document.styleSheets.length > 0,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  window.addEventListener('message', function(event) {
    if (!event.data || typeof event.data !== 'object') return;
    
    const { type, css, index } = event.data;
    
    switch (type) {
      case 'MICROEDITS_APPLY_CSS':
        if (css) applyCSS(css);
        break;
        
      case 'MICROEDITS_REMOVE_CSS':
        if (typeof index === 'number') removeCSS(index);
        break;
        
      case 'MICROEDITS_CLEAR_CSS':
        clearAllCSS();
        break;
        
      case 'MICROEDITS_GET_PAGE_INFO':
        window.parent.postMessage({
          type: 'MICROEDITS_PAGE_INFO',
          data: getPageInfo()
        }, '*');
        break;
        
      case 'MICROEDITS_GET_APPLIED_CSS':
        window.parent.postMessage({
          type: 'MICROEDITS_APPLIED_CSS',
          data: getAllAppliedCSS()
        }, '*');
        break;
        
      case 'MICROEDITS_PING':
        window.parent.postMessage({
          type: 'MICROEDITS_PONG',
          version: MICROEDITS_VERSION,
          siteId,
          ready: true
        }, '*');
        break;
    }
  });

  function loadStoredStyles() {
    try {
      const stored = localStorage.getItem(`microedits_styles_${siteId}`);
      if (stored) {
        const styles = JSON.parse(stored);
        if (Array.isArray(styles)) {
          styles.forEach(css => applyCSS(css));
        }
      }
    } catch (e) {
      console.warn('[MicroEdits] Could not load stored styles:', e);
    }
  }

  function saveStylesToStorage() {
    try {
      localStorage.setItem(`microedits_styles_${siteId}`, JSON.stringify(appliedStyles));
    } catch (e) {
      console.warn('[MicroEdits] Could not save styles:', e);
    }
  }

  const originalApplyCSS = applyCSS;
  const applyAndSaveCSS = function(css) {
    originalApplyCSS(css);
    saveStylesToStorage();
  };

  window.MicroEdits = {
    version: MICROEDITS_VERSION,
    siteId,
    applyCSS: applyAndSaveCSS,
    removeCSS,
    clearAllCSS,
    getAllAppliedCSS,
    getPageInfo,
    discoverSections
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadStoredStyles);
  } else {
    loadStoredStyles();
  }

  console.log(`[MicroEdits v${MICROEDITS_VERSION}] Initialized for site: ${siteId}`);
})();
