import { animate } from "motion";
import type { ObjectTarget } from "motion/react";
import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";

import { waitFor } from "../../../engine/utils/waitFor";
import {
  BACKGROUND_MUSIC,
  BASE_TITLE,
  ENTER_BONUS_BUTTON_TEXT,
  INITIAL_BALANCE,
  PRESS_TO_SPIN_SPINNING_TEXT,
  PRESS_TO_SPIN_TEXT,
  START_SPIN_FINAL_SOUND,
  START_SPIN_INITIL_SOUND,
  WON_RESULT_LABEL,
} from "../../entities/constants";
import { engine } from "../../getEngine";
import { PausePopup } from "../../popups/PausePopup";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Label";

import { GameHud } from "./components/GameHud";
import { SpinButton } from "./components/SpinButton";
import { Wheel } from "./components/Wheel";

/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];
  public mainContainer: Container;

  private baseContainer: Container;
  private bonusContainer: Container;

  private hud: GameHud;
  private wheel: Wheel;

  private baseTitle: Label;
  private enterBonusButton: Button;

  private spinButton: SpinButton;
  private pressToSpinLabel: Label;
  private resultLabel: Label;

  private balance = INITIAL_BALANCE;
  private lastWin = 0;
  private spinning = false;
  private inBonus = false;
  private paused = false;

  constructor() {
    super();

    this.mainContainer = new Container();
    this.addChild(this.mainContainer);

    this.hud = new GameHud();
    this.mainContainer.addChild(this.hud);

    this.baseContainer = new Container();
    this.mainContainer.addChild(this.baseContainer);

    this.bonusContainer = new Container();
    this.bonusContainer.alpha = 0;
    this.bonusContainer.visible = false;
    this.mainContainer.addChild(this.bonusContainer);

    this.baseTitle = new Label({
      text: BASE_TITLE,
      style: { fill: 0xffffff, fontSize: 62 },
    });
    this.baseContainer.addChild(this.baseTitle);

    this.enterBonusButton = new Button({
      text: ENTER_BONUS_BUTTON_TEXT,
      width: 220,
      height: 110,
    });
    this.enterBonusButton.onPress.connect(() => {
      void this.transitionToBonus();
    });
    this.baseContainer.addChild(this.enterBonusButton);

    this.pressToSpinLabel = new Label({
      text: PRESS_TO_SPIN_TEXT,
      style: { fill: 0xffffff, fontSize: 42 },
    });
    this.bonusContainer.addChild(this.pressToSpinLabel);

    this.resultLabel = new Label({
      text: "",
      style: { fill: 0xffe066, fontSize: 44 },
    });
    this.resultLabel.alpha = 0;
    this.bonusContainer.addChild(this.resultLabel);

    this.wheel = new Wheel();
    this.bonusContainer.addChild(this.wheel);

    this.spinButton = new SpinButton();
    this.spinButton.onPress.connect(() => {
      void this.startSpin();
    });
    this.bonusContainer.addChild(this.spinButton);
  }

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
    this.resultLabel.alpha = 0;
    this.resultLabel.text = "";
    this.pressToSpinLabel.alpha = 1;
    this.pressToSpinLabel.text = PRESS_TO_SPIN_TEXT;
    this.wheel.reset();
  }

  public resize(width: number, height: number) {
    const centerX = width * 0.5;

    this.hud.resize(width);

    this.baseTitle.position.set(centerX, height * 0.35);
    this.enterBonusButton.position.set(centerX, height * 0.62);

    this.bonusContainer.position.set(centerX, height * 0.5);
    this.pressToSpinLabel.position.set(0, -height * 0.34 - 20);
    this.wheel.position.set(0, 0);
    this.spinButton.position.set(0, height * 0.33);
    this.resultLabel.position.set(0, height * 0.22 + 20);
  }

  public async show(): Promise<void> {
    engine().audio.bgm.play(BACKGROUND_MUSIC, { volume: 0.5 });
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
    this.spinButton.setSpinning(true);
    this.enterBonusButton.enabled = false;
    this.resultLabel.alpha = 0;
    this.resultLabel.text = "";
    this.pressToSpinLabel.text = PRESS_TO_SPIN_SPINNING_TEXT;

    engine().audio.sfx.play(START_SPIN_INITIL_SOUND, { volume: 0.7 });
    const winner = await this.wheel.spinWeighted();

    this.lastWin = winner.amount;
    this.balance += winner.amount;
    this.refreshHud();

    engine().audio.sfx.play(START_SPIN_FINAL_SOUND, { volume: 0.9 });
    this.resultLabel.text = WON_RESULT_LABEL.replace(
      "{WON}",
      winner.amount.toFixed(2),
    );
    this.pressToSpinLabel.text = PRESS_TO_SPIN_TEXT;
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

    this.spinButton.setSpinning(false);
    this.enterBonusButton.enabled = true;
    this.spinning = false;
  }

  private refreshHud() {
    this.hud.setValues(this.balance, this.lastWin);
  }
}
