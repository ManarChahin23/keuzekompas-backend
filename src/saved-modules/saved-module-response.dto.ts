import { ApiProperty } from '@nestjs/swagger';

export class ModuleSummaryDto {
  @ApiProperty()
  _id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: String, nullable: true })
  location!: string | null;

  @ApiProperty({ type: String, nullable: true })
  level!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  ec!: number | null;
}

export class SavedModuleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    description: 'Verwijzing naar de module in MongoDB.',
  })
  moduleId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;
}

export class SavedModuleWithDetailsDto extends SavedModuleResponseDto {
  @ApiProperty({
    type: ModuleSummaryDto,
    nullable: true,
    description: 'Modulegegevens, of null als de module niet meer bestaat.',
  })
  module!: ModuleSummaryDto | null;
}

export class RemoveSavedModuleResponseDto {
  @ApiProperty({
    description:
      'Bevestiging dat de module uit de persoonlijke lijst is verwijderd.',
  })
  message!: string;
}
