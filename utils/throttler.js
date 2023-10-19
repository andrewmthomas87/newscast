export class Throttler {
  constructor(rps) {
    this.rps = rps;
    this.prevTime = null;
  }

  getWaitTime() {
    if (this.prevTime === null) {
      return 0;
    }

    const timeSincePrev = Date.now() - this.prevTime;
    const waitTime = Math.max(1000 / this.rps - timeSincePrev, 0);

    return waitTime;
  }

  async run(fn) {
    const waitTime = this.getWaitTime();
    if (waitTime > 0) {
      await Bun.sleep(waitTime);
    }

    const r = await fn();

    this.prevTime = Date.now();

    return r;
  }
}
