<script>
  import '../app.css';
  import { goto } from '$app/navigation';
  export let data;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    goto('/login', { invalidateAll: true });
  }
</script>

<header class="border-b border-slate-200 bg-white">
  <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
    <a href="/" class="flex items-center gap-2 text-lg font-semibold text-slate-900">
      <span class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white">S</span>
      Snip
    </a>
    <nav class="flex items-center gap-2 text-sm">
      {#if data.user}
        <a href="/dashboard" class="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100">Dashboard</a>
        <span class="hidden text-slate-500 sm:inline">{data.user.email}</span>
        <button on:click={logout} class="btn-ghost text-sm">Log out</button>
      {:else}
        <a href="/login" class="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100">Log in</a>
        <a href="/register" class="btn-primary text-sm">Sign up</a>
      {/if}
    </nav>
  </div>
</header>

<main class="mx-auto max-w-5xl px-4 py-10">
  <slot />
</main>

<footer class="mt-16 border-t border-slate-200 bg-white">
  <div class="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-slate-500">
    Snip — open-source private URL shortener
  </div>
</footer>
