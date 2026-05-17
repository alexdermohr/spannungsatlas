<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import UpdateBanner from '$lib/components/UpdateBanner.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { initTheme } from '$lib/stores/theme.js';

  let { children } = $props();
  let menuOpen = $state(false);

  onMount(() => {
    return initTheme();
  });

  function closeMenu() {
    menuOpen = false;
  }
</script>

<nav class="topnav">
  <div class="topnav-inner">
    <a href="/" class="topnav-brand">Spannungsatlas</a>

    <button
      type="button"
      class="menu-toggle"
      aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
      aria-expanded={menuOpen}
      aria-controls="topnav-body"
      onclick={() => (menuOpen = !menuOpen)}
    >
      <span class="hamburger" class:open={menuOpen}></span>
    </button>

    <div id="topnav-body" class="topnav-body" class:open={menuOpen}>
      <ul class="topnav-links">
        <li><a href="/" onclick={closeMenu}>Übersicht</a></li>
        <li><a href="/cases/new" onclick={closeMenu}>Neuer Fall</a></li>
        <li><a href="/catalog" onclick={closeMenu}>Katalog</a></li>
        <li><a href="/compare" onclick={closeMenu}>Vergleich</a></li>
      </ul>
      <ThemeToggle />
    </div>
  </div>
</nav>

<main>
  {@render children()}
</main>

<UpdateBanner />

<style>
  .topnav {
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .topnav-inner {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .topnav-brand {
    font-weight: 700;
    font-size: 1.15rem;
    color: var(--color-accent);
    text-decoration: none;
    letter-spacing: -0.02em;
  }

  /* ── Hamburger button (mobile only) ───────── */
  .menu-toggle {
    display: none;
    margin-left: auto;
    padding: 0.4rem;
    background: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    cursor: pointer;
    width: 2.2rem;
    height: 2.2rem;
    align-items: center;
    justify-content: center;
  }
  .hamburger,
  .hamburger::before,
  .hamburger::after {
    display: block;
    width: 1.1rem;
    height: 2px;
    background: var(--color-text);
    border-radius: 1px;
    transition: transform 0.2s, opacity 0.2s;
    position: relative;
  }
  .hamburger::before,
  .hamburger::after {
    content: '';
    position: absolute;
    left: 0;
    width: 100%;
  }
  .hamburger::before { top: -5px; }
  .hamburger::after  { top: 5px; }
  .hamburger.open { background: transparent; }
  .hamburger.open::before { top: 0; transform: rotate(45deg); }
  .hamburger.open::after  { top: 0; transform: rotate(-45deg); }

  /* ── Nav body (links + theme toggle) ──────── */
  .topnav-body {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex: 1;
  }
  .topnav-links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 1.25rem;
    font-size: 0.9rem;
    flex: 1;
  }
  .topnav-links li {
    list-style: none;
  }
  .topnav-links a {
    color: var(--color-text-muted);
    text-decoration: none;
    padding: 0.25rem 0;
    display: inline-block;
  }
  .topnav-links a:hover {
    color: var(--color-accent);
  }

  /* ── Responsive: collapse to hamburger ────── */
  @media (max-width: 640px) {
    .menu-toggle {
      display: inline-flex;
    }
    .topnav-body {
      display: none;
      flex-basis: 100%;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
      padding-top: 0.5rem;
    }
    .topnav-body.open {
      display: flex;
    }
    .topnav-links {
      flex-direction: column;
      gap: 0.4rem;
    }
  }
</style>
