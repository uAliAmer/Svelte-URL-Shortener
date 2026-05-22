<script>
  import { invalidateAll } from '$app/navigation';
  import QrStyleEditor from '$lib/QrStyleEditor.svelte';
  import { sanitizeQrStyle } from '$lib/qrStyle.js';
  export let data;

  $: isAdmin = !!data.user?.isAdmin;
  $: apiEnabled = data.settings?.apiKeysEnabled !== false;
  $: canUseApi = data.user?.canUseApi !== false;
  $: keys = data.keys || [];

  let settings = { ...data.settings };
  let qrStyle = sanitizeQrStyle(data.settings?.qrStyle);
  let qrSaving = false;
  let qrMsg = '';
  let saveMsg = '';
  let saving = false;

  let newEmail = '';
  let newPassword = '';
  let newAdmin = false;
  let userErr = '';
  let creatingUser = false;
  let createdNotice = '';

  $: settings = { ...data.settings };
  $: qrStyle = sanitizeQrStyle(data.settings?.qrStyle);

  async function saveQrStyle() {
    qrSaving = true;
    qrMsg = '';
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ qrStyle })
      });
      if (!res.ok) {
        qrMsg = await errMsg(res);
        return;
      }
      qrMsg = 'Saved';
      await invalidateAll();
      setTimeout(() => (qrMsg = ''), 1500);
    } finally {
      qrSaving = false;
    }
  }

  let keyName = '';
  let keyScope = 'full';
  let keyErr = '';
  let creatingKey = false;
  let justCreated = null;
  let copied = false;

  async function errMsg(res) {
    try {
      const j = await res.json();
      return j.message || j.error || `Request failed (${res.status})`;
    } catch {
      return `Request failed (${res.status})`;
    }
  }

  async function saveSettings() {
    saving = true;
    saveMsg = '';
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!res.ok) {
        saveMsg = await errMsg(res);
      } else {
        saveMsg = 'Saved';
        await invalidateAll();
        setTimeout(() => (saveMsg = ''), 2000);
      }
    } finally {
      saving = false;
    }
  }

  async function patchUser(id, body) {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    await invalidateAll();
  }

  let deletingUser = null;
  let deleteLinks = false;
  let deleting = false;

  function askDelUser(u) {
    deletingUser = { id: u.id, email: u.email, linkCount: u._count.links };
    deleteLinks = false;
  }

  function cancelDelUser() {
    deletingUser = null;
  }

  async function confirmDelUser() {
    if (!deletingUser) return;
    deleting = true;
    try {
      await fetch(`/api/admin/users/${deletingUser.id}?deleteLinks=${deleteLinks}`, {
        method: 'DELETE'
      });
      deletingUser = null;
      await invalidateAll();
    } finally {
      deleting = false;
    }
  }

  async function createUser() {
    userErr = '';
    creatingUser = true;
    createdNotice = '';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword, isAdmin: newAdmin })
      });
      if (!res.ok) {
        userErr = await errMsg(res);
        return;
      }
      createdNotice = `Created ${newEmail}. Share their temporary password securely.`;
      newEmail = '';
      newPassword = '';
      newAdmin = false;
      await invalidateAll();
    } finally {
      creatingUser = false;
    }
  }

  async function createKey() {
    keyErr = '';
    creatingKey = true;
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: keyName, scope: keyScope })
      });
      if (!res.ok) {
        keyErr = await errMsg(res);
        return;
      }
      const body = await res.json();
      justCreated = { plaintext: body.plaintext, name: body.key.name };
      keyName = '';
      copied = false;
      await invalidateAll();
    } finally {
      creatingKey = false;
    }
  }

  async function revokeKey(id) {
    if (!confirm('Revoke this key? Apps using it will stop working immediately.')) return;
    await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    await invalidateAll();
  }

  async function copyKey() {
    if (!justCreated) return;
    await navigator.clipboard.writeText(justCreated.plaintext);
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }

  function fmt(d) {
    return d ? new Date(d).toLocaleString() : '—';
  }
</script>

<svelte:head><title>Settings · {data.settings?.brandTitle || 'Snip'}</title></svelte:head>

<h1 class="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
<p class="mb-6 text-sm text-slate-500 dark:text-slate-400">
  {isAdmin ? 'Customize this instance, manage users, and your API keys.' : 'Manage your API keys.'}
</p>

{#if isAdmin && data.stats}
  <section class="card mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
    <div><div class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{data.stats.users}</div><div class="text-xs text-slate-500 dark:text-slate-400">users</div></div>
    <div><div class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{data.stats.links}</div><div class="text-xs text-slate-500 dark:text-slate-400">links</div></div>
    <div><div class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{data.stats.clicks}</div><div class="text-xs text-slate-500 dark:text-slate-400">clicks</div></div>
    <div><div class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{data.stats.apiKeys}</div><div class="text-xs text-slate-500 dark:text-slate-400">active API keys</div></div>
  </section>

  <section class="card mb-6">
    <h2 class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Branding & access</h2>
    <form class="grid gap-4 sm:grid-cols-2" on:submit|preventDefault={saveSettings}>
      <div>
        <label class="label" for="brand">Brand title</label>
        <input id="brand" class="input" type="text" bind:value={settings.brandTitle} maxlength="40" />
      </div>
      <div>
        <label class="label" for="tag">Tagline / footer text</label>
        <input id="tag" class="input" type="text" bind:value={settings.brandTagline} maxlength="100" />
      </div>
      <div>
        <label class="label" for="exp">Default link expiry (days, blank = none)</label>
        <input id="exp" class="input" type="number" min="0" bind:value={settings.defaultExpiryDays} />
      </div>
      <div class="flex flex-col gap-2 pt-6">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" bind:checked={settings.signupDisabled} />
          Disable public signup
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" bind:checked={settings.apiKeysEnabled} />
          Enable API keys
          <a href="/docs/api" target="_blank" rel="noopener" class="ml-1 text-xs text-brand-600 hover:underline">View API docs →</a>
        </label>
      </div>
      <div class="sm:col-span-2 flex items-center gap-3">
        <button class="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
        {#if saveMsg}<span class="text-sm text-slate-500 dark:text-slate-400">{saveMsg}</span>{/if}
      </div>
    </form>
  </section>

  <section class="card mb-6">
    <h2 class="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Default QR style</h2>
    <p class="mb-4 text-sm text-slate-500 dark:text-slate-400">Applied to every QR unless a link sets its own style.</p>
    <QrStyleEditor bind:style={qrStyle} previewData="https://example.com/preview" />
    <div class="mt-4 flex items-center gap-3">
      <button class="btn-primary" on:click={saveQrStyle} disabled={qrSaving}>{qrSaving ? 'Saving…' : 'Save QR style'}</button>
      {#if qrMsg}<span class="text-sm text-slate-500 dark:text-slate-400">{qrMsg}</span>{/if}
    </div>
  </section>

  <section class="card mb-6">
    <h2 class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Add a user</h2>
    <form class="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]" on:submit|preventDefault={createUser}>
      <input class="input" type="email" placeholder="email" bind:value={newEmail} required />
      <input class="input" type="text" placeholder="temporary password" bind:value={newPassword} minlength="8" required />
      <label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={newAdmin} /> admin</label>
      <button class="btn-primary" disabled={creatingUser}>{creatingUser ? 'Creating…' : 'Create user'}</button>
    </form>
    {#if userErr}<p class="mt-2 text-sm text-red-600">{userErr}</p>{/if}
    {#if createdNotice}<p class="mt-2 text-sm text-green-700">{createdNotice}</p>{/if}
  </section>

  <section class="card mb-6">
    <h2 class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Users</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="text-xs uppercase text-slate-500 dark:text-slate-400">
          <tr>
            <th class="py-2">Email</th>
            <th class="py-2">Created</th>
            <th class="py-2">Links</th>
            <th class="py-2">Keys</th>
            <th class="py-2">Admin</th>
            <th class="py-2">API</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {#each data.users as u (u.id)}
            <tr class="border-t border-slate-100 dark:border-slate-800">
              <td class="py-2">
                {u.email}
                {#if u.mustChangeCredentials}<span class="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">setup pending</span>{/if}
              </td>
              <td class="py-2 text-slate-500 dark:text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td class="py-2">{u._count.links}</td>
              <td class="py-2">{u._count.apiKeys}</td>
              <td class="py-2"><input type="checkbox" checked={u.isAdmin} disabled={u.id === data.users[0]?.id && data.users.filter(x => x.isAdmin).length === 1 && u.isAdmin} on:change={(e) => patchUser(u.id, { isAdmin: e.currentTarget.checked })} /></td>
              <td class="py-2"><input type="checkbox" checked={u.canUseApi} on:change={(e) => patchUser(u.id, { canUseApi: e.currentTarget.checked })} /></td>
              <td class="py-2 text-right">
                {#if u.id !== data.user.id}
                  <button class="btn-danger text-xs" on:click={() => askDelUser(u)}>Delete</button>
                {:else}
                  <span class="text-xs text-slate-400 dark:text-slate-500">you</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
{/if}

<section class="card mb-6">
  <h2 class="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">API keys</h2>
  <p class="mb-4 text-sm text-slate-500 dark:text-slate-400">
    Send <code>Authorization: Bearer &lt;key&gt;</code> on any request to <code>/api/*</code>.
    See <a href="/docs/api" class="text-brand-600 hover:underline">API docs</a> for examples.
  </p>

  {#if !apiEnabled}
    <div class="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      API keys are disabled on this instance.
    </div>
  {:else if !canUseApi}
    <div class="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      Your account is not permitted to create API keys. Contact an admin.
    </div>
  {/if}

  {#if justCreated}
    <div class="mb-4 rounded border border-green-200 bg-green-50 p-3">
      <p class="mb-2 text-sm font-semibold text-green-900">Key created — copy it now, you won't see it again.</p>
      <div class="flex items-center gap-2">
        <code class="flex-1 break-all rounded bg-white px-3 py-2 font-mono text-sm">{justCreated.plaintext}</code>
        <button class="btn-primary text-sm" on:click={copyKey}>{copied ? 'Copied!' : 'Copy'}</button>
      </div>
      <button class="mt-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100" on:click={() => (justCreated = null)}>Dismiss</button>
    </div>
  {/if}

  {#if apiEnabled && canUseApi}
    <form class="mb-4 grid gap-3 sm:grid-cols-[2fr_1fr_auto]" on:submit|preventDefault={createKey}>
      <input class="input" type="text" placeholder="Key name (e.g. 'CLI', 'CI bot')" bind:value={keyName} required maxlength="64" />
      <select class="input" bind:value={keyScope}>
        <option value="full">Full access</option>
        <option value="read">Read-only</option>
      </select>
      <button class="btn-primary" disabled={creatingKey}>{creatingKey ? 'Creating…' : 'Create key'}</button>
    </form>
    {#if keyErr}<p class="mb-2 text-sm text-red-600">{keyErr}</p>{/if}
  {/if}

  {#if keys.length === 0}
    <div class="text-sm text-slate-500 dark:text-slate-400">No API keys yet.</div>
  {:else}
    <ul class="space-y-2">
      {#each keys as k (k.id)}
        <li class="rounded border border-slate-200 dark:border-slate-700 p-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-slate-900 dark:text-slate-100">{k.name}</span>
                <span class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:text-slate-300">{k.scope}</span>
                {#if k.revokedAt}<span class="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">revoked</span>{/if}
              </div>
              <div class="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{k.prefix}…</div>
              <div class="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Created {fmt(k.createdAt)} · last used {fmt(k.lastUsedAt)}
              </div>
            </div>
            {#if !k.revokedAt}
              <button class="btn-danger text-xs" on:click={() => revokeKey(k.id)}>Revoke</button>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

{#if deletingUser}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    on:click|self={cancelDelUser}
    on:keydown={(e) => e.key === 'Escape' && cancelDelUser()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900">
      <h3 class="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Delete user</h3>
      <p class="mb-4 text-sm text-slate-600 dark:text-slate-300">
        Are you sure you want to delete <span class="font-mono">{deletingUser.email}</span>?
        Their API keys will be revoked.
      </p>

      {#if deletingUser.linkCount > 0}
        <div class="mb-4 space-y-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 p-3">
          <p class="text-sm font-medium text-slate-700 dark:text-slate-300">
            This user owns {deletingUser.linkCount} link{deletingUser.linkCount === 1 ? '' : 's'}.
          </p>
          <label class="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="radio" bind:group={deleteLinks} value={false} class="mt-1" />
            <span><span class="font-semibold">Keep their links</span> and transfer them to your account (recommended)</span>
          </label>
          <label class="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="radio" bind:group={deleteLinks} value={true} class="mt-1" />
            <span><span class="font-semibold">Also delete their links</span> and all click history</span>
          </label>
        </div>
      {/if}

      <div class="flex justify-end gap-2">
        <button class="btn-ghost" on:click={cancelDelUser} disabled={deleting}>Cancel</button>
        <button class="btn-danger" on:click={confirmDelUser} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete user'}
        </button>
      </div>
    </div>
  </div>
{/if}
