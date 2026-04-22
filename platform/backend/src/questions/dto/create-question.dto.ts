import { QuestionPhase } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateQuestionDto {
  @IsString()
  text!: string;

  @IsEnum(QuestionPhase)
  phase!: QuestionPhase;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  clusterId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  readinessWeights?: number[];
}
