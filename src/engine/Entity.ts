/*
 * src/engine/Entity.ts
 * ゲーム内エンティティの基底クラス
 * 全ゲームオブジェクト（Player, Enemy, エフェクト等）はこれを継承する
 * 関連: Game.ts（エンティティ管理）, Player.ts, Enemy.ts
 */

export class Entity {
  x: number = 0;
  y: number = 0;
  width: number = 32;
  height: number = 48;
  active: boolean = true;
  zIndex: number = 0;
  persistOnRestart: boolean = false;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  update(_dt: number): void {}
  render(_ctx: CanvasRenderingContext2D): void {}
  renderOverlay(_ctx: CanvasRenderingContext2D): void {}
}
