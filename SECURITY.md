# Security Notes

- Never commit `.env` or production secrets.
- Passwords are hashed with bcrypt.
- Authentication uses HTTP-only cookies.
- File uploads have type/size validation in the API layer.
- Rate limiting and CORS are enabled.
- Financial records are scoped by authenticated user.
- Forecasts and anomaly scores are explicitly estimates/indicators, not financial or fraud determinations.
