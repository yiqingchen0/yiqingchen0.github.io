export function releaseAction({ current, latest, attempted, initial, interacted }) {
  if (current === latest) return 'none';
  if (initial && !interacted && attempted !== latest) return 'reload';
  return 'notify';
}

export function releaseUrl(href, version) {
  const url = new URL(href);
  url.searchParams.set('_lab_release', version);
  return url.href;
}

function watchRelease() {
  const current = document.querySelector('meta[name="statsense-release"]')?.content;
  if (!current || current === 'development') return;
  const url = new URL(location.href);
  const attempted = url.searchParams.get('_lab_release');
  if (attempted === current) {
    url.searchParams.delete('_lab_release');
    history.replaceState(history.state, '', url);
  }
  let interacted = false;
  let checking = false;
  for (const event of ['input', 'pointerdown', 'keydown']) {
    document.addEventListener(event, () => { interacted = true; }, { once: true, capture: true });
  }

  function notify(version) {
    if (document.getElementById('lab-release-update')) return;
    const notice = document.createElement('aside');
    notice.id = 'lab-release-update';
    notice.setAttribute('role', 'status');
    const message = document.createElement('span');
    message.textContent = 'A new version is available.';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Reload';
    button.addEventListener('click', () => location.replace(releaseUrl(location.href, version)));
    notice.append(message, button);
    document.body.append(notice);
  }

  async function check(initial = false) {
    if (checking || document.visibilityState === 'hidden') return;
    checking = true;
    try {
      const manifest = new URL('release.json', import.meta.url);
      manifest.searchParams.set('_fresh', String(Date.now()));
      const response = await fetch(manifest, { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) return;
      const { version } = await response.json();
      if (typeof version !== 'string' || !/^[a-f0-9]{16}$/.test(version)) return;
      const hasDraft = Array.from(document.querySelectorAll('textarea')).some((field) => field.value.length > 0);
      const action = releaseAction({ current, latest: version, attempted, initial, interacted: interacted || hasDraft });
      if (action === 'reload') location.replace(releaseUrl(location.href, version));
      else if (action === 'notify') notify(version);
    } catch {
      // Offline use must continue without an update check.
    } finally {
      checking = false;
    }
  }
  void check(true);
  window.addEventListener('focus', () => { void check(); });
  document.addEventListener('visibilitychange', () => { void check(); });
  window.setInterval(() => { void check(); }, 30_000);
}

if (typeof document !== 'undefined') watchRelease();
