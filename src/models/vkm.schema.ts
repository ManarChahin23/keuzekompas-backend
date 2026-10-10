import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'vkm_modules' })
export class Vkm {
  declare _id: Types.ObjectId;
  declare id?: string;

  @Prop()
  code?: string;

  @Prop()
  name!: string;

  @Prop()
  shortdescription?: string;

  @Prop()
  description?: string;

  @Prop()
  content?: string;

  @Prop()
  ec?: number;

  @Prop()
  location?: string;

  @Prop()
  contact_id?: string;

  @Prop()
  level?: string;

  @Prop()
  learningoutcomes?: string;

  @Prop()
  learningOutcomes?: string;
}

export const VkmSchema = SchemaFactory.createForClass(Vkm);
