import { Injectable } from '@angular/core';
import { Point } from 'src/app/enums/point';
import { ITetromino } from 'src/app/interfaces/iTetromino';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  public getEmptyBoard(numRows: number, numCols: number): number[][] {
    return Array.from({ length: numRows }, () => Array(numCols).fill(0));
  }

  public moveIsValid(tetromino: ITetromino, numRows: number, numCols: number): boolean {
    return tetromino.shape.every((row, y) => {
      return row.every(
        (value, x) => value === 0 || (tetromino.x + x >= 0 && tetromino.x + x < numCols && tetromino.y + y < numRows)
      );
    });
  }

  // This method follows the Tetris Guideline for Super Rotation System:
  // https://tetris.fandom.com/wiki/SRS
  public rotate(currentTetromino: ITetromino): ITetromino {
    const newTetromino: ITetromino = JSON.parse(JSON.stringify(currentTetromino));
    for (let y = 0; y < newTetromino.shape.length; ++y) {
      for (let x = 0; x < y; ++x) {
        [newTetromino.shape[x][y], newTetromino.shape[y][x]] = [newTetromino.shape[y][x], newTetromino.shape[x][y]];
      }
    }

    newTetromino.shape.forEach((row) => row.reverse());

    return newTetromino;
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
}
