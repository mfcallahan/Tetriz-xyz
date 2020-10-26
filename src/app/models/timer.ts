export class Timer {
  start: number;
  elapsed: number;
  level: number;

  constructor(start: number, elapsed: number, level: number) {
    this.start = start;
    this.elapsed = elapsed;
    this.level = level;
  }
}
