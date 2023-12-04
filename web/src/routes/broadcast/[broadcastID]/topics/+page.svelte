<script lang="ts">
  import { page } from '$app/stores';
  import newscastImg from '$lib/assets/newscast.svg';
  import { defaultFormatter } from '$lib/utils/date';
  import type { PageData } from './$types';
  import DeleteTopic from './DeleteTopic.svelte';

  export let data: PageData;

  $: id = Number($page.params['broadcastID']);
</script>

<main>
  <section class="section">
    <div class="container">
      <nav class="breadcrumb" aria-label="breadcrumbs">
        <ul>
          <li><a href="/"><img class="image is-24x24" src={newscastImg} alt="newscast icon" /></a></li>
          <li><a href="/broadcast">Broadcast</a></li>
          <li><a href="/broadcast/{id}">{id}</a></li>
          <li><a href="/broadcast/{id}/topics">Topics</a></li>
        </ul>
      </nav>

      <h1 class="title">Broadcast {id}</h1>

      <div class="tabs">
        <ul>
          <li class="is-active"><a href="./topics">Topics</a></li>
          <li><a href="./articles">Articles</a></li>
          <li><a href="./editor">Editor</a></li>
          <li><a href="./output">Output</a></li>
        </ul>
      </div>

      <div class="level">
        <div class="level-left">
          <div class="level-item">
            <p>{data.topics.length} item{data.topics.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div class="level-right">
          <div class="level-item">
            <a href="/broadcast/{id}/topics/trending" class="button is-success">Add trending</a>
          </div>
        </div>
      </div>

      {#if data.topics.length > 0}
        <table class="table is-hoverable is-fullwidth">
          <thead>
            <tr>
              <th>Name</th>
              <th>Query</th>
              <th>Created at</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each data.topics as topic (topic.id)}
              <tr>
                <td>{topic.name}</td>
                <td>{topic.query}</td>
                <td>{defaultFormatter.format(topic.createdAt)}</td>
                <td class="has-text-right"><DeleteTopic topicID={topic.id} /></td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <div class="notification is-warning is-light">There's nothing here...</div>
      {/if}

      <div class="level">
        <div class="level-left" />
        <div class="level-right">
          <div class="level-item">
            <a href="./articles" class="button is-primary">Next</a>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>
