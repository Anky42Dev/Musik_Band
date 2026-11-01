export type Specialization = 'vocals' | 'guitar' | 'bass' | 'drums' | 'keys' | 'other';

export interface Profile {
  first_name: string;
  specialization: Specialization;
  specialization_display: string;
  bio: string;
  fee: string;
}

export interface UserProfile {
  id: number;
  username: string;
  profile: Profile;
}

export interface SpecializationChoice {
  value: Specialization;
  label: string;
}

export type ProfilePatch = Partial<Pick<Profile, 'first_name' | 'specialization' | 'bio' | 'fee'>>;

export interface Credentials {
  username: string;
  password: string;
}
