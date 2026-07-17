import { useQuery } from "@tanstack/react-query";
import { fetchMyPatientProfile } from "@/lib/api/patients";

export function usePatient() {
  return useQuery({
    queryKey: ["patients", "me"],
    queryFn: fetchMyPatientProfile,
    staleTime: 60_000,
  });
}
