import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auctionsApi } from '@/services/api';

// Query keys
export const auctionKeys = {
  all: ['auctions'] as const,
  lists: () => [...auctionKeys.all, 'list'] as const,
  list: (filters: object) => [...auctionKeys.lists(), filters] as const,
  myBids: () => [...auctionKeys.all, 'my-bids'] as const,
  detail: (id: string) => [...auctionKeys.all, 'detail', id] as const,
};

// Hook to get active auctions
export function useAuctions(filters?: { search?: string; skip?: number; limit?: number }) {
  return useQuery({
    queryKey: auctionKeys.list(filters || {}),
    queryFn: () => auctionsApi.getList(filters),
  });
}

// Hook to get my bids
export function useMyBids() {
  return useQuery({
    queryKey: auctionKeys.myBids(),
    queryFn: () => auctionsApi.getMyBids(),
  });
}

// Hook to get auction detail
export function useAuctionDetail(id: string) {
  return useQuery({
    queryKey: auctionKeys.detail(id),
    queryFn: () => auctionsApi.getDetail(id),
    enabled: !!id,
  });
}

// Hook to place bid
export function usePlaceBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, amount }: { itemId: string; amount: number }) =>
      auctionsApi.placeBid(itemId, { amount }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: auctionKeys.detail(variables.itemId) });
      queryClient.invalidateQueries({ queryKey: auctionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auctionKeys.myBids() });
    },
  });
}
