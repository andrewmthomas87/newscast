<script lang="ts">
  import newscastImg from '$lib/assets/newscast.svg';
</script>

<main>
  <section class="hero is-primary">
    <div class="hero-body">
      <div class="columns is-vcentered">
        <div class="column is-5 is-offset-2">
          <h1 class="title is-1">newscast</h1>
          <h2 class="subtitle is-3">News broadcasts, generated w/ AI</h2>

          <button class="button is-medium is-primary is-light">Get started</button>
        </div>
        <div class="column is-3 is-text-centered">
          <img src={newscastImg} alt="newscast icon" />
        </div>
      </div>
    </div>
  </section>
</main>

<style>
  img {
    max-width: 100%;
    height: 256px;
  }
</style>
