import { WheelSegment } from "./interfaces";

export const INITIAL_BALANCE = 1000;
export const TAU = Math.PI * 2;

export const SEGMENTS: WheelSegment[] = [
  { amount: 2.0, weight: 200 },
  { amount: 50.0, weight: 76 },
  { amount: 500.0, weight: 12 },
  { amount: 2.0, weight: 200 },
  { amount: 100.0, weight: 62 },
  { amount: 50.0, weight: 81 },
  { amount: 2.0, weight: 200 },
  { amount: 75.0, weight: 74 },
];

export const SEGMENT_COLORS = [
  0xff6b6b, 0xff922b, 0xffe066, 0x63e6be, 0x4dabf7, 0x9775fa, 0xf783ac,
  0x74c0fc,
];
