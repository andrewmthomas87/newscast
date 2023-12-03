<script lang="ts">
  import { goto } from '$app/navigation';
  import { defaultFormatter } from '$lib/utils/date';
  import type { PageData } from './$types';
  import Delete from './Delete.svelte';
  import New from './New.svelte';
  import newscastImg from '$lib/assets/newscast.svg';

  export let data: PageData;
</script>

<main>
  <section class="section">
    <div class="container">
      <nav class="breadcrumb" aria-label="breadcrumbs">
        <ul>
          <li><a href="/"><img class="image is-24x24" src={newscastImg} alt="newscast icon" /></a></li>
          <li class="is-active"><a href="/broadcast">Broadcast</a></li>
        </ul>
      </nav>

      <h1 class="title">Broadcasts</h1>

      <div class="level">
        <div class="level-left">
          <div class="level-item">
            <p>{data.broadcasts.length} item{data.broadcasts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div class="level-right">
          <div class="level-item">
            <New />
          </div>
        </div>
      </div>

      {#if data.broadcasts.length > 0}
        <table class="table is-hoverable is-fullwidth">
          <thead>
            <tr>
              <th>ID</th>
              <th># Topics</th>
              <th>Created at</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each data.broadcasts as broadcast (broadcast.id)}
              <tr on:dblclick={() => goto(`/broadcast/${broadcast.id}`)}>
                <td>{broadcast.id}</td>
                <td>{broadcast._count.topics}</td>
                <td>{defaultFormatter.format(broadcast.createdAt)}</td>
                <td class="has-text-right">
                  <Delete broadcastID={broadcast.id} />
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <div class="notification is-warning is-light">There's nothing here...</div>
      {/if}
    </div>
  </section>
</main>
