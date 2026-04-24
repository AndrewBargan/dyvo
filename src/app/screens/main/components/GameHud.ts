import { Container } from "pixi.js";
import { RoundedBox } from "../../../ui/RoundedBox";
import { Label } from "../../../ui/Label";
import { BALANCE_TITLE, WIN_TITLE } from "../../../entities/constants";

export class GameHud extends Container {
  private balanceBox: RoundedBox;
  private winBox: RoundedBox;
  private balanceValueLabel: Label;
  private winValueLabel: Label;

  constructor() {
    super();

    this.balanceBox = new RoundedBox({ width: 210, height: 88, shadow: false });
    this.winBox = new RoundedBox({ width: 210, height: 88, shadow: false });
    this.addChild(this.balanceBox, this.winBox);

    const balanceTitle = new Label({
      text: BALANCE_TITLE,
      style: { fill: 0x4a4a4a, fontSize: 20 },
    });
    balanceTitle.y = -18;
    this.balanceBox.addChild(balanceTitle);

    this.balanceValueLabel = new Label({
      text: "0.00",
      style: { fill: 0x111111, fontSize: 28 },
    });
    this.balanceValueLabel.y = 14;
    this.balanceBox.addChild(this.balanceValueLabel);

    const winTitle = new Label({
      text: WIN_TITLE,
      style: { fill: 0x4a4a4a, fontSize: 20 },
    });
    winTitle.y = -18;
    this.winBox.addChild(winTitle);

    this.winValueLabel = new Label({
      text: "0.00",
      style: { fill: 0x111111, fontSize: 28 },
    });
    this.winValueLabel.y = 14;
    this.winBox.addChild(this.winValueLabel);
  }

  public resize(width: number): void {
    const centerX = width * 0.5;
    this.balanceBox.position.set(centerX - 130, 72);
    this.winBox.position.set(centerX + 130, 72);
  }

  public setValues(balance: number, win: number): void {
    this.balanceValueLabel.text = this.formatAmount(balance);
    this.winValueLabel.text = this.formatAmount(win);
  }

  private formatAmount(amount: number): string {
    return amount.toFixed(2);
  }
}
