import { WheelSegment } from "./interfaces";

export const INITIAL_BALANCE = 1000;
export const TAU = Math.PI * 2;
export const WHEEL_RADIUS = 270;
export const WHEEL_SPINNING_DURATION = 5;

export const SEGMENTS: WheelSegment[] = [
  { amount: 2.0, weight: 200, color: 0xff6b6b },
  { amount: 50.0, weight: 76, color: 0xff922b },
  { amount: 500.0, weight: 12, color: 0xffe066 },
  { amount: 2.0, weight: 200, color: 0x63e6be },
  { amount: 100.0, weight: 62, color: 0x4dabf7 },
  { amount: 50.0, weight: 81, color: 0x9775fa },
  { amount: 2.0, weight: 200, color: 0xf783ac },
  { amount: 75.0, weight: 74, color: 0x74c0fc },
];

export const BASE_TITLE = "Lucky Wheel Bonus";
export const ENTER_BONUS_BUTTON_TEXT = "Play";
export const PRESS_TO_SPIN_TEXT = "Press to spin";
export const PRESS_TO_SPIN_SPINNING_TEXT = "Spinning...";
export const SPIN_BUTTON_TEXT = "Spin";
export const BALANCE_TITLE = "BALANCE";
export const WIN_TITLE = "WIN";
export const WON_RESULT_LABEL = `You won {WON}`;

export const BACKGROUND_MUSIC = "main/sounds/bgm-main.mp3";
export const START_SPIN_INITIAL_SOUND = "main/sounds/button.wav";
export const START_SPIN_FINAL_SOUND = "main/sounds/final.wav";
