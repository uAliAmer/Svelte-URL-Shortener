<script>
  import { page } from '$app/stores';
  $: status = $page.status;
  $: message = $page.error?.message || 'Something went wrong';
  $: isNotFound = status === 404;
</script>

<svelte:head>
  <title>{status} · Snip</title>
</svelte:head>

<section class="flex flex-col items-center justify-center py-20 text-center">
  <div class="mb-2 font-mono text-6xl font-bold text-brand-600">{status}</div>
  <h1 class="mb-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
    {isNotFound ? 'Link not found' : 'Something went wrong'}
  </h1>
  <p class="mb-6 max-w-md text-sm text-slate-500 dark:text-slate-400">
    {#if isNotFound}
      This short link doesn't exist, or it may have been deleted. Double-check the URL or head back home.
    {:else}
      {message}
    {/if}
  </p>
  <div class="flex gap-2">
    <a href="/" class="btn-primary text-sm">Go home</a>
    <a href="/dashboard" class="btn-ghost text-sm">Dashboard</a>
  </div>
</section>
