with open('apps/web/src/app.html', 'r') as f:
    content = f.read()

# I will simplify the app.html to just set `data-theme` and `theme-color`
# It's currently pretty good, but let's make it more straightforward.
# Actually, the prompt says: "app.html darf nur den allerersten Paint vorbereiten"
# "vermeide, dass dort zusätzlich eigene Theme-Logik gepflegt wird, die später in theme.ts nochmal separat existiert"
# "reduziere Logikduplikation zwischen app.html und theme.ts"

# Let's keep the logic inline but clean it up. We have to do the localStorage and matchMedia checks.
# Wait, can we read data-theme in theme.ts initially and avoid re-applying if it's correct?
# Yes! `initTheme` in `theme.ts` should just trust what `app.html` did if it can, or at least not double-apply.
# Let's refine app.html to only be the FOUC preventer and we fix theme.ts.

new_script = """      // Minimal FOUC prevention — resolved state becomes initial truth
      (function() {
        try {
          var t = localStorage.getItem('spannungsatlas-theme') || 'system';
          var d = t === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t;
          document.documentElement.setAttribute('data-theme', d);
          var m = document.querySelector('meta[name="theme-color"]');
          if (m) m.setAttribute('content', d === 'dark' ? '#1a1a2e' : '#2d5a9b');
        } catch(e) {}
      })();"""

import re
content = re.sub(
    r'      // Prevent flash of wrong theme — runs before any rendering\.\n      \(function\(\) \{.*?\n      \}\)\(\);',
    new_script,
    content,
    flags=re.DOTALL
)

with open('apps/web/src/app.html', 'w') as f:
    f.write(content)
