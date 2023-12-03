<script lang="ts">
  import { enhance } from '$app/forms';

  export let broadcastID: number;

  let isSubmitting = false;
</script>

<form
  action="?/delete"
  method="POST"
  use:enhance={() => {
    isSubmitting = true;

    return async ({ update }) => {
      await update();
      isSubmitting = false;
    };
  }}
>
  <input type="hidden" name="broadcast-id" value={broadcastID} />
  <button class="button is-small is-danger is-inverted" class:is-loading={isSubmitting}>Delete</button>
</form>
