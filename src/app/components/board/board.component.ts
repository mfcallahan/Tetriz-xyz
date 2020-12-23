import { Component, ViewChild, ElementRef, OnInit, HostListener } from '@angular/core';
import { KeyEvent } from 'src/app/enums/keyEvent';
import { ITetromino } from 'src/app/interfaces/iTetromino';
import { Tetromino } from 'src/app/models/tetromino';
import { Timer } from 'src/app/models/timer';
import { GameService } from 'src/app/services/game.service';
import { Levels } from 'src/app/models/levels';
import { colors } from 'src/app/consts/colors';
import { Point } from 'src/app/enums/point';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
})
export class BoardComponent implements OnInit {
  @ViewChild('board', { static: true })
  public canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('next', { static: true })
  public canvasNext: ElementRef<HTMLCanvasElement>;
  public canvasContext: CanvasRenderingContext2D; // ctx
  public nextCanvasContext: CanvasRenderingContext2D; // ctxNext
  public points: number;
  public lines: number;
  public level: number;
  public highScore: number;

  public gameStarted: boolean;
  public requestId: number;
  public paused: boolean;
  public board: number[][];
  public currentTetromino: Tetromino; // piece
  public nextTetromino: Tetromino; // next
  private readonly numCols = 10;
  private readonly numRows = 20;
  private readonly blockSize = 30;
  private readonly linesPerLevel = 10;
  private timer: Timer; // time
  // Use the spread operator to get a shallow copy and update coordinates the new position.
  private moves: any = {
    [KeyEvent.left]: (tetromino: ITetromino): ITetromino => ({ ...tetromino, x: tetromino.x - 1 }),
    [KeyEvent.right]: (tetromino: ITetromino): ITetromino => ({ ...tetromino, x: tetromino.x + 1 }),
    [KeyEvent.down]: (tetromino: ITetromino): ITetromino => ({ ...tetromino, y: tetromino.y + 1 }),
    [KeyEvent.space]: (tetromino: ITetromino): ITetromino => ({ ...tetromino, y: tetromino.y + 1 }),
    [KeyEvent.up]: (tetromino: ITetromino): ITetromino => this.gameService.rotateTetromino(tetromino),
  };

  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (this.moves[event.key]) {
      if (event.key === KeyEvent.esc.valueOf()) {
        this.gameOver();
        return;
      }

      event.preventDefault();
      let newPosition: ITetromino = this.moves[event.key](this.currentTetromino);

      if (event.key === KeyEvent.space.valueOf()) {
        while (this.gameService.moveIsValid(newPosition, this.board, this.numRows, this.numCols)) {
          this.points += Point.hardDrop;
          this.currentTetromino.move(newPosition.x, newPosition.y, newPosition.shape);
          newPosition = this.moves[KeyEvent.down](this.currentTetromino);
        }
      } else if (this.gameService.moveIsValid(newPosition, this.board, this.numRows, this.numCols)) {
        this.currentTetromino.move(newPosition.x, newPosition.y, newPosition.shape);
        if (event.key === KeyEvent.down.valueOf()) {
          this.points += Point.softDrop;
        }
      }

      // this.canvasContext.clearRect(0, 0, this.canvasContext.canvas.width, this.canvasContext.canvas.height);
      // this.animate();
    }
  }

  constructor(private gameService: GameService) {
    this.timer = new Timer(0, 0, Levels[0]);
  }

  ngOnInit(): void {
    this.initBoard();
    this.resetGame();
    this.highScore = 0;
  }

  public start(): void {
    this.gameStarted = true;
    this.resetGame();

    this.currentTetromino = new Tetromino(this.canvasContext);
    this.nextTetromino = new Tetromino(this.canvasContext);
    this.nextTetromino.drawNext(this.nextCanvasContext);

    this.timer.start = performance.now();

    // If we have an old game running a game then cancel the old
    if (this.requestId) {
      cancelAnimationFrame(this.requestId);
    }

    this.animate();
  }

  public pause(): void {
    if (this.gameStarted) {
      if (this.paused) {
        this.animate();
      } else {
        this.canvasContext.font = '1px Arial';
        this.canvasContext.fillStyle = 'black';
        this.canvasContext.fillText('GAME PAUSED', 1.4, 4);
        cancelAnimationFrame(this.requestId);
      }

      this.paused = !this.paused;
    }
  }

  public gameOver(): void {
    // this.gameStarted = false;
    // cancelAnimationFrame(this.requestId);
    // this.highScore = this.points > this.highScore ? this.points : this.highScore;
    this.canvasContext.fillStyle = 'black';
    this.canvasContext.fillRect(1, 3, 8, 1.2);
    this.canvasContext.font = '1px Arial';
    this.canvasContext.fillStyle = 'red';
    this.canvasContext.fillText('GAME OVER', 1.8, 4);
  }

  private initBoard(): void {
    this.canvasContext = this.canvas.nativeElement.getContext('2d');
    this.canvasContext.canvas.width = this.numCols * this.blockSize;
    this.canvasContext.canvas.height = this.numRows * this.blockSize;
    this.scaleCanvasContextToBlockSize(this.canvasContext);

    this.nextCanvasContext = this.canvasNext.nativeElement.getContext('2d');
    // The + 2 is to allow for space to add the drop shadow to the next piece
    // TODO: fix magic numbers
    this.nextCanvasContext.canvas.width = 4 * this.blockSize + 2;
    this.nextCanvasContext.canvas.height = 4 * this.blockSize;

    this.scaleCanvasContextToBlockSize(this.nextCanvasContext);
  }

  private scaleCanvasContextToBlockSize(canvasContext: CanvasRenderingContext2D): void {
    canvasContext.scale(this.blockSize, this.blockSize);
  }

  private resetGame(): void {
    this.points = 0;
    this.lines = 0;
    this.level = 0;
    this.board = this.getEmptyBoard();
    this.timer = new Timer(0, 0, Levels[0]);
    this.paused = false;
    // this.addOutlines();
  }

  private getEmptyBoard(): number[][] {
    return Array.from({ length: this.numRows }, () => Array(this.numCols).fill(0));
  }

  private animate(now = 0): void {
    this.timer.elapsed = now - this.timer.start;

    if (this.timer.elapsed > this.timer.level) {
      this.timer.start = now;

      if (!this.dropTetromino()) {
        this.gameOver();
        return;
      }
    }

    this.draw();
    requestAnimationFrame(this.animate.bind(this));
  }

  private dropTetromino(): boolean {
    const newPosition: ITetromino = this.moves[KeyEvent.down](this.currentTetromino);

    if (this.gameService.moveIsValid(newPosition, this.board, this.numRows, this.numCols)) {
      this.currentTetromino.move(newPosition.x, newPosition.y, newPosition.shape);
    } else {
      this.freezeTetromino();
      this.clearLines();

      if (this.currentTetromino.y === 0) {
        // Game over!
        return false;
      }

      // this.playSoundFn([, , 224, 0.02, 0.02, 0.08, 1, 1.7, -13.9, , , , , , 6.7]);
      this.currentTetromino = this.nextTetromino;
      this.nextTetromino = new Tetromino(this.canvasContext);
      this.nextTetromino.drawNext(this.nextCanvasContext);
    }

    return true;
  }

  private draw(): void {
    this.canvasContext.clearRect(0, 0, this.canvasContext.canvas.width, this.canvasContext.canvas.height);
    this.currentTetromino.draw();
    this.drawBoard();
  }

  private drawBoard(): void {
    this.board.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          this.canvasContext.fillStyle = colors[value];
          this.canvasContext.fillRect(x, y, 1, 1);
          // this.add3D(x, y, value);
        }
      });
    });
    // this.addOutlines();
  }

  private freezeTetromino(): void {
    this.currentTetromino.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          this.board[y + this.currentTetromino.y][x + this.currentTetromino.x] = value;
        }
      });
    });
  }

  private clearLines(): void {
    let lines = 0;

    this.board.forEach((row, y) => {
      if (row.every((value) => value !== 0)) {
        lines++;
        this.board.splice(y, 1);
        this.board.unshift(Array(this.numCols).fill(0));
      }
    });

    if (lines > 0) {
      this.points += this.gameService.getLinesClearedPoints(lines, this.level);
      this.lines += lines;

      if (this.lines >= this.linesPerLevel) {
        this.level++;
        this.lines -= this.linesPerLevel;
        this.timer.level = Levels[this.level];
      }
    }
  }
}
