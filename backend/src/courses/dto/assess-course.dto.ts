import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AssessmentStatusInput {
  SAVED = 'SAVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ASSESSED = 'ASSESSED',
}

export class AssessCourseDto {
  @ApiProperty({ enum: AssessmentStatusInput })
  @IsEnum(AssessmentStatusInput)
  status!: AssessmentStatusInput;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
