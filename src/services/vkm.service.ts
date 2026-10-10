import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString } from 'mongoose';
import type { FilterQuery, Model } from 'mongoose';
import { Vkm } from '../models/vkm.schema';

interface VkmWriteInput {
  code?: string;
  name?: string;
  ec?: number;
  level?: string;
  location?: string;
  description?: string;
}

interface VkmSearchInput {
  query?: string;
  ec?: number;
  level?: string;
  name?: string;
  location?: string;
}

function normalizeLevelOut(level?: string) {
  return level?.replace(/^NLQF(\d)$/i, 'NLQF-$1');
}

function toApiModel(doc: Vkm) {
  return {
    _id: doc._id.toHexString(),
    code: doc.code ?? doc.id ?? doc._id.toHexString(),
    name: doc.name,
    description: doc.shortdescription ?? doc.description ?? '',
    ec: Number(doc.ec) || undefined,
    level: normalizeLevelOut(doc.level),
    location: doc.location ?? null,
    contactId: doc.contact_id ?? null,
    learningoutcomes: doc.learningoutcomes ?? null,
  };
}

function toDbFromDto(dto: VkmWriteInput): Partial<Vkm> {
  const out: Partial<Vkm> = {};

  if (dto.code !== undefined) out.code = dto.code;
  if (dto.name !== undefined) out.name = dto.name;
  if (dto.ec !== undefined) out.ec = dto.ec;

  if (dto.level !== undefined) {
    out.level = dto.level.replace('-', '');
  }

  if (dto.location !== undefined) {
    out.location = dto.location;
  }

  if (dto.description !== undefined) {
    out.shortdescription = dto.description;
  }

  return out;
}

@Injectable()
export class VkmService {
  constructor(
    @InjectModel(Vkm.name)
    private readonly model: Model<Vkm>,
  ) {}

  async findAll(params: VkmSearchInput) {
    const filter: FilterQuery<Vkm> = {};

    if (params.ec !== undefined) {
      filter.ec = params.ec;
    }

    if (params.level) {
      filter.level = new RegExp(params.level.replace('-', ''), 'i');
    }

    if (params.name) {
      filter.name = new RegExp(params.name, 'i');
    }

    if (params.location) {
      filter.location = new RegExp(params.location, 'i');
    }

    if (params.query) {
      const search = new RegExp(params.query, 'i');

      filter.$or = [
        { name: search },
        { shortdescription: search },
        { description: search },
        { content: search },
        { learningoutcomes: search },
        { location: search },
      ];
    }

    const docs = await this.model.find(filter).limit(100).lean().exec();

    return docs.map((doc) => toApiModel(doc));
  }

  async findById(id: string) {
    if (isObjectIdOrHexString(id)) {
      const byMongo = await this.model.findById(id).lean().exec();

      if (byMongo) {
        return toApiModel(byMongo);
      }
    }

    const byCode = await this.model.findOne({ code: id }).lean().exec();

    if (byCode) {
      return toApiModel(byCode);
    }

    const bySchoolId = await this.model.findOne({ id }).lean().exec();

    return bySchoolId ? toApiModel(bySchoolId) : null;
  }

  async create(dto: VkmWriteInput) {
    const created = await this.model.create(toDbFromDto(dto));

    return toApiModel(created.toObject());
  }

  async update(id: string, dto: VkmWriteInput) {
    const updated = await this.model
      .findByIdAndUpdate(
        id,
        { $set: toDbFromDto(dto) },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();

    return updated ? toApiModel(updated) : null;
  }
}
