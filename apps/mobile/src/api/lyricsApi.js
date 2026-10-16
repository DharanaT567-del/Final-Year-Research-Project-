import axiosClient from './axiosClient';

export async function createLyricsJob(file, targetLanguages, onUploadProgress) {
  const formData = new FormData();
  formData.append('file', {
    uri: file.fileCopyUri || file.uri,
    name: file.name || 'audio-upload',
    type: file.type || 'application/octet-stream',
  });
  formData.append('targetLanguages', targetLanguages.join(','));

  const response = await axiosClient.post('/api/v1/lyrics/jobs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    onUploadProgress,
  });
  return response.data;
}

export async function getLyricsJob(jobId) {
  const response = await axiosClient.get(`/api/v1/lyrics/jobs/${encodeURIComponent(jobId)}`);
  return response.data;
}

export function getLyricsApiError(error) {
  const responseMessage = error.response?.data?.message || error.response?.data?.error;
  if (responseMessage) return responseMessage;
  if (error.request) return 'Could not reach Naada. Check the connection and try again.';
  return 'The lyrics request could not be completed. Please try again.';
}