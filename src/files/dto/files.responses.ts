export interface UploadedFileResponse {
  id: string;
  userId: string;
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  status: string;
}

export interface UploadFilesResponse {
  count: number;
  files: UploadedFileResponse[];
}

export interface ListFilesResponse {
  count: number;
  files: UploadedFileResponse[];
}
