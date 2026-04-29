/** FastAPI standard validation error shapes (OpenAPI HTTPValidationError). */

export type ValidationError = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

export type HTTPValidationError = {
  detail?: ValidationError[];
};
