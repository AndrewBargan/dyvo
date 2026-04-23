import { SPIN_BUTTON_TEXT } from "../../../entities/constants";
import { Button } from "../../../ui/Button";

export class SpinButton extends Button {
  constructor() {
    super({ text: SPIN_BUTTON_TEXT, width: 220, height: 110 });
  }

  public setSpinning(isSpinning: boolean) {
    this.enabled = !isSpinning;
  }
}
