import { IsInt, Max, Min } from "class-validator";

export class MainAnswerDto {
  @IsInt()
  questionId!: number;

  @IsInt()
  @Min(0)
  @Max(4)
  value!: number;
}
