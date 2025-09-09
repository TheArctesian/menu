<script lang="ts">
  import type { ActionData } from "./$types";

  export let form: ActionData;
</script>

<div class="login">
  <div class="login-panel">
    <h1 class="title">Recipe Manager</h1>
    <p class="subtitle">Sign in to your account</p>

    <form method="post" action="?/login" class="form">
      <div class="field">
        <label for="email">Email Address</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="user@danielokita.com"
          value={form?.email ?? ""}
          required
        />
      </div>

      {#if form?.error}
        <div class="error">
          {form.error}
        </div>
      {/if}

      <button type="submit" class="submit-button"> Sign In </button>
    </form>
  </div>
</div>

