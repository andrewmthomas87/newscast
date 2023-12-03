<script lang="ts">
  import { defaultFormatter } from '$lib/utils/date';
  import type { Topic } from '@prisma/client';
  import DeleteTopic from './DeleteTopic.svelte';

  export let broadcastID: number;
  export let topics: Topic[];
</script>

<div class="box">
  <h2 class="subtitle">Topics</h2>

  <div class="level">
    <div class="level-left">
      <div class="level-item">
        <p>{topics.length} item{topics.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
    <div class="level-right">
      <div class="level-item">
        <a href="/broadcast/{broadcastID}/trending" class="button is-success">Add trending</a>
      </div>
    </div>
  </div>

  {#if topics.length > 0}
    <table class="table is-hoverable is-fullwidth">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Query</th>
          <th>Created at</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each topics as topic (topic.id)}
          <tr>
            <td>{topic.id}</td>
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
</div>
