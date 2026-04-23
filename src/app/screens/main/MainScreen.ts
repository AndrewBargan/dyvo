import { animate } from "motion";
import type { ObjectTarget } from "motion/react";
import type { Ticker } from "pixi.js";
import { Container, Graphics, Text } from "pixi.js";

import { engine } from "../../getEngine";
import { PausePopup } from "../../popups/PausePopup";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Label";
import { RoundedBox } from "../../ui/RoundedBox";
import { waitFor } from "../../../engine/utils/waitFor";

type WheelSegment = {
  amount: number;
  weight: number;
};

const SEGMENTS: WheelSegment[] = [
  { amount: 2.0, weight: 200 },
  { amount: 50.0, weight: 76 },
  { amount: 500.0, weight: 12 },
  { amount: 2.0, weight: 200 },
  { amount: 100.0, weight: 62 },
  { amount: 50.0, weight: 81 },
  { amount: 2.0, weight: 200 },
  { amount: 75.0, weight: 74 },
];

const INITIAL_BALANCE = 1000;
const TAU = Math.PI * 2;

/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];
  public mainContainer: Container;

  private hudContainer: Container;
  private baseContainer: Container;
  private bonusContainer: Container;
  private wheelContainer: Container;

  private balanceBox: RoundedBox;
  private winBox: RoundedBox;
  private balanceValueLabel: Label;
  private winValueLabel: Label;

  private baseTitle: Label;
  private enterBonusButton: Button;

  private spinButton: Button;
  private pressToSpinLabel: Label;
  private resultLabel: Label;

  private pointer: Graphics;
  private wheelDisc: Graphics;

  private balance = INITIAL_BALANCE;
  private lastWin = 0;
  private spinning = false;
  private inBonus = false;
  private paused = false;

  constructor() {
    super();

    this.mainContainer = new Container();
    this.addChild(this.mainContainer);

    this.hudContainer = new Container();
    this.mainContainer.addChild(this.hudContainer);

    this.baseContainer = new Container();
    this.mainContainer.addChild(this.baseContainer);

    this.bonusContainer = new Container();
    this.bonusContainer.alpha = 0;
    this.bonusContainer.visible = false;
    this.mainContainer.addChild(this.bonusContainer);

    this.wheelContainer = new Container();
    this.bonusContainer.addChild(this.wheelContainer);

    this.balanceBox = new RoundedBox({ width: 210, height: 88, shadow: false });
    this.winBox = new RoundedBox({ width: 210, height: 88, shadow: false });
    this.hudContainer.addChild(this.balanceBox, this.winBox);

    const balanceTitle = new Label({
      text: "BALANCE",
      style: { fill: 0x4a4a4a, fontSize: 20 },
    });
    balanceTitle.y = -18;
    this.balanceBox.addChild(balanceTitle);

    this.balanceValueLabel = new Label({
      text: this.formatAmount(this.balance),
      style: { fill: 0x111111, fontSize: 28 },
    });
    this.balanceValueLabel.y = 14;
    this.balanceBox.addChild(this.balanceValueLabel);

    const winTitle = new Label({
      text: "WIN",
      style: { fill: 0x4a4a4a, fontSize: 20 },
    });
    winTitle.y = -18;
    this.winBox.addChild(winTitle);

    this.winValueLabel = new Label({
      text: this.formatAmount(this.lastWin),
      style: { fill: 0x111111, fontSize: 28 },
    });
    this.winValueLabel.y = 14;
    this.winBox.addChild(this.winValueLabel);

    this.baseTitle = new Label({
      text: "Lucky Wheel Bonus",
      style: { fill: 0xffffff, fontSize: 62 },
    });
    this.baseContainer.addChild(this.baseTitle);

    this.enterBonusButton = new Button({
      text: "Play",
      width: 220,
      height: 110,
    });
    this.enterBonusButton.onPress.connect(() => {
      void this.transitionToBonus();
    });
    this.baseContainer.addChild(this.enterBonusButton);

    this.pressToSpinLabel = new Label({
      text: "Press to spin",
      style: { fill: 0xffffff, fontSize: 42 },
    });
    this.bonusContainer.addChild(this.pressToSpinLabel);

    this.resultLabel = new Label({
      text: "",
      style: { fill: 0xffe066, fontSize: 44 },
    });
    this.resultLabel.alpha = 0;
    this.bonusContainer.addChild(this.resultLabel);

    this.wheelDisc = this.createWheelDisc(270);
    this.wheelContainer.addChild(this.wheelDisc);

    this.pointer = this.createPointer();
    this.bonusContainer.addChild(this.pointer);

    this.spinButton = new Button({ text: "Spin", width: 220, height: 110 });
    this.spinButton.onPress.connect(() => {
      void this.startSpin();
    });
    this.bonusContainer.addChild(this.spinButton);
  }

  public prepare() {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {
    if (this.paused) return;
  }

  public async pause() {
    this.interactiveChildren = false;
    this.paused = true;
  }

  public async resume() {
    this.interactiveChildren = true;
    this.paused = false;
  }

  public reset() {
    this.spinning = false;
    this.inBonus = false;
    this.bonusContainer.alpha = 0;
    this.bonusContainer.visible = false;
    this.baseContainer.alpha = 1;
    this.baseContainer.visible = true;
    this.wheelContainer.rotation = 0;
    this.resultLabel.alpha = 0;
    this.resultLabel.text = "";
    this.pressToSpinLabel.alpha = 1;
  }

  public resize(width: number, height: number) {
    const centerX = width * 0.5;

    this.balanceBox.position.set(centerX - 130, 72);
    this.winBox.position.set(centerX + 130, 72);

    this.baseTitle.position.set(centerX, height * 0.35);
    this.enterBonusButton.position.set(centerX, height * 0.62);

    this.bonusContainer.position.set(centerX, height * 0.5);
    this.pressToSpinLabel.position.set(0, -height * 0.34 - 20);
    this.wheelContainer.position.set(0, -20);
    this.pointer.position.set(0, -318);
    this.spinButton.position.set(0, height * 0.33);
    this.resultLabel.position.set(0, height * 0.22 + 20);
  }

  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });
    this.refreshHud();

    this.alpha = 0;
    await animate(this, { alpha: 1 } as ObjectTarget<this>, {
      duration: 0.35,
      ease: "linear",
    });
  }

  public async hide(): Promise<void> {
    await animate(this, { alpha: 0 } as ObjectTarget<this>, {
      duration: 0.2,
      ease: "linear",
    });
  }

  public blur() {
    if (!engine().navigation.currentPopup) {
      void engine().navigation.presentPopup(PausePopup);
    }
  }

  private createWheelDisc(radius: number): Graphics {
    const g = new Graphics();
    const sliceAngle = TAU / SEGMENTS.length;
    const colors = [
      0xff6b6b, 0xff922b, 0xffe066, 0x63e6be, 0x4dabf7, 0x9775fa, 0xf783ac,
      0x74c0fc,
    ];

    for (let i = 0; i < SEGMENTS.length; i++) {
      const startAngle = -Math.PI / 2 + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      g.moveTo(0, 0)
        .arc(0, 0, radius, startAngle, endAngle)
        .lineTo(0, 0)
        .fill({ color: colors[i] })
        .stroke({ width: 3, color: 0x2b2b2b, alpha: 0.85 });

      const mid = startAngle + sliceAngle * 0.5;
      const amountLabel = new Text({
        text: this.formatAmount(SEGMENTS[i].amount),
        style: {
          fontFamily: "Arial Rounded MT Bold",
          fontSize: 30,
          fill: 0x111111,
          align: "center",
        },
      });
      amountLabel.anchor.set(0.5);
      amountLabel.position.set(
        Math.cos(mid) * radius * 0.68,
        Math.sin(mid) * radius * 0.68,
      );
      amountLabel.rotation = mid + Math.PI * 0.5;
      g.addChild(amountLabel);
    }

    const centerPin = new Graphics()
      .circle(0, 0, 44)
      .fill({ color: 0xffffff })
      .stroke({ width: 4, color: 0x1f1f1f });

    g.addChild(centerPin);

    return g;
  }

  private createPointer(): Graphics {
    return new Graphics()
      .moveTo(0, 0)
      .lineTo(-26, -52)
      .lineTo(26, -52)
      .lineTo(0, 0)
      .fill({ color: 0xffffff })
      .stroke({ width: 3, color: 0x1f1f1f });
  }

  private async transitionToBonus(): Promise<void> {
    if (this.inBonus || this.spinning) return;

    this.inBonus = true;
    this.bonusContainer.visible = true;
    this.bonusContainer.alpha = 0;
    this.bonusContainer.y += 36;

    animate(
      this.baseContainer,
      { alpha: 0 },
      { duration: 0.25, ease: "linear" },
    );
    await animate(
      this.bonusContainer,
      { alpha: 1, y: this.bonusContainer.y - 36 },
      { duration: 0.35, ease: "easeOut" },
    );

    this.baseContainer.visible = false;
  }

  private async transitionToBase(): Promise<void> {
    this.baseContainer.visible = true;
    this.baseContainer.alpha = 0;
    this.baseContainer.y += 20;

    animate(
      this.bonusContainer,
      { alpha: 0 },
      { duration: 0.25, ease: "linear" },
    );
    await animate(
      this.baseContainer,
      { alpha: 1, y: this.baseContainer.y - 20 },
      { duration: 0.35, ease: "easeOut" },
    );

    this.bonusContainer.visible = false;
    this.inBonus = false;
  }

  private async startSpin(): Promise<void> {
    if (!this.inBonus || this.spinning) return;

    this.spinning = true;
    this.spinButton.enabled = false;
    this.enterBonusButton.enabled = false;
    this.resultLabel.alpha = 0;
    this.resultLabel.text = "";
    this.pressToSpinLabel.text = "Spinning...";

    const winnerIndex = this.pickWeightedSegmentIndex();
    const winner = SEGMENTS[winnerIndex];

    const sliceAngle = TAU / SEGMENTS.length;
    const targetAngle = (TAU - (winnerIndex + 0.5) * sliceAngle) % TAU;
    const currentNorm = ((this.wheelContainer.rotation % TAU) + TAU) % TAU;
    const baseDelta =
      targetAngle >= currentNorm
        ? targetAngle - currentNorm
        : TAU - currentNorm + targetAngle;
    const fullTurns = 5 + Math.floor(Math.random() * 2);
    const spinAmount = baseDelta + fullTurns * TAU;

    engine().audio.sfx.play("main/sounds/button.wav", { volume: 0.7 });
    await animate(
      this.wheelContainer,
      { rotation: this.wheelContainer.rotation + spinAmount },
      {
        duration: 4.2,
        ease: [0.06, 0.9, 0.22, 1],
      },
    );

    this.lastWin = winner.amount;
    this.balance += winner.amount;
    this.refreshHud();

    engine().audio.sfx.play("main/sounds/final.wav", { volume: 0.9 });
    this.resultLabel.text = `You won ${this.formatAmount(winner.amount)}`;
    this.pressToSpinLabel.text = "Press to spin";
    await animate(
      this.resultLabel,
      { alpha: 1 },
      { duration: 0.3, ease: "linear" },
    );

    await animate(
      this.resultLabel.scale,
      { x: 1.08, y: 1.08 },
      { duration: 0.16, ease: "easeOut" },
    );
    await animate(
      this.resultLabel.scale,
      { x: 1, y: 1 },
      { duration: 0.16, ease: "easeIn" },
    );

    await waitFor(1.1);
    await this.transitionToBase();

    this.spinButton.enabled = true;
    this.enterBonusButton.enabled = true;
    this.spinning = false;
  }

  private pickWeightedSegmentIndex(): number {
    const totalWeight = SEGMENTS.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;

    for (let i = 0; i < SEGMENTS.length; i++) {
      roll -= SEGMENTS[i].weight;
      if (roll <= 0) {
        return i;
      }
    }

    return SEGMENTS.length - 1;
  }

  private formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  private refreshHud() {
    this.balanceValueLabel.text = this.formatAmount(this.balance);
    this.winValueLabel.text = this.formatAmount(this.lastWin);
  }
}
