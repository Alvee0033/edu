import { IsString, MinLength, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchCoursesDto {
  @ApiProperty({ example: 'machine learning' })
  @IsString()
  @MinLength(2)
  query!: string;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(25)
  maxResults: number = 10;
}
