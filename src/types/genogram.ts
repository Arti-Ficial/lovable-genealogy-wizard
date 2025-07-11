
export type Gender = 'male' | 'female';

export type RelationshipStatus = 'married' | 'divorced' | 'conflicted' | 'separated';

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
  relationshipStatus?: RelationshipStatus; // Für Partner-Beziehungen
};

export type PersonalInfo = {
  name: string;
  birthDate: Date | undefined;
  gender: string;
  maritalStatus: string;
  purpose: string;
};
