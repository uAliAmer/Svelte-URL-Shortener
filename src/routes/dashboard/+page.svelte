<script>
  import { invalidateAll } from '$app/navigation';
  export let data;

  let originalUrl = '';
  let customSlug = '';
  let expiresAt = '';
  let err = '';
  let creating = false;
  let copied = '';

  $: links = data.links;
  $: base = data.publicBase.replace(/\/$/, '');

  async function create() {
    err = '';
    creating = true;
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          originalUrl,
          customSlug: customSlug || undefined,
          expiresAt: expiresAt || undefined
        })
      });
      if (!res.ok) {
        err = (await res.text()) || 'Failed to create link';
        return;
      }
      originalUrl = '';
      customSlug = '';
      expiresAt = '';
      await invalidateAll();
    } finally {
      creating = false;
    }
  }

  async function del(id) {
    if (!confirm('Delete this link?')) return;
    const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
    if (res.ok) await invalidateAll();
  }

  async function toggle(link) {
    await fetch(`/api/links/${link.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isActive: !link.isActive })
    });
    await invalidateAll();
  }

  async function copy(code) {
    const url = `${base}/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      copied = code;
      setTimeout(() => (copied = ''), 1500);
    } catch {
      /* ignore */
    }
  }

  function fmtDate(d) {
    return new Date(d).toLocaleString();
  }
</script>

<div class="grid gap-8 lg:grid-cols-[1fr_2fr]">
  <section>
    <h2 class="mb-3 text-lg font-semibold text-slate-900">Create a short link</h2>
    <form class="card space-y-4" on:submit|preventDefault={create}>
      <div>
        <label class="label" for="url">Destination URL</label>
        <input id="url" class="input" type="url" placeholder="https://example.com/long/path" bind:value={originalUrl} required />
      </div>
      <div>
        <label class="label" for="slug">Custom slug <span class="text-slate-400">(optional)</span></label>
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-500">{base}/</span>
          <input id="slug" class="input" type="text" placeholder="my-link" bind:value={customSlug} pattern="[a-zA-Z0-9_-]{'{3,32}'}" />
        </div>
      </div>
      <div>
        <label class="label" for="exp">Expires <span class="text-slate-400">(optional)</span></label>
        <input id="exp" class="input" type="datetime-local" bind:value={expiresAt} />
      </div>
      {#if err}
        <p class="text-sm text-red-600">{err}</p>
      {/if}
      <button class="btn-primary w-full" disabled={creating}>
        {creating ? 'Creating…' : 'Create link'}
      </button>
    </form>
  </section>

  <section>
    <h2 class="mb-3 text-lg font-semibold text-slate-900">Your links</h2>
    {#if links.length === 0}
      <div class="card text-sm text-slate-500">No links yet. Create your first one.</div>
    {:else}
      <ul class="space-y-3">
        {#each links as link (link.id)}
          <li class="card">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <a href={`${base}/${link.code}`} target="_blank" rel="noopener" class="truncate font-mono text-brand-600 hover:underline">
                    {base}/{link.code}
                  </a>
                  <button class="text-xs text-slate-500 hover:text-slate-900" on:click={() => copy(link.code)}>
                    {copied === link.code ? '✓ copied' : 'copy'}
                  </button>
                  {#if !link.isActive}
                    <span class="rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-700">paused</span>
                  {/if}
                  {#if link.expiresAt && new Date(link.expiresAt) < new Date()}
                    <span class="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">expired</span>
                  {/if}
                </div>
                <div class="mt-1 truncate text-sm text-slate-500">→ {link.originalUrl}</div>
                <div class="mt-1 text-xs text-slate-400">
                  {link.clickCount} clicks · created {fmtDate(link.createdAt)}
                  {#if link.expiresAt} · expires {fmtDate(link.expiresAt)}{/if}
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <a href={`/links/${link.id}`} class="btn-ghost text-xs">Analytics</a>
                <button class="btn-ghost text-xs" on:click={() => toggle(link)}>
                  {link.isActive ? 'Pause' : 'Resume'}
                </button>
                <button class="btn-danger text-xs" on:click={() => del(link.id)}>Delete</button>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>
