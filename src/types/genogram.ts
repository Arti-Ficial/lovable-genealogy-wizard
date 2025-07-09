
export type Gender = 'male' | 'female';

export type Person = {
  id: string;
  name: string;
  gender: Gender;
  birthDate: Date;
  deathDate?: Date;
  occupation?: string;
  notes?: string;
  relationship: 'self' | 'mother' | 'father' | 'sibling' | 'partner' | 'child';
  parentIds?: string[]; // IDs der Eltern dieser Person
  position: { x: number; y: number };
};

export type PersonalInfo = {
  name: string;
  birthDate: Date | undefined;
  gender: string;
  maritalStatus: string;
  purpose: string;
};
