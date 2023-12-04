<script lang="ts">
  import { enhance } from '$app/forms';
  import type { APITopic } from '$lib/bingNewsAPI/types';

  export let trends: APITopic[];

  let isSubmitting = false;
</script>

<form
  method="POST"
  use:enhance={() => {
    isSubmitting = true;

    return async ({ update }) => {
      await update();
      isSubmitting = false;
    };
  }}
>
  <input type="hidden" name="trends" value={JSON.stringify(trends)} />
  <button type="submit" class="button is-success" class:is-loading={isSubmitting}>Add selected</button>
</form>
