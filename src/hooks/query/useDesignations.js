import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDesignation,
  fetchDesignations,
  updateDesignation,
} from "../../api/designationApi";

const RESOURCE_STALE_TIME = 5 * 60 * 1000;

export const designationQueryKeys = {
  all: ["designations"],
  lists: () => [...designationQueryKeys.all, "list"],
  list: () => [...designationQueryKeys.lists()],
};

export const useDesignations = (options = {}) =>
  useQuery({
    queryKey: designationQueryKeys.list(),
    queryFn: fetchDesignations,
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? RESOURCE_STALE_TIME,
  });

export const useDesignation = useDesignations;

export const useCreateDesignation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDesignation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: designationQueryKeys.all }),
  });
};

export const useUpdateDesignation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateDesignation(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: designationQueryKeys.all }),
  });
};

export const useDeleteDesignation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => ({ id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: designationQueryKeys.all }),
  });
};
