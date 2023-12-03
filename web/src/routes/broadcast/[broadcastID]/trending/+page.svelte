<script lang="ts">
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import AddSelected from './AddSelected.svelte';

  export let data: PageData;

  $: id = Number($page.params['broadcastID']);

  let selected = new Set<number>();

  $: selectedTrends = data.trending.filter((_, i) => selected.has(i));

  function handleSetSelected(n: number) {
    selected = new Set(
      Array(n)
        .fill(0)
        .map((_, i) => i),
    );
  }

  function handleToggle(i: number) {
    const next = new Set(selected);
    if (selected.has(i)) {
      next.delete(i);
    } else {
      next.add(i);
    }

    selected = next;
  }
</script>

<main>
  <section class="section">
    <div class="container">
      <nav class="breadcrumb" aria-label="breadcrumbs">
        <ul>
          <li><a href="/">newscast</a></li>
          <li><a href="/broadcast">Broadcast</a></li>
          <li><a href="/broadcast/{id}">{id}</a></li>
          <li class="is-active"><a href="/broadcast/{id}/trending">Trending</a></li>
        </ul>
      </nav>

      <h1 class="title">Trending</h1>

      <div class="level">
        <div class="level-left">
          <div class="level-item">
            <p>
              {data.trending.length} item{data.trending.length !== 1 ? 's' : ''} &middot; {selected.size} selected
            </p>
          </div>
        </div>
        <div class="level-right">
          <div class="level-item">
            <span class="mr-2">Select:</span>
            <div class="buttons are-small">
              <button class="button" on:click={() => handleSetSelected(0)}>None</button>
              <button class="button" on:click={() => handleSetSelected(5)}>5</button>
              <button class="button" on:click={() => handleSetSelected(10)}>10</button>
              <button class="button" on:click={() => handleSetSelected(20)}>20</button>
              <button class="button" on:click={() => handleSetSelected(data.trending.length)}>All</button>
            </div>
          </div>
          <div class="level-item">
            <AddSelected trends={selectedTrends} />
          </div>
        </div>
      </div>

      <table class="table is-hoverable is-fullwidth">
        <thead>
          <th></th>
          <th>#</th>
          <th>Name</th>
          <th>Query</th>
          <th>Breaking?</th>
          <th></th>
        </thead>
        <tbody>
          {#each data.trending as trend, i}
            <tr on:click={() => handleToggle(i)}>
              <td><input type="checkbox" checked={selected.has(i)} /> </td>
              <td>{i + 1}</td>
              <td>{trend.name}</td>
              <td>{trend.query.text}</td>
              <td>{trend.isBreakingNews ? 'yes' : ''}</td>
              <td on:click|stopPropagation><a href={trend.newsSearchUrl} target="_blank">Search</a></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</main>
