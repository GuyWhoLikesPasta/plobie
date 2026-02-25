/**
 * Plobie Bridge — Standalone auth bridge for Unity WebGL builds
 * hosted outside of plobie.vercel.app (e.g. Firebase test builds).
 *
 * USAGE: Add this to your Unity index.html BEFORE the Unity loader:
 *
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
 *   <script>
 *     var PLOBIE_SUPABASE_URL = "https://puhblesoxhizcfuubphh.supabase.co";
 *     var PLOBIE_SUPABASE_ANON_KEY = "YOUR_ANON_KEY";
 *     var PLOBIE_API_URL = "https://plobie.vercel.app/api";
 *   </script>
 *   <script src="https://plobie.vercel.app/plobie-bridge.js"></script>
 *
 * The bridge will:
 * 1. Check localStorage for an existing Supabase session
 * 2. If none, show a minimal login overlay
 * 3. Set up window.plobie with the same interface UnityEmbed uses
 */
(function () {
  var API_URL = window.PLOBIE_API_URL || "https://plobie.vercel.app/api";

  function createBridge(session) {
    var currentToken = session.access_token;
    var userId = session.user.id;

    window.plobie = {
      ready: true,
      getAccessToken: function () { return currentToken; },
      refreshAccessToken: function () {
        return window._plobieSupabase.auth.getSession().then(function (res) {
          if (res.data.session) currentToken = res.data.session.access_token;
          return currentToken;
        });
      },
      isLoggedIn: function () { return !!currentToken; },
      getUserId: function () { return userId; },
      getApiUrl: function () { return API_URL; },
      log: function (msg) { console.log("[Plobie Bridge]", msg); },
      redirectToLogin: function () { showLoginOverlay(); },
      version: "2.0.0-standalone"
    };

    console.log("[Plobie Bridge] Ready — user:", session.user.email);
  }

  function showLoginOverlay() {
    if (document.getElementById("plobie-login-overlay")) return;

    var overlay = document.createElement("div");
    overlay.id = "plobie-login-overlay";
    overlay.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif";

    overlay.innerHTML =
      '<div style="background:#1c1917;border:1px solid #292524;border-radius:16px;padding:32px;max-width:360px;width:90%">' +
        '<h2 style="color:#fff;font-size:20px;margin:0 0 4px">Sign in to Plobie</h2>' +
        '<p style="color:#a8a29e;font-size:13px;margin:0 0 20px">Connect your account to play</p>' +
        '<input id="plobie-email" type="email" placeholder="Email" style="width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid #44403c;background:#292524;color:#fff;font-size:14px;margin-bottom:10px;outline:none"/>' +
        '<input id="plobie-pass" type="password" placeholder="Password" style="width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid #44403c;background:#292524;color:#fff;font-size:14px;margin-bottom:16px;outline:none"/>' +
        '<button id="plobie-login-btn" style="width:100%;padding:10px;border-radius:10px;border:none;background:#16a34a;color:#fff;font-size:14px;font-weight:600;cursor:pointer">Sign In</button>' +
        '<p id="plobie-login-error" style="color:#ef4444;font-size:12px;margin:10px 0 0;display:none"></p>' +
      '</div>';

    document.body.appendChild(overlay);

    document.getElementById("plobie-login-btn").addEventListener("click", function () {
      var email = document.getElementById("plobie-email").value;
      var pass = document.getElementById("plobie-pass").value;
      var errEl = document.getElementById("plobie-login-error");
      var btn = document.getElementById("plobie-login-btn");

      if (!email || !pass) { errEl.textContent = "Enter email and password"; errEl.style.display = "block"; return; }

      btn.textContent = "Signing in...";
      btn.disabled = true;

      window._plobieSupabase.auth.signInWithPassword({ email: email, password: pass })
        .then(function (res) {
          if (res.error) {
            errEl.textContent = res.error.message;
            errEl.style.display = "block";
            btn.textContent = "Sign In";
            btn.disabled = false;
            return;
          }
          createBridge(res.data.session);
          overlay.remove();
        })
        .catch(function (err) {
          errEl.textContent = err.message || "Login failed";
          errEl.style.display = "block";
          btn.textContent = "Sign In";
          btn.disabled = false;
        });
    });

    document.getElementById("plobie-pass").addEventListener("keydown", function (e) {
      if (e.key === "Enter") document.getElementById("plobie-login-btn").click();
    });
  }

  // --- Init ---
  if (!window.PLOBIE_SUPABASE_URL || !window.PLOBIE_SUPABASE_ANON_KEY) {
    console.error("[Plobie Bridge] Set PLOBIE_SUPABASE_URL and PLOBIE_SUPABASE_ANON_KEY before loading this script");
    return;
  }

  var sb = window.supabase.createClient(window.PLOBIE_SUPABASE_URL, window.PLOBIE_SUPABASE_ANON_KEY);
  window._plobieSupabase = sb;

  sb.auth.getSession().then(function (res) {
    if (res.data.session) {
      createBridge(res.data.session);
    } else {
      showLoginOverlay();
    }
  });
})();
