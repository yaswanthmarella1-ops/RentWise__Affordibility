import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CURRENCIES } from '@rentwise/shared';

const CURRENCY_CODES = Object.keys(CURRENCIES);

/** Upper bound on money fields — generous, but stops Decimal(14,2) overflow. */
const MAX_MONEY = 999_999_999;

export class SplitMemberDto {
  @ApiProperty({ example: 'You' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @ApiPropertyOptional({ example: 'Master with Bath' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  roomType?: string;

  @ApiProperty({ example: 33.3, minimum: 0, maximum: 100 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  sharePercent!: number;
}

export class CreateScenarioDto {
  @ApiProperty({ example: 'Koramangala 3BHK' })
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @ApiProperty({ example: 'INR', enum: CURRENCY_CODES })
  @IsIn(CURRENCY_CODES, { message: `currencyCode must be one of: ${CURRENCY_CODES.join(', ')}` })
  currencyCode!: string;

  // Mirrors validateInputs() in @rentwise/shared: rent and income must be
  // positive, utilities may be zero, target sits in 1..100.
  @ApiProperty({ example: 20000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1, { message: 'Rent must be greater than 0' })
  @Max(MAX_MONEY)
  rent!: number;

  @ApiProperty({ example: 4000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Utilities cannot be negative' })
  @Max(MAX_MONEY)
  utilities!: number;

  @ApiProperty({ example: 2, minimum: 0, maximum: 20 })
  @IsInt()
  @Min(0, { message: 'Roommates cannot be negative' })
  @Max(20)
  roommates!: number;

  @ApiProperty({ example: 50000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1, { message: 'Income must be greater than 0' })
  @Max(MAX_MONEY)
  income!: number;

  @ApiProperty({ example: 30, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  affordabilityTarget!: number;

  @ApiPropertyOptional({ type: [SplitMemberDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(21)
  @ValidateNested({ each: true })
  @Type(() => SplitMemberDto)
  splitMembers?: SplitMemberDto[];
}

export class UpdateScenarioDto extends PartialType(CreateScenarioDto) {}
