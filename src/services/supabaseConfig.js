export const SUPABASE_URL = 'https://jrzvotlbiyvfegcmjvnw.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable__sR4iuu7LGYDijHmCuHPNA_tKmZutzE';

export const SUPABASE_PROFILE_BUCKET = 'profile-images';
export const SUPABASE_BILLS_BUCKET = 'bill-attachments';

export const uploadFileToSupabase = async (bucket, filePath, localUri, mimeType = 'image/jpeg') => {
  if (!bucket || !filePath || !localUri) {
    throw new Error('Missing Supabase upload parameters');
  }

  const fileResponse = await fetch(localUri);
  const blob = await fileResponse.blob();

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: blob,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase upload failed: ${response.status} ${errorText}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
};
