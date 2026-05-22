<script>
  export let data;
</script>

<section class="text-center">
  <h1 class="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
    Short links you control.
  </h1>
  <p class="mx-auto mt-4 max-w-xl text-lg text-slate-600">
    A self-hosted URL shortener. Sign up to create branded short links with full click analytics.
    Anyone with the link can follow it.
  </p>
  <div class="mt-8 flex justify-center gap-3">
    {#if data.user}
      <a href="/dashboard" class="btn-primary">Open dashboard</a>
    {:else}
      <a href="/register" class="btn-primary">Get started</a>
      <a href="/login" class="btn-ghost">Log in</a>
    {/if}
  </div>
</section>

<section class="mt-16 grid gap-4 sm:grid-cols-3">
  <div class="card">
    <div class="text-sm font-semibold text-brand-600">Private</div>
    <p class="mt-1 text-sm text-slate-600">Only authenticated users can create links. Redirects are public.</p>
  </div>
  <div class="card">
    <div class="text-sm font-semibold text-brand-600">Custom slugs</div>
    <p class="mt-1 text-sm text-slate-600">Use a random code or pick a memorable slug for your campaigns.</p>
  </div>
  <div class="card">
    <div class="text-sm font-semibold text-brand-600">Click analytics</div>
    <p class="mt-1 text-sm text-slate-600">Every click logs referrer, user-agent, country, and timestamp.</p>
  </div>
</section>
