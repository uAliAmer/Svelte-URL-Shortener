<script>
  export let data;
  export let form;
</script>

<svelte:head><title>Account setup</title></svelte:head>

<div class="mx-auto max-w-md">
  <h1 class="mb-2 text-2xl font-bold text-slate-900">Set your credentials</h1>
  <p class="mb-6 text-sm text-slate-500">
    You're using the seeded demo account. Choose a new email and password before continuing.
  </p>

  <form class="card space-y-4" method="POST">
    <div>
      <label class="label" for="current">Current password</label>
      <input id="current" name="currentPassword" class="input" type="password" required autocomplete="current-password" />
      <p class="mt-1 text-xs text-slate-400">Default demo password is <code>demo1234</code></p>
    </div>
    <div>
      <label class="label" for="email">New email</label>
      <input id="email" name="email" class="input" type="email" value={data.email} required autocomplete="email" />
    </div>
    <div>
      <label class="label" for="pw">New password</label>
      <input id="pw" name="password" class="input" type="password" minlength="8" required autocomplete="new-password" />
      <p class="mt-1 text-xs text-slate-400">At least 8 characters.</p>
    </div>
    {#if form?.message}
      <p class="text-sm text-red-600">{form.message}</p>
    {/if}
    <button class="btn-primary w-full">Save and continue</button>
  </form>
</div>
