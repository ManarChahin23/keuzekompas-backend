import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import type { AuthRequest } from '../auth/auth-request';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModuleIdDto } from './module-id.dto';
import { SavedModulesService } from './saved-modules.service';
import {
  SavedModuleResponseDto,
  SavedModuleWithDetailsDto,
  RemoveSavedModuleResponseDto,
} from './saved-module-response.dto';

@ApiTags('Mijn modules')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'JWT ontbreekt, is ongeldig of is verlopen.',
})
@Controller('saved-modules')
@UseGuards(JwtAuthGuard)
export class SavedModulesController {
  constructor(private readonly savedModulesService: SavedModulesService) {}

  @Post()
  @ApiOperation({
    summary: 'Een module bewaren in je persoonlijke lijst',
  })
  @ApiBody({ type: ModuleIdDto })
  @ApiCreatedResponse({ type: SavedModuleResponseDto })
  @ApiBadRequestResponse({
    description: 'moduleId is geen geldig MongoDB-ID.',
  })
  @ApiNotFoundResponse({
    description: 'De module bestaat niet.',
  })
  @ApiConflictResponse({
    description: 'De module staat al in je persoonlijke lijst.',
  })
  save(@Req() request: AuthRequest, @Body() dto: ModuleIdDto) {
    return this.savedModulesService.save(request.user.id, dto.moduleId);
  }

  @Get()
  @ApiOperation({
    summary: 'Je eigen bewaarde modules ophalen',
    description: 'De gebruiker wordt bepaald vanuit het gecontroleerde JWT.',
  })
  @ApiOkResponse({
    type: SavedModuleWithDetailsDto,
    isArray: true,
  })
  findMine(@Req() request: AuthRequest) {
    return this.savedModulesService.findMine(request.user.id);
  }

  @Delete(':moduleId')
  @ApiOperation({
    summary: 'Een module verwijderen uit je persoonlijke lijst',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'Het MongoDB-ID van de module.',
    schema: {
      type: 'string',
      pattern: '^[a-fA-F0-9]{24}$',
    },
  })
  @ApiOkResponse({ type: RemoveSavedModuleResponseDto })
  @ApiBadRequestResponse({
    description: 'moduleId is geen geldig MongoDB-ID.',
  })
  @ApiNotFoundResponse({
    description: 'De module staat niet in jouw persoonlijke lijst.',
  })
  remove(@Req() request: AuthRequest, @Param() dto: ModuleIdDto) {
    return this.savedModulesService.remove(request.user.id, dto.moduleId);
  }
}
