import { Injectable } from '@angular/core';
import { Point } from 'src/app/enums/point';
import { ITetromino } from 'src/app/interfaces/iTetromino';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  public moveIsValid(tetromino: ITetromino, board: number[][], numRows: number, numCols: number): boolean {
    return tetromino.shape.every((row, dy) => {
      return row.every((value, dx) => {
        const x = tetromino.x + dx;
        const y = tetromino.y + dy;

        return (
          this.isEmpty(value) ||
          (this.insideWalls(x, numCols) && this.aboveFloor(y, numRows) && this.notOccupied(board, x, y))
        );
      });
    });
  }

  // Transpose the matrix; this method follows the Tetris Guideline for Super Rotation System:
  // https://tetris.fandom.com/wiki/SRS
  public rotateTetromino(currentTetromino: ITetromino): ITetromino {
    // Create a deep copy of the current piece
    const newPosition: ITetromino = JSON.parse(JSON.stringify(currentTetromino));

    for (let y = 0; y < newPosition.shape.length; ++y) {
      for (let x = 0; x < y; ++x) {
        [newPosition.shape[x][y], newPosition.shape[y][x]] = [newPosition.shape[y][x], newPosition.shape[x][y]];
      }
    }

    newPosition.shape.forEach((row) => row.reverse());

    return newPosition;
  }

  public getLinesClearedPoints(lines: number, level: number): number {
    const lineClearPoints =
      lines === 1
        ? Point.single
        : lines === 2
        ? Point.double
        : lines === 3
        ? Point.triple
        : lines === 4
        ? Point.tetris
        : 0;

    return (level + 1) * lineClearPoints;
  }

  private isEmpty(value: number): boolean {
    return value === 0;
  }

  private insideWalls(x: number, numCols: number): boolean {
    return x >= 0 && x < numCols;
  }

  private aboveFloor(y: number, numRows: number): boolean {
    return y <= numRows;
  }

  private notOccupied(board: number[][], x: number, y: number): boolean {
    return board[y] && board[y][x] === 0;
  }
}
