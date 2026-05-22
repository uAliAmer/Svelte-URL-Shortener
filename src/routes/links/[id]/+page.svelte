<script>
  export let data;
  $: link = data.link;
  $: clicks = data.clicks;
  $: base = data.publicBase.replace(/\/$/, '');

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
  <h1 class="font-mono text-2xl text-slate-900">{base}/{link.code}</h1>
  <p class="mt-1 truncate text-sm text-slate-600">→ {link.originalUrl}</p>
  <div class="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
    <span>{link.clickCount} total clicks</span>
    <span>Created {fmt(link.createdAt)}</span>
    {#if link.expiresAt}<span>Expires {fmt(link.expiresAt)}</span>{/if}
    <span>{link.isActive ? 'Active' : 'Paused'}</span>
  </div>
</header>

<section class="card mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
  <img
    src={data.qrDataUrl}
    alt="QR code for {data.shortUrl}"
    width="160"
    height="160"
    class="rounded border border-slate-200"
  />
  <div class="flex-1">
    <h2 class="text-sm font-semibold text-slate-700">QR code</h2>
    <p class="mt-1 text-sm text-slate-500">Scan to open {data.shortUrl}</p>
    <a
      href={data.qrDataUrl}
      download={`qr-${link.code}.png`}
      class="mt-3 inline-block text-sm text-brand-600 hover:underline"
    >
      Download PNG
    </a>
  </div>
</section>

<section class="card mt-6">
  <h2 class="mb-4 text-sm font-semibold text-slate-700">Clicks · last 30 days</h2>
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
  <div class="mt-2 flex justify-between text-xs text-slate-400">
    <span>{chartDays[0].date}</span>
    <span>{chartDays[chartDays.length - 1].date}</span>
  </div>
</section>

<section class="mt-6">
  <h2 class="mb-3 text-sm font-semibold text-slate-700">Recent clicks</h2>
  {#if clicks.length === 0}
    <div class="card text-sm text-slate-500">No clicks yet.</div>
  {:else}
    <div class="card overflow-x-auto p-0">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
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
            <tr class="border-t border-slate-100">
              <td class="px-4 py-2 whitespace-nowrap text-slate-700">{fmt(c.createdAt)}</td>
              <td class="px-4 py-2 font-mono text-xs text-slate-600">{c.ip || '—'}</td>
              <td class="px-4 py-2 text-slate-600">{c.country || '—'}</td>
              <td class="px-4 py-2 max-w-xs truncate text-slate-600" title={c.referrer || ''}>{c.referrer || '—'}</td>
              <td class="px-4 py-2 max-w-xs truncate text-slate-500" title={c.userAgent || ''}>{c.userAgent || '—'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
