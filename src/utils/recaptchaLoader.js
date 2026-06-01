/**
 * recaptchaLoader.js - Utility for loading Google reCAPTCHA v3 dynamically
 * and programmatically executing verification tokens with fail-safes.
 */

let scriptLoadingPromise = null;

/**
 * isRecaptchaConfigured - Returns true only if a real (non-empty, non-test) site key is set.
 * Google's official test keys are intentionally rejected here so the app
 * does not show the "for testing purposes only" watermark in production.
 */
export const isRecaptchaConfigured = () => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const GOOGLE_TEST_KEYS = [
    '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Google's public test site key
    '',
    undefined,
    null,
  ];
  return siteKey && !GOOGLE_TEST_KEYS.includes(siteKey);
};

/**
 * loadRecaptchaScript - Injects Google's reCAPTCHA script and waits for ready.
 * Only loads if a real site key is configured.
 * 
 * @param {string} siteKey - Google reCAPTCHA v3 Site Key.
 * @returns {Promise<any>} The global grecaptcha object, or null if not configured.
 */
export const loadRecaptchaScript = (siteKey) => {
  if (!isRecaptchaConfigured()) {
    return Promise.resolve(null);
  }

  if (window.grecaptcha) {
    return Promise.resolve(window.grecaptcha);
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve) => {
    const scriptId = 'google-recaptcha-v3-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const handleLoad = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          resolve(window.grecaptcha);
        });
      } else {
        resolve(null);
      }
    };

    const handleError = () => {
      console.error('Google reCAPTCHA script failed to load. Activating fail-safe bypass.');
      resolve(null);
    };

    script.onload = handleLoad;
    script.onerror = handleError;

    // Set a timeout of 4 seconds as a fail-safe in case script injection hangs
    setTimeout(() => {
      if (!window.grecaptcha) {
        console.warn('reCAPTCHA script load timed out. Executing fail-safe.');
        resolve(null);
      }
    }, 4000);
  });

  return scriptLoadingPromise;
};

/**
 * executeRecaptcha - Loads script and executes reCAPTCHA v3 token generation.
 * Returns null silently (allowing the request to proceed) if:
 *   - No real site key is configured
 *   - Script fails to load
 *   - grecaptcha.execute() throws
 * 
 * @param {string} action - The action context name (e.g. 'login', 'signup').
 * @returns {Promise<string|null>} Token if successful, null if not configured or failed.
 */
export const executeRecaptcha = async (action) => {
  if (!isRecaptchaConfigured()) {
    return null;
  }

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  try {
    const grecaptcha = await loadRecaptchaScript(siteKey);

    if (!grecaptcha) {
      console.warn(`[reCAPTCHA] Script unavailable for action "${action}". Proceeding without token.`);
      return null;
    }

    // Generate a fresh token (tokens expire after 2 minutes)
    const token = await grecaptcha.execute(siteKey, { action });
    return token;
  } catch (err) {
    console.error(`[reCAPTCHA] Execution failed for action "${action}":`, err.message);
    return null;
  }
};
