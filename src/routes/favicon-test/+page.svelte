<div class="container">
  <div class="row">
    <div class="guide">
      <img src="/favicon.svg" width="512" height="512" alt="favicon 512" />
    </div>
    <p class="label">512px (red line = center)</p>
  </div>
  <div class="row small">
    <div>
      <img src="/favicon.svg" width="128" height="128" alt="favicon 128" />
      <p class="label">128px</p>
    </div>
    <div>
      <img src="/favicon.svg" width="32" height="32" alt="favicon 32" />
      <p class="label">32px</p>
    </div>
    <div>
      <img src="/favicon.svg" width="16" height="16" alt="favicon 16" />
      <p class="label">16px</p>
    </div>
  </div>
</div>

<style>
  .container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 40px;
    background: #1a1a1a;
    padding: 40px;
  }
  .row {
    text-align: center;
  }
  .small {
    display: flex;
    gap: 40px;
    align-items: end;
  }
  .label {
    color: #999;
    font-size: 14px;
    margin-top: 8px;
  }
  .guide {
    position: relative;
    display: inline-block;
  }
  .guide::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(255, 0, 0, 0.5);
  }
</style>
