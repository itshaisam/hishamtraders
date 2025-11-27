export interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUomRequest {
  name: string;
  abbreviation: string;
  description?: string;
}

export interface UpdateUomRequest {
  name?: string;
  abbreviation?: string;
  description?: string;
  active?: boolean;
}
