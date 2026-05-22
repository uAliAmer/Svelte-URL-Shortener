<script>
  import '../app.css';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  export let data;

  $: brand = data.settings?.brandTitle || 'Snip';
  $: tagline = data.settings?.brandTagline || 'open-source self-hosted URL shortener';
  $: signupDisabled = !!data.settings?.signupDisabled;
  $: initial = brand.trim().charAt(0).toUpperCase() || 'S';

  let theme = 'light';

  onMount(() => {
    theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    goto('/login', { invalidateAll: true });
  }
</script>

<svelte:head>
  <title>{brand}</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
  <header class="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
      <a href="/" class="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
        <span class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white">{initial}</span>
        {brand}
      </a>
      <nav class="flex items-center gap-2 text-sm">
        {#if data.user}
          <a href="/dashboard" class="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Dashboard</a>
          <a href="/settings" class="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Settings</a>
          <span class="hidden text-slate-500 sm:inline dark:text-slate-400">{data.user.email}</span>
          <button on:click={logout} class="btn-ghost text-sm">Log out</button>
        {:else}
          <a href="/login" class="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Log in</a>
          {#if !signupDisabled}
            <a href="/register" class="btn-primary text-sm">Sign up</a>
          {/if}
        {/if}
        <button
          on:click={toggleTheme}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
          class="ml-1 rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {#if theme === 'dark'}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
          {:else}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          {/if}
        </button>
      </nav>
    </div>
  </header>

  <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
    <slot />
  </main>

  <footer class="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <div class="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
      {brand} — {tagline}
    </div>
  </footer>
</div>
