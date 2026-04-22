import { FacultyMode, FacultyType } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class FilterFacultiesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  clusterId?: number;

  @IsOptional()
  @IsString()
  cluster?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsEnum(FacultyType)
  type?: FacultyType;

  @IsOptional()
  @IsEnum(FacultyMode)
  mode?: FacultyMode;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  margin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(500)
  take?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  skip?: number;
}
