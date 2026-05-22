<script>
  import { onMount, onDestroy } from 'svelte';
  import { DEFAULT_QR_STYLE, DOT_TYPES, CORNER_SQUARE_TYPES, CORNER_DOT_TYPES, ERROR_LEVELS, sanitizeQrStyle, toQrCodeStylingOptions } from './qrStyle.js';

  export let style = { ...DEFAULT_QR_STYLE };
  export let previewData = 'https://example.com/preview';
  export let previewSize = 220;

  let previewEl;
  let qr;
  let Ctor;
  let lastKey = '';

  $: localStyle = sanitizeQrStyle(style);
  $: key = JSON.stringify({ previewData, localStyle, previewSize });
  $: if (Ctor && previewEl && key !== lastKey) render();

  function render() {
    if (!previewEl || !Ctor) return;
    if (key === lastKey) return;
    lastKey = key;
    previewEl.innerHTML = '';
    qr = new Ctor(toQrCodeStylingOptions(localStyle, { data: previewData, width: previewSize }));
    qr.append(previewEl);
  }

  onMount(async () => {
    const mod = await import('qr-code-styling');
    Ctor = mod.default;
    render();
  });

  onDestroy(() => {
    qr = null;
  });

  function onColor(field, e) {
    style = { ...style, [field]: e.currentTarget.value };
  }
  function onSelect(field, e) {
    style = { ...style, [field]: e.currentTarget.value };
  }
  function onMargin(e) {
    style = { ...style, margin: Number(e.currentTarget.value) };
  }
  function onLogo(e) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    if (file.size > 75_000) {
      alert('Logo too large (max ~75KB). Try a smaller PNG/SVG.');
      e.currentTarget.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      style = { ...style, logoDataUrl: reader.result };
    };
    reader.readAsDataURL(file);
  }
  function clearLogo() {
    style = { ...style, logoDataUrl: null };
  }
  function reset() {
    style = { ...DEFAULT_QR_STYLE };
  }

  export async function downloadPng(filename = 'qr.png') {
    if (!Ctor) return;
    const hires = new Ctor(toQrCodeStylingOptions(localStyle, { data: previewData, width: 1024 }));
    await hires.download({ name: filename.replace(/\.png$/, ''), extension: 'png' });
  }
</script>

<div class="grid gap-4 sm:grid-cols-[1fr_220px]">
  <div class="space-y-3">
    <div class="grid grid-cols-2 gap-3">
      <label class="block">
        <span class="label">Foreground</span>
        <input type="color" value={localStyle.fgColor} on:input={(e) => onColor('fgColor', e)} class="h-9 w-full rounded border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900" />
      </label>
      <label class="block">
        <span class="label">Background</span>
        <input type="color" value={localStyle.bgColor} on:input={(e) => onColor('bgColor', e)} class="h-9 w-full rounded border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900" />
      </label>
    </div>

    <label class="block">
      <span class="label">Dot shape</span>
      <select class="input" value={localStyle.dotsType} on:change={(e) => onSelect('dotsType', e)}>
        {#each DOT_TYPES as t}<option value={t}>{t}</option>{/each}
      </select>
    </label>

    <div class="grid grid-cols-2 gap-3">
      <label class="block">
        <span class="label">Corner squares</span>
        <select class="input" value={localStyle.cornersSquareType} on:change={(e) => onSelect('cornersSquareType', e)}>
          {#each CORNER_SQUARE_TYPES as t}<option value={t}>{t}</option>{/each}
        </select>
      </label>
      <label class="block">
        <span class="label">Corner dots</span>
        <select class="input" value={localStyle.cornersDotType} on:change={(e) => onSelect('cornersDotType', e)}>
          {#each CORNER_DOT_TYPES as t}<option value={t}>{t}</option>{/each}
        </select>
      </label>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <label class="block">
        <span class="label">Error correction</span>
        <select class="input" value={localStyle.errorLevel} on:change={(e) => onSelect('errorLevel', e)}>
          {#each ERROR_LEVELS as l}<option value={l}>{l}</option>{/each}
        </select>
      </label>
      <label class="block">
        <span class="label">Margin</span>
        <input type="number" min="0" max="8" class="input" value={localStyle.margin} on:input={onMargin} />
      </label>
    </div>

    <div>
      <span class="label">Center logo</span>
      <div class="flex items-center gap-2">
        <input type="file" accept="image/png,image/jpeg,image/svg+xml" on:change={onLogo} class="text-sm" />
        {#if localStyle.logoDataUrl}
          <button type="button" class="text-xs text-red-600 hover:underline" on:click={clearLogo}>remove</button>
        {/if}
      </div>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">PNG/SVG, ~75KB max. Use error correction H for best scanability with logos.</p>
    </div>

    <button type="button" class="btn-ghost text-xs" on:click={reset}>Reset to defaults</button>
  </div>

  <div class="flex items-start justify-center">
    <div bind:this={previewEl} class="rounded border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-100"></div>
  </div>
</div>
