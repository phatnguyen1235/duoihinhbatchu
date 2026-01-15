import { z } from 'zod';

export const QrCodeSchema = z.object({
  code: z.string().min(1).max(64),
});

export const JoinRoomSchema = z.object({
  qrCodeId: z.coerce.number().int().positive(),
});

export const AnswerSchema = z.object({
  roomId: z.coerce.number().int().positive(),
  answerText: z.string().max(255),
});

export const RoomIdSchema = z.object({
  roomId: z.coerce.number().int().positive(),
});

export type QrCodeInput = z.infer<typeof QrCodeSchema>;
export type JoinRoomInput = z.infer<typeof JoinRoomSchema>;
export type AnswerInput = z.infer<typeof AnswerSchema>;
