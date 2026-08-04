// BEHAVIOR: Custom hooks for managing user profile querying and mutations using TanStack Query.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// BACKEND_CONNECTION: Axios API helper for backend requests
import api from '../utils/api';
// BEHAVIOR: Auth context provider hook to update state in the navigation and layout components
import { useAuth } from '../context/AuthContext';
// BEHAVIOR: Local cache helper to get and set fallback values in localStorage
import { getCachedData, setCachedData } from '../utils/cache';

/**
 * useProfile - Centralized hook to fetch user profile data.
 * Displays latest cached information and triggers background updates reactively.
 */
export const useProfile = () => {
  // BEHAVIOR: Queries current user's profile details
  return useQuery({
    // BEHAVIOR: Profile query key identifier
    queryKey: ['profile'],
    // BACKEND_CONNECTION: GET /users/me - Syncs current user profile details from the database
    queryFn: async () => {
      const response = await api.get('/users/me');
      if (!response.data.success) {
        throw new Error('Failed to fetch profile data');
      }
      const data = response.data.data;
      // BEHAVIOR: Caches profile data segment locally
      setCachedData('profile', data);
      return data;
    },
    // BEHAVIOR: Supplies initial profile cache from localStorage
    initialData: () => {
      const cached = getCachedData('profile');
      return cached?.data;
    },
    // BEHAVIOR: Supplies cache timestamp
    initialDataUpdatedAt: () => {
      const cached = getCachedData('profile');
      return cached?.timestamp;
    },
    // BEHAVIOR: Stale time of 5 minutes. User profiles update infrequently
    staleTime: 5 * 60 * 1000, // 5 minutes cache stale time
    refetchOnWindowFocus: false,
  });
};

/**
 * Converts a File object to a base64 data: URL string.
 * Used as the guaranteed fallback when Cloudinary is not configured.
 */
const fileToBase64 = (file) => {
  // BEHAVIOR: Standard FileReader promise wrapper for base64 encoding
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * useUpdateProfile - Hook to execute profile updates.
 * Upload strategy (in order of priority):
 * 1. Cloudinary unsigned upload (if VITE_CLOUDINARY_CLOUD_NAME is configured)
 * 2. Local backend multipart upload (if Cloudinary fails)  
 * 3. Base64 inline embed (guaranteed fallback — always persists to MongoDB)
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  // BEHAVIOR: Exposes profile modification mutation
  return useMutation({
    mutationFn: async ({ userData, selectedFile }) => {
      let profilePicUrl = userData.profilePic;

      // ─── Step 1: Handle image upload if a new file was selected ───────────
      if (selectedFile) {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        // Try Cloudinary first if both env vars are configured
        if (cloudName && uploadPreset) {
          try {
            console.log(`[Cloudinary] Uploading to cloud "${cloudName}" with preset "${uploadPreset}"...`);
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('upload_preset', uploadPreset);

            // BACKEND_CONNECTION: POST to Cloudinary API to host user avatars on a CDN
            const cloudinaryResponse = await fetch(
              `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
              { method: 'POST', body: formData }
            );

            if (cloudinaryResponse.ok) {
              const cloudinaryData = await cloudinaryResponse.json();
              profilePicUrl = cloudinaryData.secure_url;
              console.log('[Cloudinary] Upload success. CDN URL:', profilePicUrl);
            } else {
              throw new Error(`Cloudinary responded with ${cloudinaryResponse.status}`);
            }
          } catch (cloudinaryError) {
            console.warn('[Cloudinary] Upload failed, falling back to local upload:', cloudinaryError.message);
            profilePicUrl = null; // Signal to use fallback
          }
        }

        // ─── Fallback A: Try local multipart backend upload ───────────────
        if (!profilePicUrl || profilePicUrl === userData.profilePic) {
          try {
            const localFormData = new FormData();
            if (userData.firstName) localFormData.append('firstName', userData.firstName);
            if (userData.lastName) localFormData.append('lastName', userData.lastName);
            if (userData.phone) localFormData.append('phone', userData.phone);
            localFormData.append('profilePic', selectedFile);

            // BACKEND_CONNECTION: PATCH /users/update-me - Submits multipart form-data to local Node server
            const localResponse = await api.patch('/users/update-me', localFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (localResponse.data.success) {
              console.log('[LocalUpload] Multipart upload to backend succeeded.');
              // Backend processed and saved the image — return the result directly
              const savedUser = localResponse.data.data;
              return savedUser;
            } else {
              throw new Error('Local backend upload response indicated failure');
            }
          } catch (localError) {
            console.warn('[LocalUpload] Multipart upload failed, using base64 fallback:', localError.message);
            // ─── Fallback B: Convert to base64 and save as JSON ───────────
            try {
              profilePicUrl = await fileToBase64(selectedFile);
              console.log('[Base64] Converted image to base64 inline data URL. Length:', profilePicUrl.length);
            } catch (b64Error) {
              console.error('[Base64] Conversion failed. Profile pic will not be updated.', b64Error);
              profilePicUrl = userData.profilePic; // Keep old value
            }
          }
        }
      }

      // ─── Step 2: Save profile metadata + resolved image URL as JSON ────────
      const payload = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        profilePic: profilePicUrl,
      };

      console.log('[updateMe] Sending JSON update with profilePic type:', 
        profilePicUrl?.startsWith('data:') ? 'base64' : 
        profilePicUrl?.startsWith('http') ? 'URL' : 'unchanged'
      );

      // BACKEND_CONNECTION: PATCH /users/update-me - Submits JSON payload to update fields in MongoDB
      const response = await api.patch('/users/update-me', payload);
      if (!response.data.success) {
        throw new Error('Failed to update profile metadata');
      }
      return response.data.data;
    },

    onSuccess: (updatedUser) => {
      // Force immediate cache invalidation so ProfilePage re-fetches fresh data
      // BEHAVIOR: Invalidates profile queries in React Query cache client
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.setQueryData(['profile'], updatedUser);
      setCachedData('profile', updatedUser);

      // Instantly synchronize top navigation layout state without waiting for refetch
      // BEHAVIOR: Propagates changes to the Auth Context provider
      updateUser(updatedUser);

      console.log('[useUpdateProfile] Profile update success. profilePic stored:', 
        updatedUser?.profilePic ? updatedUser.profilePic.substring(0, 80) + '...' : 'none'
      );
    },

    onError: (error) => {
      console.error('[useUpdateProfile] Mutation error:', error);
    },
  });
};

export default useProfile;
