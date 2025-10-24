import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Vkm } from '../models/vkm.schema';

function normalizeLevelOut(level?: string) {
  if (!level) return undefined;
  // DB kan “NLQF5” hebben; API toont “NLQF-5”
  return level.replace(/^NLQF(\d)$/i, 'NLQF-$1');
}

// DB naar API
function toApiModel(doc: any) {
  
  return {
    _id: doc._id,
    code: String(doc.code),           
    name: doc.name,
    description: doc.shortdescription ?? doc.description ?? '',
    ec: Number(doc.ec) || undefined,
    level: normalizeLevelOut(doc.level),
    location: doc.location ?? null,
    contactId: doc.contact_id ?? null,
    learningOutcomes: doc.learningOutcomes ?? null, 
  };
}

// API naar DB (bij POST/PATCH)
function toDbFromDto(dto: {
  code?: string;
  name?: string;
  ec?: number;
  level?: string;          
  description?: string;
  location?: string;
  learningOutcomes?: string;
}) {
  const out: any = {};
  if (dto.code !== undefined) out.code = dto.code;
  if (dto.name !== undefined) out.name = dto.name;
  if (dto.ec !== undefined) out.ec = Number(dto.ec);
  if (dto.level !== undefined) out.level = dto.level.replace('-', ''); 
  if (dto.location !== undefined) out.location = dto.location; 
  if (dto.learningOutcomes !== undefined) out.learningOutcomes = dto.learningOutcomes;
  if (dto.description !== undefined) {
    // je kunt het in 'shortdescription' of 'description' stoppen; kies er één
    out.shortdescription = dto.description;
  }
  return out;
}

@Injectable()
export class VkmService {
  constructor(@InjectModel(Vkm.name) private model: Model<Vkm>) {}

  async findAll(params: { query?: string; ec?: number; level?: string; name?: string; location?: string; }) {
  const filter: FilterQuery<Vkm> = {};

  if (params.ec !== undefined) filter.ec = Number(params.ec);
  if (params.level) filter.level = new RegExp(params.level.replace('-', ''), 'i');
  if (params.name) filter.name = new RegExp(params.name, 'i');
  if (params.location) filter.location = new RegExp(params.location, 'i');  

  if (params.query) {
    filter.$or = [
      { name: new RegExp(params.query, 'i') },
      { shortdescription: new RegExp(params.query, 'i') },
      { description: new RegExp(params.query, 'i') },
      { content: new RegExp(params.query, 'i') },
      { learningOutcomes: new RegExp(params.query, 'i') },
      { location: new RegExp(params.query, 'i') },
    ];
  }

  const docs = await this.model.find(filter).limit(100).lean();
  return docs.map(toApiModel);
}

  async findById(id: string) {
    const byMongo = await this.model.findById(id).lean();
    if (byMongo) return toApiModel(byMongo);
    const byCode = await this.model.findOne({ code: id }).lean(); // eerst eigen 'code'
    if (byCode) return toApiModel(byCode);
    const bySchoolId = await this.model.findOne({ id }).lean();   // legacy CSV 'id'
    return bySchoolId ? toApiModel(bySchoolId) : null;
  }

  async create(dto: any) {
    const toDb = toDbFromDto(dto);
    const created = await this.model.create(toDb);
    return toApiModel(created.toObject());
  }

  async update(id: string, dto: any) {
    const toDb = toDbFromDto(dto);
    const updated = await this.model
      .findByIdAndUpdate(id, { $set: toDb }, { new: true })
      .lean();
    return updated ? toApiModel(updated) : null;
  }
}
