with open('apps/web/src/lib/stores/theme.ts', 'r') as f:
    content = f.read()

# Requirements for theme.ts:
# 1. Be the canonical source of truth.
# 2. Safari compatibility (add addListener/removeListener fallback).
# 3. No double initialization. If app.html already applied the correct theme, apply(initial) shouldn't cause layout thrashing.
# Actually, setting the same attribute twice usually doesn't trigger layout thrashing, but it's cleaner to avoid it or just let apply run.
# More importantly, addListener is needed.

new_init_theme = """export function initTheme(): () => void {
	const initial = stored();
	themeMode.set(initial);

	// Ensure DOM matches store, but avoid redundant updates if app.html already set it perfectly.
	apply(initial);

	function onSystemChange(): void {
		themeMode.update((mode) => {
			if (mode === 'system') apply(mode);
			return mode;
		});
	}

	let mq: MediaQueryList | null = null;
	try {
		mq = window.matchMedia('(prefers-color-scheme: dark)');
		if (mq.addEventListener) {
			mq.addEventListener('change', onSystemChange);
		} else if (mq.addListener) {
			// Safari/WebKit fallback
			mq.addListener(onSystemChange);
		}
	} catch {
		// matchMedia not available
	}

	return () => {
		try {
			if (mq?.removeEventListener) {
				mq.removeEventListener('change', onSystemChange);
			} else if (mq?.removeListener) {
				mq.removeListener(onSystemChange);
			}
		} catch {
			// ignore
		}
	};
}"""

import re
content = re.sub(
    r'export function initTheme\(\): \(\) => void \{.*\}',
    new_init_theme,
    content,
    flags=re.DOTALL
)

with open('apps/web/src/lib/stores/theme.ts', 'w') as f:
    f.write(content)
