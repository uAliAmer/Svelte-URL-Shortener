<script>
  import { invalidateAll } from '$app/navigation';
  export let data;

  let name = '';
  let scope = 'full';
  let err = '';
  let creating = false;
  let justCreated = null; // { plaintext, name }
  let copied = false;

  $: keys = data.keys;
  $: apiEnabled = data.settings?.apiKeysEnabled !== false;
  $: canUseApi = data.user?.canUseApi !== false;

  async function create() {
    err = '';
    creating = true;
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, scope })
      });
      if (!res.ok) {
        try { const j = await res.json(); err = j.message || 'Failed'; } catch { err = 'Failed'; }
        return;
      }
      const body = await res.json();
      justCreated = { plaintext: body.plaintext, name: body.key.name };
      name = '';
      copied = false;
      await invalidateAll();
    } finally {
      creating = false;
    }
  }

  async function revoke(id) {
    if (!confirm('Revoke this key? Apps using it will stop working immediately.')) return;
    await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    await invalidateAll();
  }

  async function copy() {
    if (!justCreated) return;
    await navigator.clipboard.writeText(justCreated.plaintext);
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }

  function fmt(d) {
    return d ? new Date(d).toLocaleString() : '—';
  }
</script>

<svelte:head><title>API keys · {data.settings?.brandTitle || 'Snip'}</title></svelte:head>

<h1 class="mb-2 text-2xl font-bold text-slate-900">API keys</h1>
<p class="mb-6 text-sm text-slate-500">
  Send <code>Authorization: Bearer &lt;key&gt;</code> on any request to <code>/api/*</code>.
  See <a href="/docs/api" class="text-brand-600 hover:underline">API docs</a> for examples.
</p>

{#if !apiEnabled}
  <div class="card mb-6 border-amber-200 bg-amber-50 text-sm text-amber-900">
    API keys are disabled on this instance.
  </div>
{:else if !canUseApi}
  <div class="card mb-6 border-amber-200 bg-amber-50 text-sm text-amber-900">
    Your account is not permitted to create API keys. Contact an admin.
  </div>
{/if}

{#if justCreated}
  <div class="card mb-6 border-green-200 bg-green-50">
    <p class="mb-2 text-sm font-semibold text-green-900">Key created — copy it now, you won't see it again.</p>
    <div class="flex items-center gap-2">
      <code class="flex-1 break-all rounded bg-white px-3 py-2 font-mono text-sm">{justCreated.plaintext}</code>
      <button class="btn-primary text-sm" on:click={copy}>{copied ? 'Copied!' : 'Copy'}</button>
    </div>
    <button class="mt-2 text-xs text-slate-500 hover:text-slate-900" on:click={() => (justCreated = null)}>Dismiss</button>
  </div>
{/if}

{#if apiEnabled && canUseApi}
  <section class="card mb-6">
    <h2 class="mb-3 text-lg font-semibold text-slate-900">Create a key</h2>
    <form class="grid gap-3 sm:grid-cols-[2fr_1fr_auto]" on:submit|preventDefault={create}>
      <input class="input" type="text" placeholder="Key name (e.g. 'CLI', 'CI bot')" bind:value={name} required maxlength="64" />
      <select class="input" bind:value={scope}>
        <option value="full">Full access</option>
        <option value="read">Read-only</option>
      </select>
      <button class="btn-primary" disabled={creating}>{creating ? 'Creating…' : 'Create'}</button>
    </form>
    {#if err}<p class="mt-2 text-sm text-red-600">{err}</p>{/if}
  </section>
{/if}

<section>
  <h2 class="mb-3 text-lg font-semibold text-slate-900">Your keys</h2>
  {#if keys.length === 0}
    <div class="card text-sm text-slate-500">No API keys yet.</div>
  {:else}
    <ul class="space-y-2">
      {#each keys as k (k.id)}
        <li class="card">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-slate-900">{k.name}</span>
                <span class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{k.scope}</span>
                {#if k.revokedAt}<span class="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">revoked</span>{/if}
              </div>
              <div class="mt-1 font-mono text-xs text-slate-500">{k.prefix}…</div>
              <div class="mt-1 text-xs text-slate-400">
                Created {fmt(k.createdAt)} · last used {fmt(k.lastUsedAt)}
              </div>
            </div>
            {#if !k.revokedAt}
              <button class="btn-danger text-xs" on:click={() => revoke(k.id)}>Revoke</button>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>
