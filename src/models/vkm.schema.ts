
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'vkm_modules' })
export class Vkm extends Document {
  @Prop() code?: string;
  @Prop() name: string;
  @Prop() shortdescription?: string;
  @Prop() description?: string;
  @Prop() content?: string;
  @Prop() ec?: number;
  @Prop() location?: string;
  @Prop() contact_id?: string;
  @Prop() level?: string;
  @Prop() learningOutcomes?: string;
}
export const VkmSchema = SchemaFactory.createForClass(Vkm);
