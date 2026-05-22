<script>
  export let data;
  $: brand = data.settings?.brandTitle || 'Snip';
  $: origin = typeof window !== 'undefined' ? window.location.origin : '';
</script>

<svelte:head><title>API docs · {brand}</title></svelte:head>

<h1 class="mb-2 text-3xl font-bold text-slate-900 dark:text-slate-100">API documentation</h1>
<p class="mb-8 text-sm text-slate-500 dark:text-slate-400">
  REST API for programmatic link management. Create a key at
  <a href="/settings" class="text-brand-600 hover:underline">/settings</a>.
</p>

<section class="card mb-6">
  <h2 class="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Authentication</h2>
  <p class="mb-3 text-sm text-slate-600 dark:text-slate-300">
    Send your key in the <code>Authorization</code> header on every request:
  </p>
  <pre class="overflow-x-auto rounded bg-slate-900 p-3 text-sm text-slate-100"><code>Authorization: Bearer snip_f_xxxxxxxxxxxxxxxxxxxxxxxxx</code></pre>
  <ul class="mt-3 list-inside list-disc text-sm text-slate-600 dark:text-slate-300">
    <li><code>snip_f_…</code> — full-access key (read + write)</li>
    <li><code>snip_r_…</code> — read-only key (GET only)</li>
  </ul>
</section>

<section class="card mb-6">
  <h2 class="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">List your links</h2>
  <p class="mb-2 font-mono text-sm text-slate-700 dark:text-slate-300">GET /api/links</p>
  <p class="mb-3 text-sm text-slate-600 dark:text-slate-300">Query params: <code>take</code> (max 200), <code>skip</code>.</p>
  <pre class="overflow-x-auto rounded bg-slate-900 p-3 text-sm text-slate-100"><code>curl -H "Authorization: Bearer $KEY" \
  {origin}/api/links</code></pre>
</section>

<section class="card mb-6">
  <h2 class="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Create a link</h2>
  <p class="mb-2 font-mono text-sm text-slate-700 dark:text-slate-300">POST /api/links</p>
  <p class="mb-3 text-sm text-slate-600 dark:text-slate-300">
    Body: <code>originalUrl</code> (required), <code>customSlug</code>, <code>expiresAt</code> (ISO), <code>tag</code>.
  </p>
  <pre class="overflow-x-auto rounded bg-slate-900 p-3 text-sm text-slate-100"><code>curl -X POST -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{`{"originalUrl":"https://example.com","customSlug":"my-link","tag":"campaign"}`}' \
  {origin}/api/links</code></pre>
</section>

<section class="card mb-6">
  <h2 class="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Get a single link with clicks</h2>
  <p class="mb-2 font-mono text-sm text-slate-700 dark:text-slate-300">GET /api/links/:id</p>
  <pre class="overflow-x-auto rounded bg-slate-900 p-3 text-sm text-slate-100"><code>curl -H "Authorization: Bearer $KEY" \
  {origin}/api/links/cmpg99jke0001rleds81s34u8</code></pre>
</section>

<section class="card mb-6">
  <h2 class="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Update a link</h2>
  <p class="mb-2 font-mono text-sm text-slate-700 dark:text-slate-300">PATCH /api/links/:id</p>
  <p class="mb-3 text-sm text-slate-600 dark:text-slate-300">
    Any subset of: <code>originalUrl</code>, <code>isActive</code>, <code>expiresAt</code> (or <code>null</code> to clear), <code>tag</code>.
  </p>
  <pre class="overflow-x-auto rounded bg-slate-900 p-3 text-sm text-slate-100"><code>curl -X PATCH -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{`{"isActive":false}`}' \
  {origin}/api/links/:id</code></pre>
</section>

<section class="card mb-6">
  <h2 class="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Delete a link</h2>
  <p class="mb-2 font-mono text-sm text-slate-700 dark:text-slate-300">DELETE /api/links/:id</p>
  <pre class="overflow-x-auto rounded bg-slate-900 p-3 text-sm text-slate-100"><code>curl -X DELETE -H "Authorization: Bearer $KEY" \
  {origin}/api/links/:id</code></pre>
</section>

<section class="card">
  <h2 class="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Error responses</h2>
  <table class="w-full text-left text-sm">
    <thead class="text-xs uppercase text-slate-500 dark:text-slate-400">
      <tr><th class="py-2">Status</th><th class="py-2">Meaning</th></tr>
    </thead>
    <tbody class="text-slate-700 dark:text-slate-300">
      <tr class="border-t border-slate-100 dark:border-slate-800"><td class="py-2 font-mono">400</td><td>Validation error</td></tr>
      <tr class="border-t border-slate-100 dark:border-slate-800"><td class="py-2 font-mono">401</td><td>Missing or invalid API key</td></tr>
      <tr class="border-t border-slate-100 dark:border-slate-800"><td class="py-2 font-mono">403</td><td>Read-only key on a write endpoint, or account/instance not permitted</td></tr>
      <tr class="border-t border-slate-100 dark:border-slate-800"><td class="py-2 font-mono">404</td><td>Link not found</td></tr>
      <tr class="border-t border-slate-100 dark:border-slate-800"><td class="py-2 font-mono">409</td><td>Slug already taken</td></tr>
      <tr class="border-t border-slate-100 dark:border-slate-800"><td class="py-2 font-mono">429</td><td>Rate limited</td></tr>
    </tbody>
  </table>
  <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">All errors return JSON: <code>{`{"message":"..."}`}</code></p>
</section>
