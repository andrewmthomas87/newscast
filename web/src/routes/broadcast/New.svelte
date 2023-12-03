<script lang="ts">
  import { enhance } from '$app/forms';

  let isSubmitting = false;
</script>

<form
  action="?/new"
  method="POST"
  use:enhance={() => {
    isSubmitting = true;

    return async ({ update }) => {
      await update();
      isSubmitting = false;
    };
  }}
>
  <button type="submit" class="button is-success" class:is-loading={isSubmitting}>New</button>
</form>
