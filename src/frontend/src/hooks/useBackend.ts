// Hook to get the backend actor for direct API calls
import { useActor } from "./useActor";
import { backendInterface } from "../backend.d";

export function useBackend(): { actor: backendInterface | null; isReady: boolean } {
  const { actor, isFetching } = useActor();
  return {
    actor: actor as backendInterface | null,
    isReady: !!actor && !isFetching,
  };
}
