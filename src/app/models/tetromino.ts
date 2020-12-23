import { ITetromino } from 'src/app/interfaces/iTetromino';
import { colors } from 'src/app/consts/colors';
import { shapes } from 'src/app/consts/shapes';

export class Tetromino implements ITetromino {
  x: number;
  y: number;
  color: string;
  shape: number[][];

  constructor(private canvasContext: CanvasRenderingContext2D) {
    this.spawn();
  }

  public draw() {
    this.canvasContext.fillStyle = this.color.valueOf();
    this.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          // this.x & this.y are tetromino's position on the board
          // x & y position are the positions of the shape
          this.canvasContext.fillRect(this.x + x, this.y + y, 1, 1);
        }
      });
    });
  }

  public drawNext(nextCanvasContext: CanvasRenderingContext2D) {
    nextCanvasContext.clearRect(0, 0, nextCanvasContext.canvas.width, nextCanvasContext.canvas.height);
    this.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          this.addNextShadow(nextCanvasContext, x, y);
        }
      });
    });

    nextCanvasContext.fillStyle = this.color;
    this.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          nextCanvasContext.fillStyle = this.color;
          const currentX = x + 0.025;
          const currentY = y + 0.025;
          nextCanvasContext.fillRect(currentX, currentY, 1 - 0.025, 1 - 0.025);
          // this.add3D(nextCanvasContext, currentX, currentY);
        }
      });
    });
  }

  public move(newX: number, newY: number, newShape: number[][]) {
    this.x = newX;
    this.y = newY;
    this.shape = newShape;
  }

  private spawn() {
    const typeId = this.getRandomTetromino();
    this.color = colors[typeId];
    this.shape = shapes[typeId];
    // TODO: fix magic numbers here
    this.x = typeId === 4 ? 4 : 3;
    this.y = 0;
  }

  private getRandomTetromino(): number {
    const totalNumTetrominos = shapes.length - 1;
    return Math.floor(Math.random() * totalNumTetrominos + 1);
  }

  private addNextShadow(canvas: CanvasRenderingContext2D, x: number, y: number): void {
    canvas.fillStyle = 'black';
    canvas.fillRect(x, y, 1.025, 1.025);
  }
}
