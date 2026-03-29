<script>
  import '../app.css';
  let { children } = $props();
</script>

<nav class="topnav">
  <div class="topnav-inner">
    <a href="/" class="topnav-brand">Spannungsatlas</a>
    <ul class="topnav-links">
      <li><a href="/">Übersicht</a></li>
      <li><a href="/cases/new">Neuer Fall</a></li>
      <li><a href="/catalog">Katalog</a></li>
      <li><a href="/compare">Vergleich</a></li>
    </ul>
  </div>
</nav>

<main>
  {@render children()}
</main>

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
    gap: 2rem;
    flex-wrap: wrap;
  }
  .topnav-brand {
    font-weight: 700;
    font-size: 1.15rem;
    color: var(--color-accent);
    text-decoration: none;
    letter-spacing: -0.02em;
  }
  .topnav-links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 1.25rem;
    font-size: 0.9rem;
  }
  .topnav-links a {
    color: var(--color-text-muted);
    text-decoration: none;
    padding: 0.25rem 0;
  }
  .topnav-links a:hover {
    color: var(--color-accent);
  }
</style>
