<script>
  import { goto } from '$app/navigation';
  let email = '';
  let password = '';
  let err = '';
  let loading = false;

  async function submit() {
    err = '';
    loading = true;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        try { const j = await res.json(); err = j.message || 'Login failed'; } catch { err = 'Login failed'; }
        return;
      }
      goto('/dashboard', { invalidateAll: true });
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head><title>Log in · Snip</title></svelte:head>

<div class="mx-auto max-w-sm">
  <h1 class="mb-6 text-2xl font-bold text-slate-900">Log in</h1>
  <form class="card space-y-4" on:submit|preventDefault={submit}>
    <div>
      <label class="label" for="email">Email</label>
      <input id="email" class="input" type="email" bind:value={email} required autocomplete="email" />
    </div>
    <div>
      <label class="label" for="password">Password</label>
      <input id="password" class="input" type="password" bind:value={password} required autocomplete="current-password" />
    </div>
    {#if err}
      <p class="text-sm text-red-600">{err}</p>
    {/if}
    <button class="btn-primary w-full" disabled={loading}>
      {loading ? 'Logging in…' : 'Log in'}
    </button>
    <p class="text-center text-sm text-slate-600">
      No account? <a href="/register" class="text-brand-600 hover:underline">Sign up</a>
    </p>
  </form>
</div>
