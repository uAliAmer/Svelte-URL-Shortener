<script>
  import { invalidateAll } from '$app/navigation';
  import QrStyleEditor from '$lib/QrStyleEditor.svelte';
  import QrPreview from '$lib/QrPreview.svelte';
  import { sanitizeQrStyle } from '$lib/qrStyle.js';
  export let data;
  $: link = data.link;
  $: clicks = data.clicks;
  $: base = data.publicBase.replace(/\/$/, '');

  let editorOpen = false;
  let useInstanceDefault = !data.link.qrStyleOverride;
  let editorStyle = sanitizeQrStyle(data.effectiveStyle);
  let editorRef;
  let mainPreviewRef;
  let saveMsg = '';
  let saving = false;

  function resetToInstance() {
    useInstanceDefault = true;
    editorStyle = sanitizeQrStyle(data.instanceStyle);
  }

  async function save() {
    saving = true;
    saveMsg = '';
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ qrStyle: useInstanceDefault ? null : editorStyle })
      });
      if (!res.ok) {
        try { const j = await res.json(); saveMsg = j.message || 'Save failed'; } catch { saveMsg = 'Save failed'; }
        return;
      }
      saveMsg = 'Saved';
      editorOpen = false;
      await invalidateAll();
      setTimeout(() => (saveMsg = ''), 1500);
    } finally {
      saving = false;
    }
  }

  async function downloadEditor() {
    if (editorRef) await editorRef.downloadPng(`qr-${link.code}.png`);
  }
  async function downloadMain() {
    if (mainPreviewRef) await mainPreviewRef.download(`qr-${link.code}.png`);
  }

  $: chartDays = (() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const k = d.toISOString().slice(0, 10);
      days.push({ date: k, count: data.byDay[k] || 0 });
    }
    return days;
  })();

  $: max = Math.max(1, ...chartDays.map((d) => d.count));

  function fmt(d) {
    return new Date(d).toLocaleString();
  }
</script>

<svelte:head><title>{link.code} · Snip</title></svelte:head>

<a href="/dashboard" class="text-sm text-brand-600 hover:underline">← Back to dashboard</a>

<header class="mt-4">
  <h1 class="font-mono text-2xl text-slate-900 dark:text-slate-100">{base}/{link.code}</h1>
  <p class="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">→ {link.originalUrl}</p>
  <div class="mt-2 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
    <span>{link.clickCount} total clicks</span>
    <span>Created {fmt(link.createdAt)}</span>
    {#if link.expiresAt}<span>Expires {fmt(link.expiresAt)}</span>{/if}
    <span>{link.isActive ? 'Active' : 'Paused'}</span>
  </div>
</header>

<section class="card mt-6">
  <div class="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
    <div class="rounded border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-100">
      <QrPreview bind:this={mainPreviewRef} data={data.shortUrl} style={data.effectiveStyle} size={160} fallback={data.qrDataUrl} />
    </div>
    <div class="flex-1">
      <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300">QR code</h2>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Scan to open {data.shortUrl}</p>
      <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">
        {data.link.qrStyleOverride ? 'Using custom style for this link' : 'Using instance default style'}
      </p>
      <div class="mt-3 flex gap-2">
        <button type="button" class="btn-ghost text-xs" on:click={downloadMain}>Download PNG</button>
        <button type="button" class="btn-ghost text-xs" on:click={() => (editorOpen = !editorOpen)}>
          {editorOpen ? 'Close editor' : 'Customize QR'}
        </button>
      </div>
    </div>
  </div>

  {#if editorOpen}
    <div class="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
      <label class="mb-4 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" bind:checked={useInstanceDefault} />
        Use instance default style
      </label>

      {#if !useInstanceDefault}
        <QrStyleEditor bind:this={editorRef} bind:style={editorStyle} previewData={data.shortUrl} />
      {:else}
        <p class="text-sm text-slate-500 dark:text-slate-400">This link will use the global style configured by an admin in <a href="/settings" class="text-brand-600 hover:underline">Settings</a>.</p>
      {/if}

      <div class="mt-4 flex items-center gap-2">
        <button class="btn-primary text-sm" on:click={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save style'}
        </button>
        {#if !useInstanceDefault}
          <button type="button" class="btn-ghost text-sm" on:click={downloadEditor}>Download styled PNG</button>
        {/if}
        {#if saveMsg}<span class="text-sm text-slate-500 dark:text-slate-400">{saveMsg}</span>{/if}
      </div>
    </div>
  {/if}
</section>

<section class="card mt-6">
  <h2 class="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Clicks · last 30 days</h2>
  <div class="flex h-32 items-end gap-1">
    {#each chartDays as d}
      <div class="flex-1" title={`${d.date}: ${d.count}`}>
        <div
          class="rounded-t bg-brand-500/80"
          style={`height: ${(d.count / max) * 100}%; min-height: ${d.count > 0 ? '4px' : '1px'};`}
        ></div>
      </div>
    {/each}
  </div>
  <div class="mt-2 flex justify-between text-xs text-slate-400 dark:text-slate-500">
    <span>{chartDays[0].date}</span>
    <span>{chartDays[chartDays.length - 1].date}</span>
  </div>
</section>

<section class="mt-6">
  <h2 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Recent clicks</h2>
  {#if clicks.length === 0}
    <div class="card text-sm text-slate-500 dark:text-slate-400">No clicks yet.</div>
  {:else}
    <div class="card overflow-x-auto p-0">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500 dark:text-slate-400 dark:bg-slate-800 dark:text-slate-400">
          <tr>
            <th class="px-4 py-2">When</th>
            <th class="px-4 py-2">IP</th>
            <th class="px-4 py-2">Country</th>
            <th class="px-4 py-2">Referrer</th>
            <th class="px-4 py-2">User-Agent</th>
          </tr>
        </thead>
        <tbody>
          {#each clicks as c}
            <tr class="border-t border-slate-100 dark:border-slate-800">
              <td class="px-4 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{fmt(c.createdAt)}</td>
              <td class="px-4 py-2 font-mono text-xs text-slate-600 dark:text-slate-300">{c.ip || '—'}</td>
              <td class="px-4 py-2 text-slate-600 dark:text-slate-300">{c.country || '—'}</td>
              <td class="px-4 py-2 max-w-xs truncate text-slate-600 dark:text-slate-300" title={c.referrer || ''}>{c.referrer || '—'}</td>
              <td class="px-4 py-2 max-w-xs truncate text-slate-500 dark:text-slate-400" title={c.userAgent || ''}>{c.userAgent || '—'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
