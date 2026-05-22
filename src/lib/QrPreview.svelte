<script>
  import { onMount, onDestroy } from 'svelte';
  import { sanitizeQrStyle, toQrCodeStylingOptions } from './qrStyle.js';

  export let data = '';
  export let style = {};
  export let size = 128;
  export let fallback = null;

  let host;
  let qr;
  let Ctor;
  let lastKey = '';

  $: sanitized = sanitizeQrStyle(style);
  $: key = JSON.stringify({ data, sanitized, size });
  $: if (Ctor && host && key !== lastKey) render();

  function render() {
    if (!host || !Ctor) return;
    if (key === lastKey) return;
    lastKey = key;
    host.innerHTML = '';
    qr = new Ctor(toQrCodeStylingOptions(sanitized, { data, width: size }));
    qr.append(host);
  }

  onMount(async () => {
    const mod = await import('qr-code-styling');
    Ctor = mod.default;
    render();
  });

  onDestroy(() => {
    qr = null;
  });

  export async function download(filename = 'qr.png') {
    if (!Ctor) return;
    const hires = new Ctor(toQrCodeStylingOptions(sanitized, { data, width: 1024 }));
    await hires.download({ name: filename.replace(/\.png$/, ''), extension: 'png' });
  }
</script>

<div class="relative" style="width:{size}px;height:{size}px">
  {#if fallback && lastKey === ''}
    <img src={fallback} alt="QR" width={size} height={size} class="absolute inset-0" />
  {/if}
  <div bind:this={host} style="width:{size}px;height:{size}px" class="absolute inset-0 overflow-hidden"></div>
</div>
