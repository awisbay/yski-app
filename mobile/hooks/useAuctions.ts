import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auctionsApi } from '@/services/api';
import { API_ORIGIN } from '@/constants/config';

function resolveMediaUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/') && API_ORIGIN) return `${API_ORIGIN}${url}`;
  return url;
}

function normalizeAuction(raw: any) {
  if (!raw) return raw;
  const images = Array.isArray(raw.images)
    ? raw.images.map((img: any) => ({
        ...img,
        imageUrl: resolveMediaUrl(img.imageUrl ?? img.image_url),
      }))
    : [];
  return {
    ...raw,
    currentPrice: Number(raw.currentPrice ?? raw.current_price ?? 0),
    startingPrice: Number(raw.startingPrice ?? raw.starting_price ?? 0),
    minIncrement: Number(raw.minIncrement ?? raw.min_increment ?? 0),
    bidCount: raw.bidCount ?? raw.bid_count ?? 0,
    donorName: raw.donorName ?? raw.donor_name,
    winnerName: raw.winnerName ?? raw.winner_name,
    paymentStatus: raw.paymentStatus ?? raw.payment_status,
    paymentProofUrl: resolveMediaUrl(raw.paymentProofUrl ?? raw.payment_proof_url),
    winnerId: raw.winnerId ?? raw.winner_id,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    images,
    bids: Array.isArray(raw.bids)
      ? raw.bids.map((bid: any) => ({
          ...bid,
          bidderName: bid.bidderName ?? bid.bidder_name,
          reviewedBy: bid.reviewedBy ?? bid.reviewed_by,
          reviewedAt: bid.reviewedAt ?? bid.reviewed_at,
          amount: Number(bid.amount ?? 0),
        }))
      : [],
  };
}

export const auctionKeys = {
  all: ['auctions'] as const,
  lists: () => [...auctionKeys.all, 'list'] as const,
  list: (filters: object) => [...auctionKeys.lists(), filters] as const,
  myBids: () => [...auctionKeys.all, 'my-bids'] as const,
  detail: (id: string) => [...auctionKeys.all, 'detail', id] as const,
};

export function useAuctions(filters?: { search?: string; status?: 'ready' | 'bidding' | 'sold'; skip?: number; limit?: number }) {
  return useQuery({
    queryKey: auctionKeys.list(filters || {}),
    queryFn: () => auctionsApi.getList(filters).then((res) => ({
      ...res.data,
      items: (res.data?.items || []).map(normalizeAuction),
    })),
  });
}

export function useMyBids() {
  return useQuery({
    queryKey: auctionKeys.myBids(),
    queryFn: () => auctionsApi.getMyBids().then((res) => ({
      ...res.data,
      items: (res.data?.items || []).map(normalizeAuction),
    })),
  });
}

export function useAuctionDetail(id: string) {
  return useQuery({
    queryKey: auctionKeys.detail(id),
    queryFn: () => auctionsApi.getDetail(id).then((res) => normalizeAuction(res.data)),
    enabled: !!id,
  });
}

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

export function useUploadAuctionPhoto() {
  return useMutation({
    mutationFn: (formData: FormData) => auctionsApi.uploadPhoto(formData),
  });
}

export function useCreateAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => auctionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auctionKeys.lists() });
    },
  });
}

export function useApproveAuctionBid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, bidId }: { itemId: string; bidId: string }) => auctionsApi.approveBid(itemId, bidId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: auctionKeys.detail(vars.itemId) });
      queryClient.invalidateQueries({ queryKey: auctionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auctionKeys.myBids() });
    },
  });
}

export function useUploadAuctionPaymentProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, formData }: { itemId: string; formData: FormData }) => auctionsApi.uploadPaymentProof(itemId, formData),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: auctionKeys.detail(vars.itemId) });
      queryClient.invalidateQueries({ queryKey: auctionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auctionKeys.myBids() });
    },
  });
}

export function useVerifyAuctionPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: 'paid' | 'rejected' }) => auctionsApi.verifyPayment(itemId, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: auctionKeys.detail(vars.itemId) });
      queryClient.invalidateQueries({ queryKey: auctionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auctionKeys.myBids() });
    },
  });
}
