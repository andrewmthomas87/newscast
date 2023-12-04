<script lang="ts">
  import { enhance } from '$app/forms';

  export let topicID: number;

  let isSubmitting = false;
</script>

<form
  action="?/delete-topic"
  method="POST"
  use:enhance={() => {
    isSubmitting = true;

    return async ({ update }) => {
      await update();
      isSubmitting = false;
    };
  }}
>
  <input type="hidden" name="topic-id" value={topicID} />

  <button class="button is-small is-danger is-inverted" class:is-loading={isSubmitting}>Delete</button>
</form>
