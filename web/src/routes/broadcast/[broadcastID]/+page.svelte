<script lang="ts">
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import Topics from './Topics.svelte';

  export let data: PageData;

  $: id = Number($page.params['broadcastID']);
</script>

<main>
  <section class="section">
    <div class="container">
      <nav class="breadcrumb" aria-label="breadcrumbs">
        <ul>
          <li><a href="/">newscast</a></li>
          <li><a href="/broadcast">Broadcast</a></li>
          <li class="is-active"><a href="/broadcast/{id}">{id}</a></li>
        </ul>
      </nav>

      <h1 class="title">Broadcast {id}</h1>

      <Topics broadcastID={id} topics={data.topics} />
    </div>
  </section>
</main>
