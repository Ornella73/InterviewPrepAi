export const notFound = (req, res, _next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (error, _req, res, _next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = error.message || "Unexpected server error";

  if (error?.name === "CastError") {
    message = "Invalid resource identifier";
  }

  if (error?.code === 11000) {
    const duplicateField = Object.keys(error.keyValue || {})[0];
    message = duplicateField ? `${duplicateField} already exists` : "Duplicate value already exists";
  }

  if (error?.type === "entity.parse.failed" || error instanceof SyntaxError) {
    statusCode = 400;
    message = "Invalid JSON payload";
  }

  res.status(statusCode).json({
    message
  });
};
