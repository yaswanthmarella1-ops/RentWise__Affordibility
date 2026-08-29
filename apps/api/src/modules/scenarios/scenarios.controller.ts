import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateScenarioDto, UpdateScenarioDto } from './dto/scenario.dto';
import { ScenariosService, type ScenarioResponse } from './scenarios.service';

@ApiTags('scenarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scenarios')
export class ScenariosController {
  constructor(private readonly scenarios: ScenariosService) {}

  @Get()
  @ApiOperation({ summary: "List the signed-in user's saved scenarios" })
  findAll(@CurrentUser('id') userId: string): Promise<ScenarioResponse[]> {
    return this.scenarios.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one saved scenario' })
  @ApiResponse({ status: 404, description: 'Not found, or owned by another user' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ScenarioResponse> {
    return this.scenarios.findOne(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Save a new scenario' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateScenarioDto,
  ): Promise<ScenarioResponse> {
    return this.scenarios.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename or update a saved scenario' })
  @ApiResponse({ status: 404, description: 'Not found, or owned by another user' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScenarioDto,
  ): Promise<ScenarioResponse> {
    return this.scenarios.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a saved scenario' })
  @ApiResponse({ status: 404, description: 'Not found, or owned by another user' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.scenarios.remove(userId, id);
  }
}
