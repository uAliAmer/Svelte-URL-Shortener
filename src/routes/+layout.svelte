<script>
  import '../app.css';
  import { goto } from '$app/navigation';
  export let data;

  $: brand = data.settings?.brandTitle || 'Snip';
  $: tagline = data.settings?.brandTagline || 'open-source self-hosted URL shortener';
  $: signupDisabled = !!data.settings?.signupDisabled;
  $: initial = brand.trim().charAt(0).toUpperCase() || 'S';

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    goto('/login', { invalidateAll: true });
  }
</script>

<svelte:head>
  <title>{brand}</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
      <a href="/" class="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <span class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white">{initial}</span>
        {brand}
      </a>
      <nav class="flex items-center gap-2 text-sm">
        {#if data.user}
          <a href="/dashboard" class="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100">Dashboard</a>
          <a href="/account/api-keys" class="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100">API keys</a>
          {#if data.user.isAdmin}
            <a href="/admin" class="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100">Admin</a>
          {/if}
          <span class="hidden text-slate-500 sm:inline">{data.user.email}</span>
          <button on:click={logout} class="btn-ghost text-sm">Log out</button>
        {:else}
          <a href="/login" class="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100">Log in</a>
          {#if !signupDisabled}
            <a href="/register" class="btn-primary text-sm">Sign up</a>
          {/if}
        {/if}
      </nav>
    </div>
  </header>

  <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
    <slot />
  </main>

  <footer class="border-t border-slate-200 bg-white">
    <div class="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-slate-500">
      {brand} — {tagline}
    </div>
  </footer>
</div>
