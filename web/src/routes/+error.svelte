<script lang="ts">
  import { page } from '$app/stores';
</script>

<main>
  <section class="section">
    <div class="container">
      <h1 class="title">Status {$page.status}</h1>
      <h2 class="subtitle">{$page.error?.message}</h2>

      <a href="/" class="button is-link is-light">Return to home</a>
    </div>
  </section>
</main>
