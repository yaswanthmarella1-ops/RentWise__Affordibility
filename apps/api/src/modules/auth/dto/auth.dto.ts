import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { AGE_GROUP_VALUES, CURRENCIES, OCCUPATION_VALUES } from '@rentwise/shared';

const CURRENCY_CODES = Object.keys(CURRENCIES);

/** Trims a string and converts blank input to undefined, so an empty optional
 *  form field is treated as "not supplied" rather than as an empty value. */
const emptyToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

/**
 * Optional profile fields. Every one of these may be omitted entirely — they
 * exist only to enrich the statistics, never to gate registration.
 */
export class ProfileFieldsDto {
  @ApiPropertyOptional({ example: 'Jyothi' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(emptyToUndefined)
  name?: string | null;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(emptyToUndefined)
  city?: string | null;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(emptyToUndefined)
  country?: string | null;

  @ApiPropertyOptional({ enum: OCCUPATION_VALUES })
  @IsOptional()
  @IsIn(OCCUPATION_VALUES as string[])
  @Transform(emptyToUndefined)
  occupation?: string | null;

  @ApiPropertyOptional({ enum: AGE_GROUP_VALUES })
  @IsOptional()
  @IsIn(AGE_GROUP_VALUES as string[])
  @Transform(emptyToUndefined)
  ageGroup?: string | null;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999_999_999)
  monthlyIncome?: number | null;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 21 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(21)
  householdSize?: number | null;

  @ApiPropertyOptional({ enum: CURRENCY_CODES, example: 'INR' })
  @IsOptional()
  @IsIn(CURRENCY_CODES)
  @Transform(emptyToUndefined)
  defaultCurrency?: string;
}

/** PATCH /auth/me — every field optional, so partial updates are the norm. */
export class UpdateProfileDto extends ProfileFieldsDto {}

export class RegisterDto extends ProfileFieldsDto {
  @ApiProperty({ example: 'jyothi@example.com' })
  @IsEmail({}, { message: 'A valid email address is required' })
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Str0ng!passphrase', minLength: 10 })
  @IsString()
  @MinLength(10, { message: 'Password must be at least 10 characters' })
  @MaxLength(128, { message: 'Password must be at most 128 characters' })
  @Matches(/[a-z]/, { message: 'Password must contain a lowercase letter' })
  @Matches(/[A-Z]/, { message: 'Password must contain an uppercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain a number' })
  password!: string;

  // `name`, `city`, `country`, `occupation`, `ageGroup`, `monthlyIncome`,
  // `householdSize` and `defaultCurrency` are inherited from ProfileFieldsDto
  // and are all optional.
}

export class LoginDto {
  @ApiProperty({ example: 'jyothi@example.com' })
  @IsEmail({}, { message: 'A valid email address is required' })
  @Transform(({ value }) => String(value).trim().toLowerCase())
  email!: string;

  @ApiProperty({ example: 'Str0ng!passphrase' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password!: string;
}

export class AuthUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() defaultCurrency!: string;
  @ApiProperty() createdAt!: Date;

  // Optional profile — null whenever the user chose not to supply it.
  @ApiProperty({ nullable: true }) name!: string | null;
  @ApiProperty({ nullable: true }) city!: string | null;
  @ApiProperty({ nullable: true }) country!: string | null;
  @ApiProperty({ nullable: true }) occupation!: string | null;
  @ApiProperty({ nullable: true }) ageGroup!: string | null;
  @ApiProperty({ nullable: true, type: Number }) monthlyIncome!: number | null;
  @ApiProperty({ nullable: true, type: Number }) householdSize!: number | null;

  @ApiProperty({ description: 'How much of the optional profile is filled in' })
  profileCompletion!: {
    filledCount: number;
    totalCount: number;
    percent: number;
    missing: Array<{ key: string; label: string; unlocks: string }>;
  };
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token — send as `Authorization: Bearer <token>`' })
  accessToken!: string;

  @ApiProperty({ description: 'Seconds until the access token expires' })
  expiresIn!: number;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
