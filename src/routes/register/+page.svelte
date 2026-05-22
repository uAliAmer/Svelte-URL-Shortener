<script>
  import { goto } from '$app/navigation';
  export let data;
  let email = '';
  let password = '';
  let err = '';
  let loading = false;
  $: signupDisabled = !!data.settings?.signupDisabled;

  async function submit() {
    err = '';
    loading = true;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        try { const j = await res.json(); err = j.message || 'Registration failed'; } catch { err = 'Registration failed'; }
        return;
      }
      goto('/dashboard', { invalidateAll: true });
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head><title>Sign up · Snip</title></svelte:head>

<div class="mx-auto max-w-sm">
  <h1 class="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">Create an account</h1>
  {#if signupDisabled}
    <div class="card text-center text-sm text-slate-600 dark:text-slate-300">
      <p class="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">Signups are disabled</p>
      <p>This instance is invitation-only. Contact the administrator for an account.</p>
      <a href="/login" class="mt-4 inline-block text-brand-600 hover:underline">Log in instead</a>
    </div>
  {:else}
  <form class="card space-y-4" on:submit|preventDefault={submit}>
    <div>
      <label class="label" for="email">Email</label>
      <input id="email" class="input" type="email" bind:value={email} required autocomplete="email" />
    </div>
    <div>
      <label class="label" for="password">Password</label>
      <input id="password" class="input" type="password" bind:value={password} required minlength="8" autocomplete="new-password" />
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">At least 8 characters.</p>
    </div>
    {#if err}
      <p class="text-sm text-red-600">{err}</p>
    {/if}
    <button class="btn-primary w-full" disabled={loading}>
      {loading ? 'Creating…' : 'Sign up'}
    </button>
    <p class="text-center text-sm text-slate-600 dark:text-slate-300">
      Already have one? <a href="/login" class="text-brand-600 hover:underline">Log in</a>
    </p>
  </form>
  {/if}
</div>
