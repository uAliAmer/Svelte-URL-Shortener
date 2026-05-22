<script>
  import { invalidateAll } from '$app/navigation';
  export let data;

  let settings = { ...data.settings };
  let saveMsg = '';
  let saving = false;

  let newEmail = '';
  let newPassword = '';
  let newAdmin = false;
  let userErr = '';
  let creatingUser = false;
  let createdNotice = '';

  $: settings = { ...data.settings };

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

  let deletingUser = null; // { id, email, linkCount }
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

  async function errMsg(res) {
    try {
      const j = await res.json();
      return j.message || j.error || `Request failed (${res.status})`;
    } catch {
      return `Request failed (${res.status})`;
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
</script>

<svelte:head><title>Admin · {data.settings.brandTitle}</title></svelte:head>

<h1 class="mb-2 text-2xl font-bold text-slate-900">Admin</h1>
<p class="mb-6 text-sm text-slate-500">Customize this instance, manage users, view stats.</p>

<section class="card mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
  <div><div class="text-2xl font-semibold text-slate-900">{data.stats.users}</div><div class="text-xs text-slate-500">users</div></div>
  <div><div class="text-2xl font-semibold text-slate-900">{data.stats.links}</div><div class="text-xs text-slate-500">links</div></div>
  <div><div class="text-2xl font-semibold text-slate-900">{data.stats.clicks}</div><div class="text-xs text-slate-500">clicks</div></div>
  <div><div class="text-2xl font-semibold text-slate-900">{data.stats.apiKeys}</div><div class="text-xs text-slate-500">active API keys</div></div>
</section>

<section class="card mb-6">
  <h2 class="mb-4 text-lg font-semibold text-slate-900">Branding & access</h2>
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
      {#if saveMsg}<span class="text-sm text-slate-500">{saveMsg}</span>{/if}
    </div>
  </form>
</section>

<section class="card mb-6">
  <h2 class="mb-4 text-lg font-semibold text-slate-900">Add a user</h2>
  <form class="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]" on:submit|preventDefault={createUser}>
    <input class="input" type="email" placeholder="email" bind:value={newEmail} required />
    <input class="input" type="text" placeholder="temporary password" bind:value={newPassword} minlength="8" required />
    <label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={newAdmin} /> admin</label>
    <button class="btn-primary" disabled={creatingUser}>{creatingUser ? 'Creating…' : 'Create user'}</button>
  </form>
  {#if userErr}<p class="mt-2 text-sm text-red-600">{userErr}</p>{/if}
  {#if createdNotice}<p class="mt-2 text-sm text-green-700">{createdNotice}</p>{/if}
</section>

<section class="card">
  <h2 class="mb-4 text-lg font-semibold text-slate-900">Users</h2>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead class="text-xs uppercase text-slate-500">
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
          <tr class="border-t border-slate-100">
            <td class="py-2">
              {u.email}
              {#if u.mustChangeCredentials}<span class="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">setup pending</span>{/if}
            </td>
            <td class="py-2 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
            <td class="py-2">{u._count.links}</td>
            <td class="py-2">{u._count.apiKeys}</td>
            <td class="py-2"><input type="checkbox" checked={u.isAdmin} disabled={u.id === data.users[0]?.id && data.users.filter(x => x.isAdmin).length === 1 && u.isAdmin} on:change={(e) => patchUser(u.id, { isAdmin: e.currentTarget.checked })} /></td>
            <td class="py-2"><input type="checkbox" checked={u.canUseApi} on:change={(e) => patchUser(u.id, { canUseApi: e.currentTarget.checked })} /></td>
            <td class="py-2 text-right">
              {#if u.id !== data.user.id}
                <button class="btn-danger text-xs" on:click={() => askDelUser(u)}>Delete</button>
              {:else}
                <span class="text-xs text-slate-400">you</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
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
    <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
      <h3 class="mb-2 text-lg font-semibold text-slate-900">Delete user</h3>
      <p class="mb-4 text-sm text-slate-600">
        Are you sure you want to delete <span class="font-mono">{deletingUser.email}</span>?
        Their API keys will be revoked.
      </p>

      {#if deletingUser.linkCount > 0}
        <div class="mb-4 space-y-2 rounded border border-slate-200 bg-slate-50 p-3">
          <p class="text-sm font-medium text-slate-700">
            This user owns {deletingUser.linkCount} link{deletingUser.linkCount === 1 ? '' : 's'}.
          </p>
          <label class="flex items-start gap-2 text-sm text-slate-700">
            <input type="radio" bind:group={deleteLinks} value={false} class="mt-1" />
            <span><span class="font-semibold">Keep their links</span> and transfer them to your account (recommended)</span>
          </label>
          <label class="flex items-start gap-2 text-sm text-slate-700">
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
