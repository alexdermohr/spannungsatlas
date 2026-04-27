<script lang="ts">
  interface Props {
    slideTitles: string[];
    currentSlide: number;
    onSelect: (slide: number) => void;
  }

  let { slideTitles, currentSlide, onSelect }: Props = $props();

  const activeTitle = $derived(
    (slideTitles[currentSlide - 1] ?? '').replace(/^\d+\.\s*/, '')
  );
</script>

<div class="slide-nav-wrapper">
  <div class="slide-nav-current" aria-live="polite">
    Aktueller Schritt: {currentSlide}. {activeTitle}
  </div>
  <nav class="slide-nav" aria-label="Formularfolien">
    {#each slideTitles as title, i}
      <button
        type="button"
        class="slide-nav-item"
        class:active={currentSlide === i + 1}
        aria-current={currentSlide === i + 1 ? 'step' : undefined}
        onclick={() => onSelect(i + 1)}
      >
        <span class="slide-nav-step">{i + 1}</span>
        <span class="slide-nav-label">{title.replace(/^\d+\.\s*/, '')}</span>
      </button>
    {/each}
  </nav>
</div>

<style>
  .slide-nav-wrapper {
    margin-bottom: 1rem;
  }
  .slide-nav-current {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--color-accent);
    padding: 0.3rem 0.5rem 0.3rem 0;
    display: none;
  }
  .slide-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-bg);
  }
  .slide-nav-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-text-muted);
    padding: 0.35rem 0.6rem;
    font-size: 0.8rem;
    border-radius: var(--radius);
    cursor: pointer;
  }
  .slide-nav-item:hover { color: var(--color-text); }
  .slide-nav-item.active {
    color: var(--color-accent);
    border-color: var(--color-accent);
    background: rgba(45, 90, 155, 0.06);
  }
  .slide-nav-step {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.35rem;
    height: 1.35rem;
    border-radius: 50%;
    background: var(--color-border);
    color: var(--color-text);
    font-size: 0.72rem;
    font-weight: 600;
  }
  .slide-nav-item.active .slide-nav-step {
    background: var(--color-accent);
    color: white;
  }

  @media (max-width: 640px) {
    .slide-nav-current { display: block; }
    .slide-nav-label { display: none; }
  }
</style>
