export const apiHeaders = {
  "X-Linkoutpost-Worker": "api",
};

export const ssrHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "X-Linkoutpost-Worker": "ssr",
};

export function jsonError(message: string, status: number): Response {
  return Response.json(
    { error: message },
    {
      headers: apiHeaders,
      status,
    },
  );
}
