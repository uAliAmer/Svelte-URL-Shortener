<script>
  import { invalidateAll, goto } from '$app/navigation';
  import { page } from '$app/stores';
  import QrPreview from '$lib/QrPreview.svelte';
  export let data;

  let qrRefs = {};
  async function downloadQr(id, code) {
    const ref = qrRefs[id];
    if (ref && ref.download) await ref.download(`qr-${code}.png`);
  }

  let originalUrl = '';
  let customSlug = '';
  let expiresAt = '';
  let activatesAt = '';
  let maxClicks = '';
  let tag = '';
  let err = '';
  let creating = false;
  let copied = '';

  let editing = null;
  let editForm = { originalUrl: '', expiresAt: '', activatesAt: '', maxClicks: '', tag: '' };
  let editErr = '';
  let saving = false;

  $: links = data.links;
  $: tags = data.tags;
  $: activeTag = data.activeTag;
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
          expiresAt: expiresAt || undefined,
          activatesAt: activatesAt || undefined,
          maxClicks: maxClicks || undefined,
          tag: tag || undefined
        })
      });
      if (!res.ok) {
        try { const j = await res.json(); err = j.message || 'Failed to create link'; } catch { err = 'Failed to create link'; }
        return;
      }
      originalUrl = '';
      customSlug = '';
      expiresAt = '';
      activatesAt = '';
      maxClicks = '';
      tag = '';
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

  function openEdit(link) {
    editing = link;
    editErr = '';
    editForm = {
      originalUrl: link.originalUrl,
      expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : '',
      activatesAt: link.activatesAt ? new Date(link.activatesAt).toISOString().slice(0, 16) : '',
      maxClicks: link.maxClicks ?? '',
      tag: link.tag || ''
    };
  }

  function closeEdit() {
    editing = null;
  }

  async function saveEdit() {
    if (!editing) return;
    editErr = '';
    saving = true;
    try {
      const res = await fetch(`/api/links/${editing.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          originalUrl: editForm.originalUrl,
          expiresAt: editForm.expiresAt || null,
          activatesAt: editForm.activatesAt || null,
          maxClicks: editForm.maxClicks === '' ? null : editForm.maxClicks,
          tag: editForm.tag
        })
      });
      if (!res.ok) {
        try { const j = await res.json(); editErr = j.message || 'Failed to save'; } catch { editErr = 'Failed to save'; }
        return;
      }
      editing = null;
      await invalidateAll();
    } finally {
      saving = false;
    }
  }

  function setTagFilter(t) {
    const params = new URLSearchParams($page.url.searchParams);
    if (t) params.set('tag', t);
    else params.delete('tag');
    const qs = params.toString();
    goto(`/dashboard${qs ? '?' + qs : ''}`, { invalidateAll: true });
  }

  function fmtDate(d) {
    return new Date(d).toLocaleString();
  }
</script>

<svelte:head><title>Dashboard · Snip</title></svelte:head>

<div class="grid gap-8 lg:grid-cols-[1fr_2fr]">
  <section>
    <h2 class="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Create a short link</h2>
    <form class="card space-y-4" on:submit|preventDefault={create}>
      <div>
        <label class="label" for="url">Destination URL</label>
        <input id="url" class="input" type="url" placeholder="https://example.com/long/path" bind:value={originalUrl} required />
      </div>
      <div>
        <label class="label" for="slug">Custom slug <span class="text-slate-400">(optional)</span></label>
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-500 dark:text-slate-400">{base}/</span>
          <input id="slug" class="input" type="text" placeholder="my-link" bind:value={customSlug} pattern="[a-zA-Z0-9_-]{'{3,32}'}" />
        </div>
      </div>
      <div>
        <label class="label" for="tag">Tag <span class="text-slate-400">(optional)</span></label>
        <input id="tag" class="input" type="text" placeholder="campaign, personal, …" bind:value={tag} maxlength="32" list="taglist" />
        <datalist id="taglist">
          {#each tags as t}<option value={t}></option>{/each}
        </datalist>
      </div>
      <div>
        <label class="label" for="exp">Expires <span class="text-slate-400">(optional)</span></label>
        <input id="exp" class="input" type="datetime-local" bind:value={expiresAt} />
      </div>
      <div>
        <label class="label" for="act">Activates at <span class="text-slate-400">(optional — link is inactive before this)</span></label>
        <input id="act" class="input" type="datetime-local" bind:value={activatesAt} />
      </div>
      <div>
        <label class="label" for="maxc">Max clicks <span class="text-slate-400">(optional — auto-expires after N clicks)</span></label>
        <input id="maxc" class="input" type="number" min="1" placeholder="e.g. 100" bind:value={maxClicks} />
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
    <h2 class="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Your links</h2>

    {#if tags.length > 0}
      <div class="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <button
          class="rounded-full px-3 py-1 {activeTag === '' ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-300'}"
          on:click={() => setTagFilter('')}
        >
          All
        </button>
        {#each tags as t}
          <button
            class="rounded-full px-3 py-1 {activeTag === t ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-300'}"
            on:click={() => setTagFilter(t)}
          >
            #{t}
          </button>
        {/each}
      </div>
    {/if}

    {#if links.length === 0}
      <div class="card flex flex-col items-center gap-2 py-12 text-center">
        <div class="text-4xl">🔗</div>
        <p class="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {activeTag ? `No links tagged #${activeTag}` : 'No links yet'}
        </p>
        <p class="max-w-sm text-sm text-slate-500 dark:text-slate-400">
          {activeTag
            ? 'Try a different tag, or clear the filter.'
            : 'Create your first short link with the form on the left. Paste any long URL to get started.'}
        </p>
        {#if activeTag}
          <button class="btn-ghost mt-2 text-sm" on:click={() => setTagFilter('')}>Clear filter</button>
        {/if}
      </div>
    {:else}
      <ul class="space-y-3">
        {#each links as link (link.id)}
          <li class="card">
            <div class="flex gap-4">
              <button
                type="button"
                title="Download QR code"
                class="group relative shrink-0 self-start rounded border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-100"
                on:click={() => downloadQr(link.id, link.code)}
              >
                <QrPreview bind:this={qrRefs[link.id]} data={`${base}/${link.code}`} style={link.qrStyle} size={104} fallback={link.qrDataUrl} />
                <span class="pointer-events-none absolute inset-0 flex items-center justify-center rounded bg-slate-900/70 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                  Download
                </span>
              </button>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <a href={`${base}/${link.code}`} target="_blank" rel="noopener" class="break-all font-mono text-brand-600 hover:underline">
                    {base}/{link.code}
                  </a>
                  <button class="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100" on:click={() => copy(link.code)}>
                    {copied === link.code ? 'copied' : 'copy'}
                  </button>
                  {#if link.tag}
                    <button
                      class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
                      on:click={() => setTagFilter(link.tag)}
                    >
                      #{link.tag}
                    </button>
                  {/if}
                  {#if !link.isActive}
                    <span class="rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-700">paused</span>
                  {/if}
                  {#if link.expiresAt && new Date(link.expiresAt) < new Date()}
                    <span class="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">expired</span>
                  {/if}
                  {#if link.activatesAt && new Date(link.activatesAt) > new Date()}
                    <span class="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">scheduled</span>
                  {/if}
                  {#if link.maxClicks != null && link.clickCount >= link.maxClicks}
                    <span class="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">limit reached</span>
                  {/if}
                </div>
                <div class="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">→ {link.originalUrl}</div>
                <div class="mt-1 text-xs text-slate-400">
                  {link.clickCount}{link.maxClicks != null ? `/${link.maxClicks}` : ''} clicks · created {fmtDate(link.createdAt)}
                  {#if link.activatesAt && new Date(link.activatesAt) > new Date()} · activates {fmtDate(link.activatesAt)}{/if}
                  {#if link.expiresAt} · expires {fmtDate(link.expiresAt)}{/if}
                </div>
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <a href={`/links/${link.id}`} class="btn-ghost text-xs">Analytics</a>
                  <button class="btn-ghost text-xs" on:click={() => openEdit(link)}>Edit</button>
                  <button class="btn-ghost text-xs" on:click={() => toggle(link)}>
                    {link.isActive ? 'Pause' : 'Resume'}
                  </button>
                  <button class="btn-danger text-xs" on:click={() => del(link.id)}>Delete</button>
                </div>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>

{#if editing}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    on:click|self={closeEdit}
    on:keydown={(e) => e.key === 'Escape' && closeEdit()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900">
      <h3 class="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Edit link</h3>
      <p class="mb-4 font-mono text-sm text-slate-500 dark:text-slate-400">{base}/{editing.code}</p>
      <form class="space-y-4" on:submit|preventDefault={saveEdit}>
        <div>
          <label class="label" for="edit-url">Destination URL</label>
          <input id="edit-url" class="input" type="url" bind:value={editForm.originalUrl} required />
        </div>
        <div>
          <label class="label" for="edit-tag">Tag</label>
          <input id="edit-tag" class="input" type="text" bind:value={editForm.tag} maxlength="32" list="taglist" />
        </div>
        <div>
          <label class="label" for="edit-exp">Expires</label>
          <input id="edit-exp" class="input" type="datetime-local" bind:value={editForm.expiresAt} />
        </div>
        <div>
          <label class="label" for="edit-act">Activates at</label>
          <input id="edit-act" class="input" type="datetime-local" bind:value={editForm.activatesAt} />
        </div>
        <div>
          <label class="label" for="edit-max">Max clicks</label>
          <input id="edit-max" class="input" type="number" min="1" placeholder="leave blank for unlimited" bind:value={editForm.maxClicks} />
        </div>
        {#if editErr}
          <p class="text-sm text-red-600">{editErr}</p>
        {/if}
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn-ghost" on:click={closeEdit}>Cancel</button>
          <button class="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  </div>
{/if}
