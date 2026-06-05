// Placeholder for the output of:
//   supabase gen types typescript --project-id <id> > src/types/database.ts
// Run that once the Supabase project exists. Until then this hand-written shape
// mirrors detstream-otterwatch/supabase/migrations/0001_init.sql so the app type-checks.
// The deployment owns the schema; regenerate it instead of editing by hand

// These are `type` aliases, not interfaces, on purpose: supabase-js's GenericTable
// constraint needs each Row assignable to Record<string, unknown>, which a type alias
// satisfies via its implicit index signature but an interface does not
export type Sighting = {
  id: string;
  cam_id: string;
  started_at: string;
  ended_at: string | null;
  confidence: number | null;
  thumbnail: string | null;
  detector: string | null;
};

export type Cam = {
  id: string;
  name: string;
  youtube_url: string;
  enabled: boolean;
};

export interface Database {
  public: {
    Tables: {
      sightings: {
        Row: Sighting;
        Insert: Partial<Sighting>;
        Update: Partial<Sighting>;
        Relationships: [];
      };
      cams: {
        Row: Cam;
        Insert: Partial<Cam>;
        Update: Partial<Cam>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
