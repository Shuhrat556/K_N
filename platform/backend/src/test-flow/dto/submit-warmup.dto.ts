import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, Max, Min, ValidateNested } from "class-validator";

export class WarmupAnswerItemDto {
  @IsInt()
  questionId!: number;

  @IsInt()
  @Min(0)
  @Max(2)
  choiceIndex!: number;
}

export class SubmitWarmupDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WarmupAnswerItemDto)
  answers!: WarmupAnswerItemDto[];
}
