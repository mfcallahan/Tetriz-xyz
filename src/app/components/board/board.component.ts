import { Component, ViewChild, ElementRef, OnInit, HostListener } from '@angular/core';
import { KeyEvent } from '../../enums/keyEvent';
import { ITetromino } from '../../interfaces/iTetromino';
import { Tetromino } from '../../models/tetromino';
import { Timer } from '../../models/timer';
import { GameService } from '../../services/game.service';
import { Levels } from '../../models/levels';
import { colors } from '../../consts/colors';

@Component({
  selector: 'app-tetriz-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
})
export class BoardComponent implements OnInit {
  @ViewChild('board', { static: true })
  public canvas: ElementRef<HTMLCanvasElement>;
  public canvasContext: CanvasRenderingContext2D;
  public nextCanvasContext: CanvasRenderingContext2D;
  public points: number;
  public lines: number;
  public level: number;
  public board: number[][];
  public currentTetromino: Tetromino;
  public nextTetromino: Tetromino;
  // Use the spread operator to get a shallow copy and update coordinates the new position.
  public moves: any = {
    [KeyEvent.left]: (tetromino: ITetromino): ITetromino => ({ ...tetromino, x: tetromino.x - 1 }),
    [KeyEvent.right]: (tetromino: ITetromino): ITetromino => ({ ...tetromino, x: tetromino.x + 1 }),
    [KeyEvent.down]: (tetromino: ITetromino): ITetromino => ({ ...tetromino, y: tetromino.y + 1 }),
    [KeyEvent.space]: (tetromino: ITetromino): ITetromino => ({ ...tetromino, y: tetromino.y + 1 }),
    [KeyEvent.up]: (tetromino: ITetromino): ITetromino => this.gameService.rotate(tetromino),
  };
  private readonly numCols = 10;
  private readonly numRows = 20;
  private readonly blockSize = 30;
  private readonly linesPerLevel = 10;
  private timer: Timer;

  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (this.moves[event.key]) {
      event.preventDefault();
      let newPosition: ITetromino = this.moves[event.key](this.currentTetromino);

      if (event.key === KeyEvent.space.valueOf()) {
        while (this.gameService.moveIsValid(newPosition, this.numRows, this.numCols)) {
          this.currentTetromino.move(newPosition);
          newPosition = this.moves[KeyEvent.down](this.currentTetromino);
        }
      } else if (this.gameService.moveIsValid(newPosition, this.numRows, this.numCols)) {
        this.currentTetromino.move(newPosition);
      }

      this.canvasContext.clearRect(0, 0, this.canvasContext.canvas.width, this.canvasContext.canvas.height);
      this.animate();
    }
  }

  constructor(private gameService: GameService) {
    this.timer = new Timer(0, 0, 1000);
  }

  ngOnInit(): void {
    this.initBoard();
  }

  public start() {
    this.board = this.gameService.getEmptyBoard(this.numRows, this.numCols);
    this.currentTetromino = new Tetromino(this.canvasContext);
    this.animate();
  }

  private animate(now = 0) {
    this.timer.elapsed = now - this.timer.start;

    if (this.timer.elapsed > this.timer.level) {
      this.timer.start = now;
      this.drop();
    }

    this.draw();
    requestAnimationFrame(this.animate.bind(this));
  }

  private drop(): boolean {
    const tetromino = this.moves[KeyEvent.down](this.currentTetromino);

    if (this.gameService.moveIsValid(tetromino, this.numRows, this.numCols)) {
      this.currentTetromino.move(tetromino);
    } else {
      this.freeze();
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

  private draw() {
    this.canvasContext.clearRect(0, 0, this.canvasContext.canvas.width, this.canvasContext.canvas.height);
    this.currentTetromino.draw();
    this.drawBoard();
  }

  private freeze() {
    this.currentTetromino.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          this.board[y + this.currentTetromino.y][x + this.currentTetromino.x] = value;
        }
      });
    });
  }

  private drawBoard() {
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

  private clearLines() {
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

  private initBoard(): void {
    this.canvasContext = this.canvas.nativeElement.getContext('2d');
    this.canvasContext.canvas.width = this.numCols * this.blockSize;
    this.canvasContext.canvas.height = this.numRows * this.blockSize;
    this.canvasContext.scale(this.blockSize, this.blockSize);
  }
}
