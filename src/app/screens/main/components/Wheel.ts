import { animate } from "motion";
import { Container, Graphics, Text } from "pixi.js";
import {
  SEGMENTS,
  TAU,
  WHEEL_RADIUS,
  WHEEL_SPINNING_DURATION,
} from "../../../entities/constants";
import { WheelSegment } from "../../../entities/interfaces";

export class Wheel extends Container {
  private wheelContainer: Container;

  constructor() {
    super();

    this.wheelContainer = new Container();
    this.addChild(this.wheelContainer);

    this.wheelContainer.addChild(this.createWheelDisc(WHEEL_RADIUS));
    this.addChild(this.createPointer());

    this.wheelContainer.y = -20;
  }

  public reset(): void {
    this.wheelContainer.rotation = 0;
  }

  public resize(width: number, height: number): void {
    const maxDiameter = Math.min(width * 0.84, height * 0.5);
    const baseDiameter = WHEEL_RADIUS * 2;
    const responsiveScale = maxDiameter / baseDiameter;
    const clampedScale = Math.max(0.58, Math.min(1, responsiveScale));
    this.scale.set(clampedScale);
  }

  public async spinWeighted(): Promise<WheelSegment> {
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

    await animate(
      this.wheelContainer,
      { rotation: this.wheelContainer.rotation + spinAmount },
      {
        duration: WHEEL_SPINNING_DURATION,
        ease: [0.06, 0.9, 0.22, 1],
      },
    );

    return winner;
  }

  private createWheelDisc(radius: number): Graphics {
    const g = new Graphics();
    const sliceAngle = TAU / SEGMENTS.length;

    for (let i = 0; i < SEGMENTS.length; i++) {
      const startAngle = -Math.PI / 2 + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const segment = SEGMENTS[i];

      g.moveTo(0, 0)
        .arc(0, 0, radius, startAngle, endAngle)
        .lineTo(0, 0)
        .fill({ color: segment.color })
        .stroke({ width: 3, color: 0x2b2b2b, alpha: 0.85 });

      const mid = startAngle + sliceAngle * 0.5;
      const amountLabel = new Text({
        text: this.formatAmount(segment.amount),
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
      .moveTo(0, -291)
      .lineTo(-26, -343)
      .lineTo(26, -343)
      .lineTo(0, -291)
      .fill({ color: 0xffffff })
      .stroke({ width: 3, color: 0x1f1f1f });
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
}
