Vercel deployment notes

Required environment variables (set these in your Vercel project settings):

- VERCEL_BLOB_UPLOAD_URL: The HTTP(S) endpoint that accepts multipart `file` uploads. The backend will POST the file as `file` to this URL when local filesystem writes are unavailable.
- VERCEL_BLOB_TOKEN: Bearer token used for Authorization header when calling blob endpoints.
- VERCEL_BLOB_BASE_URL: Optional public base URL where uploaded files are served (used when upload response does not return an explicit `url`).
- VERCEL_BLOB_DELETE_URL: Optional endpoint to call with DELETE to remove uploaded files; if not provided the backend will attempt a DELETE against `VERCEL_BLOB_UPLOAD_URL` with a JSON body containing `file` and `url`.

Recommended values / examples

- `VERCEL_BLOB_UPLOAD_URL`: https://example-blob-service/upload
- `VERCEL_BLOB_TOKEN`: <your-token>
- `VERCEL_BLOB_BASE_URL`: https://cdn.example-blob-service.com
- `VERCEL_BLOB_DELETE_URL`: https://example-blob-service/delete

Notes

- The backend now defers creating the `uploads/` directory until startup and will continue to run without mounting local uploads if the filesystem is read-only (as on Vercel). In that case, uploads will be sent to the configured blob endpoint.
- Ensure your blob upload endpoint accepts multipart `file` field and returns JSON with a `url` property when possible.
- For deletion, the backend will call the configured delete URL (or send a DELETE to the upload URL) with a JSON body `{ "url": <file_url> }` or `{ "file": <filename>, "url": <file_url> }`.
